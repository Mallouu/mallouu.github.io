/* Calcul des marées à partir des fichiers bruts du SHOM.
   - PBM : prédictions pleines/basses mers à la bouée d'entrée de la Baie de Somme
   - VRA : corrections à appliquer pour chaque port (heures et hauteurs)
   Les pleines mers sont reconnues à leur coefficient (les basses mers n'en ont pas).
   La correction de hauteur est interpolée entre mortes-eaux (coef. 45) et vives-eaux (coef. 95),
   comme le préconise le SHOM. Une pleine mer décalée après minuit passe bien au jour suivant. */
(function (global) {
  const versMinutes = h => { const [a, b] = h.split(":").map(Number); return a * 60 + b; };
  const versHeure = m => { m = ((Math.round(m) % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
  const jourIso = ms => new Date(ms).toISOString().slice(0, 10);
  const debutJour = iso => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));

  /* Fichier PBM : date <tab> (heure, hauteur, coef) x 4 */
  function lirePBM(texte) {
    const lignes = texte.replace(/^﻿/, "").split(/\r?\n/);
    const site = (lignes.find(l => /^Site\s*:/i.test(l)) || "").replace(/^Site\s*:\s*/i, "").trim();
    const marees = [];
    for (const l of lignes) {
      const c = l.split("\t").map(s => s.trim());
      if (!/^\d{4}-\d\d-\d\d$/.test(c[0])) continue;
      for (let i = 1; i + 2 <= c.length - 1 + 1; i += 3) {
        const h = c[i], haut = c[i + 1], coef = c[i + 2];
        if (!h || h === "--:--" || !haut || haut === "---") continue;
        const pm = coef && coef !== "---";
        marees.push({ t: debutJour(c[0]) + versMinutes(h) * 60000, type: pm ? "PM" : "BM", hauteur: parseFloat(haut), coef: pm ? parseInt(coef, 10) : null });
      }
    }
    if (!marees.length) throw new Error("Aucune marée trouvée : vérifiez qu'il s'agit bien du fichier de prédictions (PBM) du SHOM.");
    marees.sort((a, b) => a.t - b.t);
    return { site, annee: new Date(marees[Math.floor(marees.length / 2)].t).getUTCFullYear(), marees };
  }

  /* Fichier VRA : nom du port, 4 corrections d'heure (PMVE PMME BMME BMVE), 4 corrections de hauteur en cm */
  function lireVRA(texte) {
    const ports = [];
    for (const l of texte.split(/\r?\n/)) {
      const m = l.match(/^(\S.*?)\s{2,}(.*)$/);
      if (!m || /corrections|type de la|PMVE|^-+$/i.test(l)) continue;
      const jetons = m[2].trim().split(/\s+/);
      const heures = []; let k = 0;
      while (heures.length < 4 && k < jetons.length) {
        if (jetons[k] === "--") { heures.push(null); k++; continue; }
        const signe = jetons[k].startsWith("-") ? -1 : 1;
        const h = Math.abs(parseInt(jetons[k], 10)), mn = parseInt(jetons[k + 1], 10);
        if (isNaN(h) || isNaN(mn)) break;
        heures.push(signe * (h * 60 + mn)); k += 2;
      }
      const hauteurs = jetons.slice(k, k + 4).map(j => j === "--" ? null : parseInt(j, 10));
      if (heures.length === 4 && hauteurs.length === 4 && hauteurs.every(h => h === null || !isNaN(h))) {
        ports.push({ nom: m[1].trim(), pmve: { dt: heures[0], dh: hauteurs[0] }, pmme: { dt: heures[1], dh: hauteurs[1] } });
      }
    }
    return ports;
  }

  /* Corrections connues pour Saint-Valery-sur-Somme (VRA 2026), utilisées si aucun fichier VRA n'est fourni */
  const SAINT_VALERY = { nom: "Saint-Valery-sur-Somme", pmve: { dt: 30, dh: 50 }, pmme: { dt: 30, dh: 35 } };

  /* Pleines mers au port choisi, avec hauteur, coefficient et marnage */
  function pleinesMersAuPort(pbm, port, reglages) {
    const coefME = reglages && reglages.coefME || 45, coefVE = reglages && reglages.coefVE || 95;
    const res = [];
    pbm.marees.forEach((m, i) => {
      if (m.type !== "PM") return;
      const f = (m.coef - coefME) / (coefVE - coefME);
      const interp = (a, b) => a + (b - a) * f;
      const dt = interp(port.pmme.dt || 0, port.pmve.dt || 0);
      const dh = interp(port.pmme.dh || 0, port.pmve.dh || 0) / 100;
      const t = m.t + Math.round(dt) * 60000;
      let bm = null;
      for (let j = i - 1; j >= 0; j--) if (pbm.marees[j].type === "BM") { bm = pbm.marees[j]; break; }
      res.push({
        date: jourIso(t), minutes: Math.round((t - debutJour(jourIso(t))) / 60000),
        heure: versHeure((t - debutJour(jourIso(t))) / 60000),
        hauteur: Math.round((m.hauteur + dh) * 100) / 100, coef: m.coef,
        hauteurBouee: m.hauteur, marnage: bm ? Math.round((m.hauteur - bm.hauteur) * 100) / 100 : null
      });
    });
    return res;
  }

  /* Jours fériés français de l'année (calcul de Pâques par l'algorithme de Meeus) */
  function joursFeries(a) {
    const b = a % 19, c = Math.floor(a / 100), d = a % 100, e = Math.floor(c / 4), f = c % 4, g = Math.floor((c + 8) / 25),
      h = Math.floor((c - g + 1) / 3), i = (19 * b + c - e - h + 15) % 30, k = Math.floor(d / 4), l = d % 4,
      m = (32 + 2 * f + 2 * k - i - l) % 7, n = Math.floor((b + 11 * i + 22 * m) / 451),
      mois = Math.floor((i + m - 7 * n + 114) / 31), jour = ((i + m - 7 * n + 114) % 31) + 1;
    const paques = Date.UTC(a, mois - 1, jour), plus = j => jourIso(paques + j * 86400000);
    const fixe = (mm, jj) => `${a}-${String(mm).padStart(2, "0")}-${String(jj).padStart(2, "0")}`;
    return {
      [fixe(1, 1)]: "Jour de l'an", [plus(0)]: "Pâques", [plus(1)]: "Lundi de Pâques", [fixe(5, 1)]: "Fête du travail",
      [fixe(5, 8)]: "Victoire 1945", [plus(39)]: "Ascension", [plus(49)]: "Pentecôte", [plus(50)]: "Lundi de Pentecôte",
      [fixe(7, 14)]: "Fête nationale", [fixe(8, 15)]: "Assomption", [fixe(11, 1)]: "Toussaint", [fixe(11, 11)]: "Armistice", [fixe(12, 25)]: "Noël"
    };
  }

  /* Week-ends, ponts et jours fériés de l'année, regroupés en blocs de jours consécutifs */
  function blocsWeekEnds(annee, feries) {
    const jours = [];
    for (let t = Date.UTC(annee, 0, 1); new Date(t).getUTCFullYear() === annee; t += 86400000) {
      const iso = jourIso(t), js = new Date(t).getUTCDay();
      const veille = jourIso(t - 86400000), lendemain = jourIso(t + 86400000);
      let motif = null;
      if (js === 0 || js === 6) motif = "week-end";
      if (feries[iso]) motif = "férié";
      else if (js === 5 && feries[veille]) motif = "pont";      // vendredi après un jeudi férié
      else if (js === 1 && feries[lendemain]) motif = "pont";   // lundi avant un mardi férié
      if (motif) jours.push({ date: iso, jourSemaine: js, motif, ferie: feries[iso] || null });
    }
    const blocs = [];
    jours.forEach(j => {
      const dernier = blocs[blocs.length - 1];
      if (dernier && jourIso(debutJour(dernier.jours[dernier.jours.length - 1].date) + 86400000) === j.date) dernier.jours.push(j);
      else blocs.push({ jours: [j] });
    });
    blocs.forEach(b => {
      b.long = b.jours.length >= 3;
      b.feries = b.jours.filter(j => j.ferie).map(j => j.ferie);
    });
    return blocs;
  }

  /* Évalue chaque pleine mer d'un jour selon les réglages : créneau, plage de jour, critère */
  function evaluerJour(pms, r) {
    return pms.map(pm => {
      const debut = pm.minutes - r.avant * 60, fin = pm.minutes + r.apres * 60;
      const deJour = debut >= versMinutes(r.plageDebut) && fin <= versMinutes(r.plageFin);
      const valeur = r.critere === "coef" ? pm.coef : r.critere === "marnage" ? pm.marnage : pm.hauteur;
      return { ...pm, debut: versHeure(debut), fin: versHeure(fin), deJour, valeur, favorable: deJour && valeur !== null && valeur >= r.seuil };
    });
  }

  const api = { lirePBM, lireVRA, pleinesMersAuPort, joursFeries, blocsWeekEnds, evaluerJour, SAINT_VALERY, versMinutes, versHeure };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else global.Marees = api;
})(this);
