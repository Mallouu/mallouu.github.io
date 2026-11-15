/* Espace bureau : gestion de l'agenda, import PDF, préparation de la saison et export PDF.
   S'appuie sur les fonctions du script principal (evenements, publierSaison, rafraichirAgenda, quand, esc…). */
(function () {
  "use strict";
  const LIBS = {
    pdfjs: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
    pdfjsWorker: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
    jspdf: "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
    autotable: "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"
  };
  const charges = {};
  function chargerScript(url) {
    if (!charges[url]) charges[url] = new Promise((ok, ko) => {
      const s = document.createElement("script"); s.src = url; s.onload = ok;
      s.onerror = () => { delete charges[url]; ko(new Error("Impossible de charger " + url + ". Vérifiez la connexion internet.")); };
      document.head.appendChild(s);
    });
    return charges[url];
  }
  const message = (cible, type, html) => {
    $(cible).innerHTML = `<p class="message message-${type}">${html}</p>`;
    if (cible === "#bp-message") masquerPlusTard();
  };
  /* Le message de la barre du bas disparaît après 8 s (sauf pendant qu'on le survole ou qu'on y est au clavier,
     et sauf s'il attend une confirmation). L'annonce aux lecteurs d'écran est faite à part. */
  let minuterieMessage = null;
  function masquerPlusTard() {
    clearTimeout(minuterieMessage);
    const zone = $("#bp-message");
    if (!zone.innerHTML || zone.querySelector("#bp-confirmer")) return;
    minuterieMessage = setTimeout(() => {
      if (zone.matches(":hover") || zone.contains(document.activeElement)) return masquerPlusTard();
      zone.innerHTML = "";
    }, 8000);
  }
  const nomJour = iso => { const j = jourSemaine[new Date(iso + "T12:00").getDay()]; return j.charAt(0).toUpperCase() + j.slice(1); };
  const optionsCategories = sel => Object.entries(CATEGORIES).map(([k, c]) => `<option value="${k}"${k === sel ? " selected" : ""}>${c.nom}</option>`).join("");

  /* ---------- Formulaire d'événement réutilisable ---------- */
  function formulaireEvenement(prefixe, ev, titre, libelle, avecAnnule) {
    ev = ev || {};
    return `<form class="form-evt" id="${prefixe}-form" novalidate>
      <h3 id="${prefixe}-titre" tabindex="-1">${esc(titre)}</h3>
      <div class="grille-form">
        <div class="champ" style="grid-column:1/-1"><label for="${prefixe}-nom">Nom de la manifestation <span class="obligatoire" aria-hidden="true">*</span></label>
          <input type="text" id="${prefixe}-nom" value="${esc(ev.titre || "")}" required></div>
        <div class="champ"><label for="${prefixe}-cat">Type <span class="obligatoire" aria-hidden="true">*</span></label>
          <select id="${prefixe}-cat" required><option value="">Choisir</option>${optionsCategories(ev.cat)}</select></div>
        <div class="champ"><label for="${prefixe}-date">Date <span class="obligatoire" aria-hidden="true">*</span></label>
          <input type="date" id="${prefixe}-date" value="${ev.date || ""}" required></div>
        <div class="champ"><label for="${prefixe}-datefin">Jusqu'au<span class="aide">Plusieurs jours seulement</span></label>
          <input type="date" id="${prefixe}-datefin" value="${ev.dateFin || ""}"></div>
        <div class="champ"><label for="${prefixe}-debut">Heure de début<span class="aide">Facultatif</span></label>
          <input type="time" id="${prefixe}-debut" value="${ev.debut || ""}"></div>
        <div class="champ"><label for="${prefixe}-fin">Heure de fin<span class="aide">Facultatif</span></label>
          <input type="time" id="${prefixe}-fin" value="${ev.fin || ""}"></div>
        <p class="aide" id="${prefixe}-aide-horaires" style="grid-column:1/-1;margin-top:-8px" aria-live="polite"></p>
        <div class="champ" style="grid-column:1/-1"><label for="${prefixe}-note">Remarque<span class="aide">Exemple : Challenge départemental, Pâques, en option</span></label>
          <input type="text" id="${prefixe}-note" value="${esc(ev.note || "")}"></div>
      </div>
      ${avecAnnule ? `<div class="champ"><label class="case"><input type="checkbox" id="${prefixe}-annule"${ev.annule ? " checked" : ""}> <span>Événement annulé (il reste affiché, barré « Annulé »)</span></label></div>` : ""}
      <div id="${prefixe}-erreurs" aria-live="assertive"></div>
      <div class="actions" style="margin-top:6px"><button class="bouton bouton-principal" type="submit">${esc(libelle)}</button>
      <button class="bouton bouton-secondaire" type="button" data-fermer="${prefixe}">Annuler</button></div>
    </form>`;
  }
  function lireFormulaire(prefixe) {
    const v = id => $(`#${prefixe}-${id}`).value.trim();
    const ev = { titre: v("nom"), cat: v("cat"), date: v("date"), dateFin: v("datefin"), debut: v("debut"), fin: v("fin"), note: v("note") };
    const annule = $(`#${prefixe}-annule`); if (annule) ev.annule = annule.checked;
    ["dateFin", "debut", "fin", "note"].forEach(k => { if (!ev[k]) delete ev[k]; });
    if (ev.dateFin === ev.date) delete ev.dateFin;
    const erreurs = [];
    if (!ev.titre) erreurs.push(["nom", "Indiquez le nom de la manifestation."]);
    if (!ev.cat) erreurs.push(["cat", "Choisissez un type."]);
    if (!ev.date) erreurs.push(["date", "Indiquez la date."]);
    if (ev.dateFin && ev.dateFin < ev.date) erreurs.push(["datefin", "La date de fin doit être après la date de début."]);
    if (ev.debut && ev.fin && !ev.dateFin && ev.fin <= ev.debut) erreurs.push(["fin", "L'heure de fin doit être après l'heure de début."]);
    document.querySelectorAll(`#${prefixe}-form [aria-invalid]`).forEach(n => { n.removeAttribute("aria-invalid"); n.removeAttribute("aria-describedby"); });
    document.querySelectorAll(`#${prefixe}-form .erreur-champ`).forEach(n => n.remove());
    erreurs.forEach(([id, msg]) => {
      const ch = $(`#${prefixe}-${id}`); ch.setAttribute("aria-invalid", "true"); ch.setAttribute("aria-describedby", `${prefixe}-err-${id}`);
      ch.insertAdjacentHTML("afterend", `<p class="erreur-champ" id="${prefixe}-err-${id}">${msg}</p>`);
    });
    if (erreurs.length) { $(`#${prefixe}-${erreurs[0][0]}`).focus(); return null; }
    return ev;
  }
  function ouvrirFormulaire(conteneur, prefixe, ev, titre, libelle, avecAnnule, surValidation) {
    $(conteneur).innerHTML = formulaireEvenement(prefixe, ev, titre, libelle, avecAnnule);
    $(`#${prefixe}-form`).addEventListener("submit", e => { e.preventDefault(); const r = lireFormulaire(prefixe); if (r) surValidation(r); });
    // Le calendrier de « Jusqu'au » s'ouvre sur le mois de la date de début et interdit une date antérieure
    const debut = $(`#${prefixe}-date`), fin = $(`#${prefixe}-datefin`);
    const caler = () => { fin.min = debut.value || ""; if (fin.value && debut.value && fin.value < debut.value) fin.value = ""; };
    debut.addEventListener("change", caler); caler();
    // Les horaires pré-remplis viennent de la marée : inutiles pour un repas ou une réunion (« Vie du club »)
    const hDebut = $(`#${prefixe}-debut`), hFin = $(`#${prefixe}-fin`), aide = $(`#${prefixe}-aide-horaires`);
    const maree = { debut: hDebut.value, fin: hFin.value };
    $(`#${prefixe}-cat`).addEventListener("change", e => {
      const club = e.target.value === "club";
      if (club && maree.debut && hDebut.value === maree.debut && hFin.value === maree.fin) {
        hDebut.value = ""; hFin.value = "";
        aide.textContent = "Horaires de marée retirés : indiquez une heure seulement si besoin (par exemple 19 h 30 pour un repas).";
      } else if (!club && !hDebut.value && !hFin.value && maree.debut) {
        hDebut.value = maree.debut; hFin.value = maree.fin;
        aide.textContent = "Horaires de la marée remis.";
      } else aide.textContent = "";
    });
    fin.addEventListener("focus", () => { if (!fin.value && debut.value) fin.value = debut.value; });
    $(`#${prefixe}-titre`).focus();
  }
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-fermer]");
    if (b) { const f = $(`#${b.dataset.fermer}-form`); if (f) f.parentElement.innerHTML = ""; }
  });

  /* ---------- Export PDF (même présentation que le calendrier papier) ---------- */
  async function genererPdf(liste, annee, nomFichier) {
    await chargerScript(LIBS.jspdf); await chargerScript(LIBS.autotable);
    try { await chargerScript("logo-pdf.js"); } catch { /* le PDF reste valable sans logo */ }
    const { jsPDF } = window.jspdf;
    // Trois niveaux de densité : on garde le plus aéré qui tient sur une seule page
    const NIVEAUX = [{ fs: 9, pad: 1.3, min: 6.1 }, { fs: 8.6, pad: 1.0, min: 5.5 }, { fs: 8.2, pad: 0.75, min: 5.0 }];
    const construire = niv => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const L = 210, MARGE = 14;
    const MARINE = [11, 53, 80], SABLE = [246, 241, 231], GRIS = [90, 100, 110];
    const TYPES = {
      regate: { nom: "Régates", c: [20, 80, 122] }, sortie: { nom: "Rallyes et sorties", c: [31, 122, 140] },
      croisiere: { nom: "Navigations et escales", c: [184, 67, 47] }, club: { nom: "Vie du club", c: [176, 132, 40] }
    };
    const abr = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."];
    const tries = [...liste].sort((a, b) => (a.date + (a.debut || "")).localeCompare(b.date + (b.debut || "")));
    const nbRegates = tries.filter(e => e.cat === "regate" && !e.annule).length;

    // En-tête : bandeau marine, logo, titre
    doc.setFillColor(...MARINE); doc.rect(0, 0, L, 31, "F");
    doc.setFillColor(...TYPES.croisiere.c); doc.rect(0, 31, L, 1.1, "F");
    if (window.LOGO_SNV_PNG) { doc.setFillColor(255, 255, 255); doc.circle(MARGE + 10.5, 15.5, 11.2, "F"); doc.addImage(window.LOGO_SNV_PNG, "PNG", MARGE, 5, 21, 21); }
    const xT = window.LOGO_SNV_PNG ? MARGE + 28 : MARGE;
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(19);
    doc.text(`Saison ${annee}`, xT, 13.5);
    doc.setFontSize(12); doc.text("Régates et manifestations", xT, 20.5);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(200, 220, 232);
    doc.text("Sport Nautique Valéricain · Saint-Valery-sur-Somme", xT, 26.5);
    doc.setFont("helvetica", "bold"); doc.setFontSize(21); doc.setTextColor(255, 255, 255);
    doc.text(String(nbRegates), L - MARGE, 15, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(200, 220, 232);
    doc.text(`régate${nbRegates > 1 ? "s" : ""}`, L - MARGE, 20, { align: "right" });
    doc.text(`${tries.length} rendez-vous`, L - MARGE, 25, { align: "right" });

    // Lignes : un intertitre par mois, puis les événements
    const corps = [], meta = [];
    let moisCourant = "";
    tries.forEach(e => {
      const d = new Date(e.date + "T12:00"), m = moisLong[d.getMonth()] + " " + d.getFullYear();
      if (m !== moisCourant) {
        moisCourant = m;
        corps.push([{ content: m.toUpperCase(), colSpan: 4 }]); meta.push({ mois: true });
      }
      const f = e.dateFin ? new Date(e.dateFin + "T12:00") : null;
      const date = f ? `${abr[d.getDay()]} ${d.getDate()} au ${abr[f.getDay()].toLowerCase()} ${f.getDate()}${f.getMonth() !== d.getMonth() ? " " + moisLong[f.getMonth()].slice(0, 4) + "." : ""}` : `${abr[d.getDay()]} ${d.getDate()}`;
      const club = e.cat === "club";
      const horaire = e.debut && e.fin ? `${e.debut} – ${e.fin}` : e.debut ? (club ? e.debut : `départ ${e.debut}`) : e.fin ? (club ? `jusqu'à ${e.fin}` : `retour ${e.fin}`) : (club ? "" : "journée");
      // La remarque est dessinée en gris sous le titre (une ligne vide lui réserve la place)
      corps.push([date, horaire, e.note ? e.titre + "\n " : e.titre, (TYPES[e.cat] || { nom: "" }).nom]); meta.push({ e });
    });

    doc.autoTable({
      startY: 37, margin: { left: MARGE, right: MARGE, top: 16, bottom: 20 }, rowPageBreak: "avoid",
      head: [["Date", "Horaires", "Manifestation", "Type"]], body: corps, theme: "plain",
      styles: { font: "helvetica", fontSize: niv.fs, cellPadding: { top: niv.pad, bottom: niv.pad, left: 3, right: 2 }, textColor: [27, 37, 48], valign: "middle", minCellHeight: niv.min },
      headStyles: { textColor: GRIS, fontStyle: "bold", fontSize: 8, cellPadding: { top: 0.5, bottom: 1.5, left: 3, right: 2 }, minCellHeight: 0 },
      columnStyles: { 0: { cellWidth: 38, fontStyle: "bold" }, 1: { cellWidth: 27 }, 3: { cellWidth: 37, fontSize: 8.5 } },
      didParseCell: data => {
        if (data.section !== "body") return;
        const m = meta[data.row.index]; if (!m) return;
        if (m.mois) { Object.assign(data.cell.styles, { fillColor: SABLE, textColor: MARINE, fontStyle: "bold", fontSize: 8.5, cellPadding: { top: niv.pad * 0.85, bottom: niv.pad * 0.85, left: 3 }, minCellHeight: 0 }); return; }
        const t = TYPES[m.e.cat];
        if (data.column.index === 3 && t) { data.cell.styles.textColor = t.c; data.cell.styles.fontStyle = "bold"; }
        if (data.column.index === 2 && m.e.cat === "regate") data.cell.styles.fontStyle = "bold";
        if (data.column.index === 1 && !(m.e.debut && m.e.fin)) data.cell.styles.textColor = GRIS;
        if (m.e.annule) data.cell.styles.textColor = [150, 150, 150];
      },
      didDrawCell: data => {
        if (data.section !== "body") return;
        const m = meta[data.row.index]; if (!m) return;
        if (m.mois) return;
        // Pastille de couleur du type, et fin trait de séparation
        if (data.column.index === 0 && TYPES[m.e.cat]) { doc.setFillColor(...TYPES[m.e.cat].c); doc.rect(data.cell.x, data.cell.y + 1.2, 1.3, data.cell.height - 2.4, "F"); }
        doc.setDrawColor(225, 229, 233); doc.setLineWidth(0.2);
        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        if (m.e.note && data.column.index === 2) {
          doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(m.e.annule ? 150 : 100, m.e.annule ? 150 : 110, m.e.annule ? 150 : 120);
          doc.text(m.e.note, data.cell.x + 3, data.cell.y + data.cell.height - niv.pad - 0.8);
        }
        if (m.e.annule && data.column.index === 2) {
          doc.setTextColor(184, 67, 47); doc.setFontSize(7.5); doc.setFont("helvetica", "bold");
          doc.text("ANNULÉ", data.cell.x + data.cell.width - 2, data.cell.y + 4, { align: "right" });
        }
      },
      didDrawPage: () => {
        const H = doc.internal.pageSize.getHeight(), n = doc.internal.getNumberOfPages();
        if (n > 1) { doc.setFontSize(8.5); doc.setTextColor(...MARINE); doc.setFont("helvetica", "bold"); doc.text(`SNV · Saison ${annee}`, MARGE, 10); }
        doc.setDrawColor(...MARINE); doc.setLineWidth(0.3); doc.line(MARGE, H - 14, L - MARGE, H - 14);
        doc.setFont("helvetica", "normal"); doc.setFontSize(7.8); doc.setTextColor(...GRIS);
        doc.text("Sport Nautique Valéricain · Port de plaisance, 80230 Saint-Valery-sur-Somme · snvalericain@gmail.com", MARGE, H - 9.5);
        doc.text(`Page ${n}`, L - MARGE, H - 9.5, { align: "right" });
      }
    });

    // Légende et rappel des horaires
    let y = doc.lastAutoTable.finalY + 8;
    if (y > 268) { doc.addPage(); y = 20; }
    let x = MARGE;
    doc.setFontSize(8.5); doc.setFont("helvetica", "normal");
    Object.values(TYPES).forEach(t => {
      doc.setFillColor(...t.c); doc.roundedRect(x, y - 2.8, 3.2, 3.2, 0.6, 0.6, "F");
      doc.setTextColor(27, 37, 48); doc.text(t.nom, x + 5, y); x += doc.getTextWidth(t.nom) + 12;
    });
    doc.setTextColor(...GRIS); doc.setFontSize(8);
    doc.text("Horaires des régates : de 2 h avant à 2 h après la pleine mer à Saint-Valery-sur-Somme (heures légales).", MARGE, y + 6);
    doc.text(`Mis à jour le ${dateLongue(new Date().toISOString().slice(0, 10))}. Calendrier à jour et abonnement : rubrique Agenda du site du club.`, MARGE, y + 10.5);
    return doc;
    };
    let doc;
    for (const niv of NIVEAUX) { doc = construire(niv); if (doc.getNumberOfPages() === 1) break; }
    doc.save(nomFichier || `calendrier-snv-${annee}.pdf`);
  }

  /* =====================================================================
     1. GÉRER L'AGENDA
     ===================================================================== */
  function afficherTableAgenda() {
    $("#ba-annuler-pub").hidden = !agendaPrecedent;
    $("#ba-table").innerHTML = `<caption>${evenements.length} événements</caption>
      <thead><tr><th scope="col">Date et horaires</th><th scope="col">Manifestation</th><th scope="col">Type</th><th scope="col">Remarque</th><th scope="col">Actions</th></tr></thead>
      <tbody>${evenements.map(e => `<tr${e.annule ? ' class="annule"' : ""}>
        <td>${quand(e)}</td>
        <th scope="row">${esc(e.titre)}${e.annule ? ' <span class="badge badge-corail">Annulé</span>' : ""}</th>
        <td>${(CATEGORIES[e.cat] || { nom: "?" }).nom}</td>
        <td>${esc(e.note || "")}</td>
        <td><div class="actions-ligne">
          <button class="bouton bouton-secondaire bouton-petit" type="button" data-modifier="${e.id}">Modifier<span class="sr-only"> ${esc(e.titre)}, ${dateLongue(e.date)}</span></button>
          <button class="bouton bouton-secondaire bouton-petit" type="button" data-supprimer="${e.id}">Supprimer<span class="sr-only"> ${esc(e.titre)}, ${dateLongue(e.date)}</span></button>
        </div><div class="zone-confirmation"></div></td></tr>`).join("")}</tbody>`;
  }
  function enregistrerEtAfficher(msg) {
    trierEvenements(); enregistrerAgenda(); rafraichirAgenda(); afficherTableAgenda();
    message("#ba-message", "ok", msg); $("#ba-formulaire").innerHTML = "";
  }
  $("#ba-ajouter").addEventListener("click", () =>
    ouvrirFormulaire("#ba-formulaire", "ba", null, "Nouvel événement", "Ajouter à l'agenda", false, ev => {
      evenements.push({ ...ev, id: prochainId() });
      enregistrerEtAfficher(`« ${esc(ev.titre)} » a été ajouté à l'agenda.`);
    }));
  $("#ba-table").addEventListener("click", e => {
    const mod = e.target.closest("[data-modifier]"), sup = e.target.closest("[data-supprimer]");
    if (mod) {
      const ev = evenements.find(x => String(x.id) === mod.dataset.modifier);
      ouvrirFormulaire("#ba-formulaire", "ba", ev, `Modifier « ${ev.titre} »`, "Enregistrer les modifications", true, nouveau => {
        Object.keys(ev).forEach(k => { if (k !== "id") delete ev[k]; }); Object.assign(ev, nouveau);
        enregistrerEtAfficher(`« ${esc(ev.titre)} » a été modifié.`);
      });
      $("#ba-formulaire").scrollIntoView({ block: "start" });
    }
    if (sup) {
      const ev = evenements.find(x => String(x.id) === sup.dataset.supprimer);
      const zone = sup.closest("td").querySelector(".zone-confirmation");
      zone.innerHTML = `<div class="confirmation" role="group" aria-label="Confirmer la suppression"><span>Supprimer définitivement ?</span>
        <button class="bouton bouton-principal bouton-petit" type="button" data-confirmer-sup="${ev.id}">Oui, supprimer</button>
        <button class="bouton bouton-secondaire bouton-petit" type="button" data-annuler-sup>Non</button></div>`;
      zone.querySelector("[data-confirmer-sup]").focus();
    }
    const conf = e.target.closest("[data-confirmer-sup]");
    if (conf) {
      const ev = evenements.find(x => String(x.id) === conf.dataset.confirmerSup);
      evenements = evenements.filter(x => x !== ev);
      enregistrerEtAfficher(`« ${esc(ev.titre)} » a été supprimé. Astuce : pour garder une trace, utilisez plutôt « Modifier » puis « Événement annulé ».`);
      $("#ba-message").setAttribute("tabindex", "-1"); $("#ba-message").focus();
    }
    const non = e.target.closest("[data-annuler-sup]");
    if (non) { const btn = non.closest("td").querySelector("[data-supprimer]"); non.closest(".zone-confirmation").innerHTML = ""; btn.focus(); }
  });
  $("#ba-pdf").addEventListener("click", async () => {
    try { message("#ba-message", "info", "Préparation du PDF…"); await genererPdf(evenements, (evenements[0] || { date: "2026" }).date.slice(0, 4)); message("#ba-message", "ok", "Le PDF a été téléchargé."); }
    catch (err) { message("#ba-message", "erreur", esc(err.message)); }
  });
  $("#ba-annuler-pub").addEventListener("click", () => { annulerPublication(); afficherTableAgenda(); message("#ba-message", "ok", "L'agenda précédent a été rétabli."); });
  $("#ba-reinit").addEventListener("click", () => {
    publierSaison(EVENEMENTS_2026.map(e => ({ ...e }))); afficherTableAgenda();
    message("#ba-message", "ok", "La démo est revenue au calendrier 2026 d'origine. « Annuler la dernière publication » permet de revenir en arrière.");
  });

  /* =====================================================================
     2. IMPORTER UN PDF
     ===================================================================== */
  let lignesImport = [];
  async function pdfjsPret() {
    await chargerScript(LIBS.pdfjs);
    const lib = window.pdfjsLib;
    lib.GlobalWorkerOptions.workerSrc = LIBS.pdfjsWorker;
    return lib;
  }
  $("#bi-fichier").addEventListener("change", async e => {
    const f = e.target.files[0]; if (!f) return;
    $("#bi-resultat").innerHTML = "";
    message("#bi-statut", "info", `Lecture de « ${esc(f.name)} »…`);
    try {
      const lib = await pdfjsPret();
      const { evenements: lus, ignores } = await ImportPdf.lirePdf(lib, new Uint8Array(await f.arrayBuffer()));
      if (!lus.length) throw new Error("Aucune date n'a été trouvée dans ce PDF. Vérifiez qu'il a la même présentation que le calendrier habituel.");
      lignesImport = lus;
      const nbVerif = lus.filter(l => l.verifier.length).length;
      message("#bi-statut", nbVerif ? "info" : "ok", `${lus.length} événements lus${nbVerif ? `, dont <strong>${nbVerif} à vérifier</strong> (surlignés)` : ""}.${ignores.length ? ` Texte non utilisé : ${ignores.map(t => "« " + esc(t) + " »").join(", ")}.` : ""}`);
      afficherRevueImport();
    } catch (err) { message("#bi-statut", "erreur", esc(err.message)); }
  });
  function afficherRevueImport() {
    const c = (i, champ, type, val, libelle, extra) => `<input type="${type}" aria-label="${libelle}, ligne ${i + 1}" data-i="${i}" data-champ="${champ}" value="${esc(val || "")}"${extra || ""}>`;
    $("#bi-resultat").innerHTML = `<h2>Vérifier avant de publier</h2>
      <p>Corrigez directement dans le tableau. Décochez une ligne pour ne pas l'importer.</p>
      <div class="tableau-conteneur"><table class="table-admin"><caption>Événements lus dans le PDF</caption>
      <thead><tr><th scope="col">Garder</th><th scope="col">Date</th><th scope="col">Jusqu'au</th><th scope="col">Début</th><th scope="col">Fin</th><th scope="col">Manifestation</th><th scope="col">Type</th><th scope="col">Remarque</th><th scope="col">À vérifier</th></tr></thead>
      <tbody>${lignesImport.map((l, i) => `<tr${l.verifier.length ? ' class="a-verifier"' : ""}>
        <td><input type="checkbox" aria-label="Garder la ligne ${i + 1}" data-i="${i}" data-champ="garder" checked style="width:20px;height:20px"></td>
        <td>${c(i, "date", "date", l.date, "Date")}</td><td>${c(i, "dateFin", "date", l.dateFin, "Jusqu'au")}</td>
        <td>${c(i, "debut", "time", l.debut, "Heure de début")}</td><td>${c(i, "fin", "time", l.fin, "Heure de fin")}</td>
        <td>${c(i, "titre", "text", l.titre, "Manifestation", ' style="min-width:14em"')}</td>
        <td><select aria-label="Type, ligne ${i + 1}" data-i="${i}" data-champ="cat"><option value="">Choisir</option>${optionsCategories(l.cat)}</select></td>
        <td>${c(i, "note", "text", l.note, "Remarque")}</td>
        <td>${l.verifier.length ? `<span class="badge badge-corail">${esc(l.verifier.join(", "))}</span>` : '<span class="sr-only">Rien à vérifier</span>'}</td></tr>`).join("")}</tbody></table></div>
      <div class="actions"><button class="bouton bouton-principal" type="button" id="bi-publier">Publier dans l'agenda</button></div>
      <div id="bi-confirmation"></div><div id="bi-message" aria-live="polite"></div>`;
    $("#bi-publier").addEventListener("click", () => {
      const lignes = lireRevueImport(); if (!lignes) return;
      $("#bi-confirmation").innerHTML = `<div class="confirmation" role="group" aria-label="Confirmer la publication"><span>Les ${evenements.length} événements actuels de l'agenda seront remplacés par ces ${lignes.length} événements. Vous pourrez annuler.</span>
        <button class="bouton bouton-principal bouton-petit" type="button" id="bi-confirmer">Confirmer</button>
        <button class="bouton bouton-secondaire bouton-petit" type="button" id="bi-annuler">Annuler</button></div>`;
      $("#bi-confirmer").focus();
      $("#bi-annuler").onclick = () => { $("#bi-confirmation").innerHTML = ""; $("#bi-publier").focus(); };
      $("#bi-confirmer").onclick = () => {
        publierSaison(lignes); $("#bi-confirmation").innerHTML = "";
        message("#bi-message", "ok", `Agenda publié : ${lignes.length} événements. <a href="#/agenda">Voir l'agenda</a> · <button class="bouton bouton-secondaire bouton-petit" type="button" id="bi-defaire">Annuler la publication</button>`);
        $("#bi-defaire").onclick = () => { annulerPublication(); message("#bi-message", "ok", "Publication annulée : l'agenda précédent est rétabli."); };
      };
    });
  }
  function lireRevueImport() {
    const lignes = lignesImport.map(l => ({ ...l }));
    document.querySelectorAll("#bi-resultat [data-champ]").forEach(ch => {
      const l = lignes[ch.dataset.i];
      if (ch.dataset.champ === "garder") l.garder = ch.checked; else l[ch.dataset.champ] = ch.value.trim();
    });
    const gardees = lignes.filter(l => l.garder);
    const manque = document.querySelector("#bi-resultat tr") && gardees.find(l => !l.titre || !l.cat || !l.date);
    if (manque) {
      const i = lignes.indexOf(manque), champ = !manque.date ? "date" : !manque.titre ? "titre" : "cat";
      message("#bi-message", "erreur", `Ligne ${i + 1} : ${champ === "cat" ? "choisissez un type" : champ === "titre" ? "indiquez le nom de la manifestation" : "indiquez la date"} (ou décochez la ligne).`);
      document.querySelector(`#bi-resultat [data-i="${i}"][data-champ="${champ}"]`).focus();
      return null;
    }
    return gardees.map(({ garder, verifier, ...e }) => { ["dateFin", "debut", "fin", "note"].forEach(k => { if (!e[k]) delete e[k]; }); return e; });
  }

  /* =====================================================================
     3. PRÉPARER LA SAISON
     ===================================================================== */
  const P = { pbm: null, ports: [], pms: [], annee: null, feries: {}, blocs: [], brouillon: [] };
  const cleBrouillon = () => `snv-maquette-brouillon-${P.annee}`;
  const sauverBrouillon = () => ecrireStockage(cleBrouillon(), P.brouillon);
  const lireFichier = f => new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => ko(r.error); r.readAsText(f); });

  function chargerMarees(textePbm, texteVra, origine) {
    try {
      P.pbm = Marees.lirePBM(textePbm);
      P.ports = texteVra ? Marees.lireVRA(texteVra) : [];
      if (!P.ports.length) P.ports = [Marees.SAINT_VALERY];
      P.annee = P.pbm.annee;
      P.feries = Marees.joursFeries(P.annee);
      P.blocs = Marees.blocsWeekEnds(P.annee, P.feries);
      P.brouillon = lireStockage(cleBrouillon()) || [];
      const sv = P.ports.findIndex(p => /valery/i.test(p.nom));
      $("#bp-port").innerHTML = P.ports.map((p, i) => `<option value="${i}"${i === (sv < 0 ? 0 : sv) ? " selected" : ""}>${esc(p.nom)}</option>`).join("");
      $("#bp-annee").textContent = P.annee;
      calculerPms();
      $("#bp-suite").hidden = false;
      message("#bp-statut", "ok", `Marées ${P.annee} chargées (${origine}) : ${P.pbm.marees.length} pleines et basses mers${P.pbm.site ? ", " + esc(P.pbm.site.split("(")[0].trim().replace(/_/g, " ").toLowerCase()) : ""}. ${texteVra ? `${P.ports.length} ports dans le fichier de corrections.` : "Corrections 2026 de Saint-Valery utilisées."}`);
      afficherWeekEnds(); afficherBrouillon();
    } catch (err) { message("#bp-statut", "erreur", esc(err.message)); }
  }
  function calculerPms() {
    const r = reglages();
    P.pms = Marees.pleinesMersAuPort(P.pbm, P.ports[+$("#bp-port").value || 0], r);
    P.parJour = {}; P.pms.forEach(p => (P.parJour[p.date] = P.parJour[p.date] || []).push(p));
  }
  function reglages() {
    const f = $("#bp-reglages");
    return { critere: f.critere.value, seuil: parseFloat(f.seuil.value) || 0, avant: parseFloat(f.avant.value) || 0, apres: parseFloat(f.apres.value) || 0,
      plageDebut: f.plageDebut.value || "00:00", plageFin: f.plageFin.value || "23:59", periode: f.periode.value.split("-").map(Number) };
  }
  $("#bp-pbm").addEventListener("change", async () => {
    const f = $("#bp-pbm").files[0]; if (!f) return;
    const v = $("#bp-vra").files[0];
    chargerMarees(await lireFichier(f), v ? await lireFichier(v) : null, "fichier « " + esc(f.name) + " »");
  });
  $("#bp-vra").addEventListener("change", async () => {
    const f = $("#bp-pbm").files[0]; if (!f) { message("#bp-statut", "info", "Fichier de corrections prêt. Choisissez maintenant le fichier des prédictions (PBM)."); return; }
    chargerMarees(await lireFichier(f), await lireFichier($("#bp-vra").files[0]), "fichier « " + esc(f.name) + " »");
  });
  $("#bp-exemple").addEventListener("click", async () => {
    try { await chargerScript("marees-exemple-2026.js"); chargerMarees(window.SHOM_EXEMPLE.pbm, window.SHOM_EXEMPLE.vra, "exemple SHOM 2026"); }
    // L'exemple utilise des données SHOM qui ne sont pas rediffusées dans la version en ligne
    catch { message("#bp-statut", "info", "L'exemple n'est pas disponible dans cette version en ligne (les données du SHOM ne peuvent pas être rediffusées). Chargez vos fichiers SHOM ci-dessus : le fichier « PBM » des prédictions, et si vous l'avez le fichier « VRA » des corrections."); $("#bp-pbm").focus(); }
  });
  $("#bp-reglages").addEventListener("change", e => {
    if (e.target.name === "critere") {
      const s = $("#bp-seuil"); const defaut = { hauteur: [9.3, 0.05], coef: [70, 1], marnage: [7.5, 0.05] }[e.target.value];
      s.value = defaut[0]; s.step = defaut[1];
    }
    if (e.target.name === "port" || e.target.name === "critere") calculerPms();
    afficherWeekEnds();
  });
  $("#bp-reglages").addEventListener("input", e => { if (e.target.name === "seuil") afficherWeekEnds(); });
  $("#bp-reglages").addEventListener("submit", e => e.preventDefault());
  $("#bp-favorables").addEventListener("change", afficherWeekEnds);
  $("#bp-longs").addEventListener("change", afficherWeekEnds);

  const fmt = (n, d) => n === null || n === undefined ? "—" : n.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
  function libelleBloc(b) {
    const j = b.jours, d1 = new Date(j[0].date + "T12:00"), d2 = new Date(j[j.length - 1].date + "T12:00");
    if (j.length === 1) return `${nomJour(j[0].date)} ${dateLongue(j[0].date)}`;
    const mois = d1.getMonth() === d2.getMonth() ? "" : " " + moisLong[d1.getMonth()];
    if (j.length === 2 && d1.getDay() === 6) return `Week-end des ${d1.getDate()}${mois} et ${d2.getDate()} ${moisLong[d2.getMonth()]}`;
    return `Du ${jourSemaine[d1.getDay()]} ${d1.getDate()}${mois} au ${jourSemaine[d2.getDay()]} ${d2.getDate()} ${moisLong[d2.getMonth()]}`;
  }
  /* Régates « classiques » : numérotées automatiquement Printemps 1, 2… / Automne 1, 2… dans l'ordre des dates */
  const serie = date => +date.slice(5, 7) <= 7 ? "Printemps" : "Automne";
  function renumeroter() {
    ["Printemps", "Automne"].forEach(s => {
      P.brouillon.filter(e => e.auto && serie(e.date) === s).sort((a, b) => a.date.localeCompare(b.date))
        .forEach((e, i) => { e.titre = `${s} ${i + 1}`; });
    });
  }
  /* Pleine mer retenue pour un jour : favorable, sinon de jour, sinon la plus proche de 13 h */
  function meilleurePm(date, r) {
    const pms = Marees.evaluerJour(P.parJour[date] || [], r);
    return pms.find(p => p.favorable) || pms.find(p => p.deJour)
      || [...pms].sort((a, b) => Math.abs(a.minutes - 780) - Math.abs(b.minutes - 780))[0] || null;
  }
  function regateAuto(date, r) {
    const pm = meilleurePm(date, r);
    const ev = { titre: "", cat: "regate", date, note: P.feries[date] || "", auto: true };
    if (pm) { ev.debut = pm.debut; ev.fin = pm.fin; }
    return ev;
  }
  /* Chaque action sur le brouillon peut être annulée */
  let avantAction = null;
  function action(fn, texte, focusSelecteur) {
    avantAction = P.brouillon.map(e => ({ ...e }));
    fn(); renumeroter(); sauverBrouillon(); afficherBrouillon(); afficherWeekEnds();
    message("#bp-message", "ok", `${texte} <button class="bouton bouton-secondaire bouton-petit" type="button" id="bp-defaire-action">Annuler</button>`);
    $("#bp-annonce").textContent = texte.replace(/<[^>]+>/g, "");
    if (focusSelecteur) { const el = document.querySelector(focusSelecteur); if (el) el.focus(); }
  }
  document.addEventListener("click", e => {
    if (!e.target.closest("#bp-defaire-action") || !avantAction) return;
    P.brouillon = avantAction; avantAction = null; sauverBrouillon(); afficherBrouillon(); afficherWeekEnds();
    message("#bp-message", "ok", "Action annulée."); $("#bp-annonce").textContent = "Action annulée.";
  });
  function afficherWeekEnds() {
    if (!P.pbm) return;
    const r = reglages();
    const unite = { hauteur: " m", coef: "", marnage: " m" }[r.critere];
    const blocs = P.blocs.filter(b => { const m = +b.jours[0].date.slice(5, 7); return m >= r.periode[0] && m <= r.periode[1]; })
      .map(b => ({ ...b, eval: b.jours.map(j => ({ ...j, pms: Marees.evaluerJour(P.parJour[j.date] || [], r) })) }))
      .map(b => ({ ...b, favorable: b.eval.some(j => j.pms.some(p => p.favorable)) }));
    const visibles = blocs.filter(b => (!$("#bp-favorables").checked || b.favorable) && (!$("#bp-longs").checked || b.long || b.feries.length));
    $("#bp-compte").textContent = `${blocs.filter(b => b.favorable).length} week-ends favorables sur ${blocs.length} pour la période. ${visibles.length} affichés.`;
    $("#bp-weekends").innerHTML = visibles.map(b => `<article class="we${b.favorable ? " favorable" : ""}" aria-label="${esc(libelleBloc(b))}">
      <div class="we-titre"><h3>${esc(libelleBloc(b))}</h3>
        ${b.favorable ? '<span class="badge badge-vert">Favorable</span>' : '<span class="badge badge-gris">Peu d\'eau ou marée de nuit</span>'}
        ${b.feries.map(f => `<span class="badge cat-croisiere">${esc(f)}</span>`).join("")}
        ${b.jours.some(j => j.motif === "pont") ? '<span class="badge cat-club">Pont</span>' : ""}</div>
      ${b.eval.map(j => {
        const prevus = P.brouillon.filter(e => e.date <= j.date && (e.dateFin || e.date) >= j.date);
        const pmsJour = j.pms.filter(p => p.minutes >= 300 && p.minutes <= 1290);
        return `<div class="we-jour"><div><strong>${nomJour(j.date)} ${new Date(j.date + "T12:00").getDate()}</strong>${j.ferie ? `<br><span class="exemple">${esc(j.ferie)}</span>` : ""}</div>
          <div class="pm">${pmsJour.length ? pmsJour.map(p => `<span class="${p.favorable ? "ok" : "ko"}">PM ${p.heure} · ${fmt(p.hauteur, 2)} m · coef ${p.coef} · créneau ${p.debut}–${p.fin} ${p.favorable ? "✓ favorable" : !p.deJour ? "(hors horaires)" : `(${fmt(p.valeur, r.critere === "coef" ? 0 : 2)}${unite} &lt; ${fmt(r.seuil, r.critere === "coef" ? 0 : 2)}${unite})`}</span>`).join("") : '<span class="ko">Pas de pleine mer en journée</span>'}
          </div>
          <div class="actions-jour">${prevus.map(e => `<span class="prevu">${esc(e.titre)}
              <button class="bouton bouton-secondaire bouton-petit" type="button" data-retirer-date="${j.date}" data-titre="${esc(e.titre)}">Retirer<span class="sr-only"> ${esc(e.titre)}</span></button></span>`).join("")}
            ${prevus.some(e => e.cat === "regate") ? "" : `<button class="bouton bouton-principal bouton-petit" type="button" data-rapide="${j.date}">+ Régate<span class="sr-only"> le ${nomJour(j.date)} ${dateLongue(j.date)}</span></button>`}
            <button class="bouton bouton-secondaire bouton-petit" type="button" data-placer="${j.date}">Autre…<span class="sr-only"> événement le ${nomJour(j.date)} ${dateLongue(j.date)}</span></button></div></div>
          <div class="zone-placer" id="placer-${j.date}"></div>`;
      }).join("")}
    </article>`).join("") || "<p>Aucun week-end ne correspond. Essayez d'abaisser la valeur minimale ou d'élargir les horaires.</p>";
  }
  $("#bp-weekends").addEventListener("click", e => {
    const rapide = e.target.closest("[data-rapide]"), retirer = e.target.closest("[data-retirer-date]"), b = e.target.closest("[data-placer]");
    if (rapide) {
      const date = rapide.dataset.rapide; let ev;
      action(() => { ev = regateAuto(date, reglages()); P.brouillon.push(ev); },
        "", `[data-retirer-date="${date}"]`);
      message("#bp-message", "ok", `« ${esc(ev.titre)} » ajoutée le ${nomJour(date).toLowerCase()} ${dateLongue(date)}${ev.debut ? ` (${ev.debut}–${ev.fin})` : ""}. <button class="bouton bouton-secondaire bouton-petit" type="button" id="bp-defaire-action">Annuler</button>`);
      $("#bp-annonce").textContent = `${ev.titre} ajoutée le ${dateLongue(date)}.`;
      return;
    }
    if (retirer) {
      const date = retirer.dataset.retirerDate, titre = retirer.dataset.titre;
      action(() => { const i = P.brouillon.findIndex(x => x.titre === titre && x.date <= date && (x.dateFin || x.date) >= date); if (i >= 0) P.brouillon.splice(i, 1); },
        `« ${esc(titre)} » retiré. Les régates suivantes ont été renumérotées.`, `[data-rapide="${date}"]`);
      return;
    }
    if (!b) return;
    const date = b.dataset.placer, r = reglages(), pm = meilleurePm(date, r);
    document.querySelectorAll(".zone-placer").forEach(z => z.innerHTML = "");
    const ev = { titre: "", cat: "", date, debut: pm ? pm.debut : "", fin: pm ? pm.fin : "", note: P.feries[date] || "" };
    // Grand week-end ou pont : l'événement court par défaut jusqu'au dernier jour du bloc, retour à la marée de ce jour-là
    const bloc = P.blocs.find(bl => bl.jours.some(j => j.date === date));
    const dernier = bloc && bloc.jours[bloc.jours.length - 1].date;
    if (bloc && (bloc.long || bloc.feries.length) && dernier > date) {
      const pmFin = meilleurePm(dernier, r);
      ev.dateFin = dernier; ev.fin = pmFin ? pmFin.fin : "";
      ev.note = bloc.feries.join(", ");
    }
    ouvrirFormulaire(`#placer-${date}`, "bpp", ev, `Autre événement le ${nomJour(date).toLowerCase()} ${dateLongue(date)}`, "Ajouter au calendrier en préparation", false, nouveau => {
      action(() => P.brouillon.push(nouveau), `« ${esc(nouveau.titre)} » ajouté au calendrier en préparation.`, `[data-placer="${date}"]`);
    });
  });

  /* Proposition automatique d'une saison de régates */
  $("#bp-proposer-form").addEventListener("submit", e => {
    e.preventDefault();
    const r = reglages(), pref = +$("#bp-jour-pref").value;
    const occupe = (d) => P.brouillon.some(x => x.date <= d && (x.dateFin || x.date) >= d);
    // Un candidat par week-end favorable et libre : le jour préféré si la marée le permet, sinon un autre jour du week-end
    const candidats = P.blocs.map(bl => {
      if (bl.jours.some(j => P.brouillon.some(x => x.cat === "regate" && x.date <= j.date && (x.dateFin || x.date) >= j.date))) return null;
      const jours = bl.jours.filter(j => !occupe(j.date) && Marees.evaluerJour(P.parJour[j.date] || [], r).some(p => p.favorable));
      if (!jours.length) return null;
      return (jours.find(j => j.jourSemaine === pref) || jours.find(j => j.jourSemaine === 0 || j.jourSemaine === 6) || jours[0]).date;
    }).filter(Boolean);
    let ajoutees = { Printemps: 0, Automne: 0 }, manque = [];
    action(() => {
      [["Printemps", [3, 6], +$("#bp-nb-printemps").value], ["Automne", [9, 11], +$("#bp-nb-automne").value]].forEach(([s, [m1, m2], nb]) => {
        const deja = P.brouillon.filter(x => x.cat === "regate" && serie(x.date) === s).length;
        const reste = Math.max(0, nb - deja);
        const dispo = candidats.filter(d => { const m = +d.slice(5, 7); return m >= m1 && m <= m2; });
        // Répartition régulière sur la période : premier et dernier week-end favorables, puis à intervalles égaux
        let choisis = dispo;
        if (reste < dispo.length) choisis = reste <= 1 ? dispo.slice(0, reste)
          : [...new Set(Array.from({ length: reste }, (_, i) => dispo[Math.round(i * (dispo.length - 1) / (reste - 1))]))];
        choisis.forEach(d => { P.brouillon.push(regateAuto(d, r)); ajoutees[s]++; });
        if (choisis.length < reste) manque.push(`${reste - choisis.length} de ${s.toLowerCase()}`);
      });
    }, "");
    const total = ajoutees.Printemps + ajoutees.Automne;
    const texte = total
      ? `${ajoutees.Printemps} régates de printemps et ${ajoutees.Automne} d'automne proposées.${manque.length ? ` Pas assez de week-ends favorables libres pour ${manque.join(" et ")} : abaissez la valeur minimale à l'étape 2.` : ""} Retirez ou ajoutez des dates directement dans la liste.`
      : "Aucune nouvelle régate proposée : le calendrier en préparation contient déjà le nombre demandé, ou aucun week-end favorable n'est libre.";
    message("#bp-message", total ? "ok" : "info", `${texte} ${total ? '<button class="bouton bouton-secondaire bouton-petit" type="button" id="bp-defaire-action">Annuler</button>' : ""}`);
    $("#bp-annonce").textContent = texte;
    $("#t-bp-4").scrollIntoView({ block: "start" });
  });
  function afficherBrouillon() {
    P.brouillon.sort((a, b) => (a.date + (a.debut || "")).localeCompare(b.date + (b.debut || "")));
    $("#bp-brouillon").innerHTML = P.brouillon.length ? `<ul class="brouillon-liste">${P.brouillon.map((e, i) => `<li>
      <span class="quand-b">${quand(e)}</span><span class="titre-b">${esc(e.titre)} <span class="badge ${(CATEGORIES[e.cat] || {}).classe || ""}">${(CATEGORIES[e.cat] || { nom: "?" }).nom}</span>${e.note ? ` <span class="badge badge-gris">${esc(e.note)}</span>` : ""}</span>
      <button class="bouton bouton-secondaire bouton-petit" type="button" data-b-modifier="${i}">Modifier<span class="sr-only"> ${esc(e.titre)}</span></button>
      <button class="bouton bouton-secondaire bouton-petit" type="button" data-b-retirer="${i}">Retirer<span class="sr-only"> ${esc(e.titre)}</span></button></li>`).join("")}</ul>`
      : "<p><strong>Aucun événement pour l'instant.</strong> Utilisez « Placer un événement » sur un week-end ci-dessus.</p>";
    $("#bp-pdf").disabled = $("#bp-publier").disabled = !P.brouillon.length;
    const nbR = P.brouillon.filter(e => e.cat === "regate").length, nbA = P.brouillon.length - nbR;
    $("#bp-resume").textContent = P.brouillon.length
      ? `En préparation : ${nbR} régate${nbR > 1 ? "s" : ""}${nbA ? ` et ${nbA} autre${nbA > 1 ? "s" : ""} événement${nbA > 1 ? "s" : ""}` : ""}`
      : "Aucun événement en préparation";
  }
  $("#bp-brouillon").addEventListener("click", e => {
    const mod = e.target.closest("[data-b-modifier]"), ret = e.target.closest("[data-b-retirer]");
    if (ret) {
      const i = +ret.dataset.bRetirer, titre = P.brouillon[i].titre;
      action(() => P.brouillon.splice(i, 1), `« ${esc(titre)} » retiré du calendrier en préparation.`);
      $("#t-bp-4").setAttribute("tabindex", "-1"); $("#t-bp-4").focus();
    }
    if (mod) {
      const i = +mod.dataset.bModifier, ancien = P.brouillon[i];
      ouvrirFormulaire("#bp-form-libre", "bpl", ancien, `Modifier « ${ancien.titre} »`, "Enregistrer", false, nouveau => {
        // Un nom changé à la main n'est plus renuméroté automatiquement
        nouveau.auto = !!ancien.auto && nouveau.titre === ancien.titre && nouveau.cat === "regate";
        action(() => { P.brouillon[i] = nouveau; }, `« ${esc(nouveau.titre)} » modifié.`);
        $("#bp-form-libre").innerHTML = "";
      });
    }
  });
  $("#bp-ajouter-libre").addEventListener("click", () =>
    ouvrirFormulaire("#bp-form-libre", "bpl", { cat: "club" }, "Ajouter un événement", "Ajouter au calendrier en préparation", false, nouveau => {
      action(() => P.brouillon.push(nouveau), `« ${esc(nouveau.titre)} » ajouté.`); $("#bp-form-libre").innerHTML = "";
    }));
  $("#bp-pdf").addEventListener("click", async () => {
    try { message("#bp-message", "info", "Préparation du PDF…"); await genererPdf(P.brouillon, P.annee); message("#bp-message", "ok", `Le PDF « calendrier-snv-${P.annee}.pdf » a été téléchargé.`); }
    catch (err) { message("#bp-message", "erreur", esc(err.message)); }
  });
  $("#bp-publier").addEventListener("click", () => {
    message("#bp-message", "info", `Les ${evenements.length} événements actuels de l'agenda seront remplacés par les ${P.brouillon.length} de ce calendrier. Vous pourrez annuler.
      <span class="actions" style="margin-top:8px"><button class="bouton bouton-principal bouton-petit" type="button" id="bp-confirmer">Confirmer la publication</button>
      <button class="bouton bouton-secondaire bouton-petit" type="button" id="bp-annuler">Annuler</button></span>`);
    $("#bp-confirmer").focus();
    $("#bp-annuler").onclick = () => { $("#bp-message").innerHTML = ""; $("#bp-publier").focus(); };
    $("#bp-confirmer").onclick = () => {
      publierSaison(P.brouillon);
      message("#bp-message", "ok", `Agenda publié : ${P.brouillon.length} événements. <a href="#/agenda">Voir l'agenda</a> · <button class="bouton bouton-secondaire bouton-petit" type="button" id="bp-defaire">Annuler la publication</button>`);
      $("#bp-defaire").onclick = () => { annulerPublication(); message("#bp-message", "ok", "Publication annulée : l'agenda précédent est rétabli."); };
    };
  });

  /* ---------- Affichage selon la page ---------- */
  function surPage() {
    const route = (location.hash.match(/^#\/([\w-]*)/) || [, ""])[1];
    if (route === "bureau-agenda") afficherTableAgenda();
  }
  window.addEventListener("hashchange", surPage);
  document.addEventListener("agenda-modifie", () => { if (!$('[data-route="bureau-agenda"]').hidden) afficherTableAgenda(); });
  afficherBrouillon(); surPage();
})();
