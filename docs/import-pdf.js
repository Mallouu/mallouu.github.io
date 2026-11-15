/* Analyse d'un calendrier PDF de manifestations (format « manifestations 2026 V4 »).
   Entrée : les morceaux de texte du PDF avec leur position {x, y, str, page}.
   Sortie : une liste d'événements, chacun avec une liste de points « à vérifier ».
   Fichier partagé par le site (navigateur) et les tests (node). */
(function (global) {
  const MOIS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  const RE_DATE = /(\d{1,2})\s+(janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[ée]cembre)\s+(\d{4})/i;
  const RE_HEURE = /^(\d{1,2}):(\d{2})$/;
  const RE_JOUR = /^(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)$/i;

  const normMois = m => m.toLowerCase().replace("fevrier","février").replace("aout","août").replace("decembre","décembre");
  const iso = (j, m, a) => `${a}-${String(MOIS.indexOf(normMois(m)) + 1).padStart(2, "0")}-${String(j).padStart(2, "0")}`;
  const hh = (h, m) => `${String(h).padStart(2, "0")}:${m}`;
  const lendemain = d => { const t = new Date(d + "T12:00"); t.setDate(t.getDate() + 1); return t.toISOString().slice(0, 10); };

  function devinerCategorie(titre) {
    const t = titre.toLowerCase();
    if (/repas|assembl|remise des prix|soir[ée]e|f[êe]te/.test(t)) return "club";
    if (/flot+ille|dieppe|boulogne|honfleur|angleterre|croisi|a\/r|escale/.test(t)) return "croisiere";
    if (/rallye|sortie|p[êe]che|[ée]chouage|balade/.test(t)) return "sortie";
    if (/printemps|automne|r[ée]gate|troph|challenge|coupe|double|championnat/.test(t)) return "regate";
    return "";
  }

  function analyser(items) {
    // 1. Repérer les colonnes grâce aux en-têtes
    const entete = s => items.find(i => i.str.trim().toLowerCase().startsWith(s));
    const hManif = entete("manifestation");
    const heures = items.filter(i => /^heure$/i.test(i.str.trim())).sort((a, b) => a.x - b.x);
    const xDebut = heures[0] ? heures[0].x : null, xFin = heures[1] ? heures[1].x : null;
    const xRemarque = hManif ? hManif.x + 120 : Infinity;

    // 2. Regrouper les morceaux de texte en lignes (même page, même hauteur)
    const lignes = [];
    items.filter(i => i.str.trim()).sort((a, b) => (a.page - b.page) || (b.y - a.y) || (a.x - b.x)).forEach(i => {
      const l = lignes.find(l => l.page === i.page && Math.abs(l.y - i.y) < 3);
      if (l) l.items.push(i); else lignes.push({ page: i.page, y: i.y, items: [i] });
    });
    lignes.forEach(l => l.items.sort((a, b) => a.x - b.x));

    // 3. Lire chaque ligne
    const lignesDatees = [], orphelines = [];
    for (const l of lignes) {
      const texte = l.items.map(i => i.str.trim()).join(" ");
      if (/calendrier|sport nautique|heure|manifestation\/|^d[ée]but( fin)?$|^fin$/i.test(texte) && !RE_DATE.test(texte)) continue;
      const m = texte.match(RE_DATE);
      const r = { page: l.page, y: l.y, debut: "", fin: "", titre: [], remarque: [] };
      for (const i of l.items) {
        const s = i.str.trim();
        if (RE_JOUR.test(s) || RE_DATE.test(s)) continue;
        const h = s.match(RE_HEURE);
        if (h) {
          const val = hh(h[1], h[2]);
          if (xDebut !== null && xFin !== null) { if (Math.abs(i.x - xDebut) <= Math.abs(i.x - xFin)) r.debut = val; else r.fin = val; }
          else if (!r.debut) r.debut = val; else r.fin = val;
        } else if (i.x >= xRemarque) r.remarque.push(s);
        else r.titre.push(s);
      }
      r.titre = r.titre.join(" ").trim(); r.remarque = r.remarque.join(" ").trim();
      if (m) { r.date = iso(m[1], m[2], m[3]); lignesDatees.push(r); }
      else if (r.titre) orphelines.push(r);
    }

    // 4. Un titre seul sur sa ligne (cellule fusionnée) va à la ligne datée sans titre la plus proche
    const ignores = [];
    for (const o of orphelines) {
      const candidats = lignesDatees.filter(r => !r.titre && r.page === o.page && Math.abs(r.y - o.y) < 30)
        .sort((a, b) => Math.abs(a.y - o.y) - Math.abs(b.y - o.y));
      if (candidats[0]) { candidats[0].titre = o.titre; candidats[0].fusion = true; }
      else ignores.push(o.titre);
    }

    // 5. Une suite de jours consécutifs sans titre autour d'un titre fusionné = un seul événement sur plusieurs jours
    const evenements = [];
    for (let k = 0; k < lignesDatees.length; k++) {
      const r = lignesDatees[k];
      if (!r.titre && !r.debut && !r.fin && !r.remarque) { /* ligne vide, traitée avec le groupe */ }
      let groupe = [r];
      if (!r.titre || r.fusion) {
        let j = k + 1;
        while (j < lignesDatees.length && lendemain(groupe[groupe.length - 1].date) === lignesDatees[j].date && (!lignesDatees[j].titre || lignesDatees[j].fusion)) { groupe.push(lignesDatees[j]); j++; }
        if (groupe.some(g => g.titre) && groupe.length > 1) k = j - 1; else groupe = [r];
      }
      const premier = groupe[0], dernier = groupe[groupe.length - 1];
      const titre = groupe.map(g => g.titre).find(Boolean) || "";
      const remarque = [...new Set(groupe.map(g => g.remarque).filter(Boolean))].join(", ");
      const ev = { date: premier.date, debut: premier.debut, fin: dernier.fin, titre, note: remarque, verifier: [] };
      if (groupe.length > 1) ev.dateFin = dernier.date;
      ev.cat = devinerCategorie(titre);
      if (!titre) ev.verifier.push("nom manquant");
      if (!ev.cat && titre) ev.verifier.push("type à choisir");
      if ((ev.debut && !ev.fin) || (!ev.debut && ev.fin)) ev.verifier.push("horaire incomplet");
      if (premier.fusion || groupe.length > 1) ev.verifier.push("cellule fusionnée dans le PDF");
      if (/^\(.*\)$/.test(titre)) { ev.titre = titre.slice(1, -1).replace(/\s*option\s*/i, "").trim(); ev.note = [ev.note, "En option"].filter(Boolean).join(", "); }
      evenements.push(ev);
    }
    return { evenements, ignores };
  }

  /* Extraction du texte d'un PDF avec pdf.js (navigateur ou node) */
  async function lirePdf(pdfjs, donnees) {
    const doc = await pdfjs.getDocument({ data: donnees }).promise;
    const items = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const tc = await (await doc.getPage(p)).getTextContent();
      tc.items.forEach(i => items.push({ page: p, x: i.transform[4], y: i.transform[5], str: i.str }));
    }
    return analyser(items);
  }

  const api = { analyser, lirePdf, devinerCategorie };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else global.ImportPdf = api;
})(this);
