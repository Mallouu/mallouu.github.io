/* Galerie photo, documents de course et historique des résultats (public + espace bureau).
   Maquette : les informations sont gardées dans le navigateur (localStorage) et les fichiers
   dans sa base IndexedDB. Dans le site final, ce sera le serveur du club. */
(function () {
  "use strict";
  const CLE = "snv-maquette-medias-v1";
  const TYPES_DOC = { avis: "Avis de course", ic: "Instructions de course", resultats: "Résultats", pratique: "Document pratique" };
  const ORDRE = ["avis", "ic", "resultats"];

  /* ---------- Données d'exemple ---------- */
  const ex = (type, titre, date, saison) => ({ id: "ex-" + type + "-" + titre.replace(/\W+/g, "") + "-" + (date || saison), type, saison: saison || +date.slice(0, 4), regate: date ? { titre, date } : null, titre: date ? `${TYPES_DOC[type]} – ${titre}` : titre, exemple: true, mime: "application/pdf" });
  const DEFAUT = {
    photos: [
      { id: "p1", src: "images/j80-equipage.jpg", w: 1200, h: 900, album: "Régates 2026", alt: "Le J80 Ninja sous grand-voile et spi en Baie de Somme, six équipiers souriants dans le cockpit, l'un salue de la main.", legende: "Le J80 Ninja et son équipage" },
      { id: "p2", src: "images/j70-equipage.jpg", w: 1200, h: 900, album: "École de voile", alt: "Le J70 du club au près, quatre équipiers assis au rappel lèvent les bras.", legende: "Bras levés au rappel sur le J70" },
      { id: "p3", src: "images/phoque.jpg", w: 1284, h: 1353, album: "La baie", alt: "Un phoque sort la tête de l'eau verte de la baie et regarde l'objectif.", legende: "Un phoque venu saluer l'équipage" },
      { id: "p4", src: "images/baie-maison.jpg", w: 500, h: 232, album: "La baie", alt: "Une maison au toit rouge entourée d'arbres, au bord de la Baie de Somme, sous un ciel bleu.", legende: "Une maison sur la rive de la baie" }
    ],
    documents: [
      ex("avis", "Printemps 1", "2026-03-08"), ex("ic", "Printemps 1", "2026-03-08"), ex("avis", "Printemps 2", "2026-03-22"),
      ex("avis", "Double mixte, Trophée CABP", "2026-05-30"),
      ex("pratique", "Règles de course à la voile 2025-2028", null, 2026), ex("pratique", "Carte du plan d'eau et zones de course", null, 2026),
      ex("resultats", "Printemps 1", "2025-03-16"), ex("resultats", "Printemps 2", "2025-03-30"), ex("resultats", "Printemps 3", "2025-04-27"),
      ex("resultats", "Double mixte, Trophée CABP", "2025-06-07"), ex("resultats", "Automne 1", "2025-09-21"), ex("resultats", "Automne 2", "2025-10-05"),
      ex("resultats", "Printemps 1", "2024-03-24"), ex("resultats", "Automne 1", "2024-09-29")
    ]
  };
  let M = (() => { try { const s = JSON.parse(localStorage.getItem(CLE)); if (s && s.photos && s.documents) return s; } catch { } return JSON.parse(JSON.stringify(DEFAUT)); })();
  const enregistrer = () => { try { localStorage.setItem(CLE, JSON.stringify(M)); } catch { } };

  /* ---------- Fichiers (IndexedDB) ---------- */
  const urls = new Map();
  let base = null;
  const ouvrirBase = () => new Promise(ok => {
    try {
      const r = indexedDB.open("snv-maquette", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("fichiers");
      r.onsuccess = () => { r.result.onversionchange = () => r.result.close(); ok(r.result); };
      r.onerror = () => ok(null);
    } catch { ok(null); }
  });
  const transaction = (mode, fn) => new Promise((ok, ko) => {
    if (!base) return ok(null);
    const t = base.transaction("fichiers", mode), s = t.objectStore("fichiers"), r = fn(s);
    t.oncomplete = () => ok(r && r.result); t.onerror = () => ko(t.error);
  });
  async function stockerFichier(id, blob) {
    urls.set(id, URL.createObjectURL(blob));
    try { await transaction("readwrite", s => s.put(blob, id)); } catch { /* reste disponible pendant la session */ }
  }
  async function supprimerFichier(id) {
    if (urls.has(id)) { URL.revokeObjectURL(urls.get(id)); urls.delete(id); }
    try { await transaction("readwrite", s => s.delete(id)); } catch { }
  }
  async function chargerFichiers() {
    base = await ouvrirBase();
    const ids = [...M.photos.filter(p => p.fichier).map(p => p.id), ...M.documents.filter(d => d.fichier).map(d => d.id)];
    for (const id of ids) {
      try { const blob = await transaction("readonly", s => s.get(id)); if (blob) urls.set(id, URL.createObjectURL(blob)); } catch { }
    }
  }
  const srcPhoto = p => p.src || urls.get(p.id) || "";

  /* ---------- Utilitaires ---------- */
  const taille = o => !o ? "" : o < 1024 * 1024 ? Math.max(1, Math.round(o / 1024)) + " Ko" : (o / 1048576).toLocaleString("fr-FR", { maximumFractionDigits: 1 }) + " Mo";
  const format = d => {
    const n = (d.nom || "").toLowerCase(), m = d.mime || "";
    if (m.includes("pdf") || n.endsWith(".pdf")) return "PDF";
    if (/word|\.docx?$|\.odt$/.test(m + n)) return "Word";
    if (/sheet|excel|\.xlsx?$|\.ods$/.test(m + n)) return "Tableur";
    if (m.startsWith("image/")) return "Image";
    return "Fichier";
  };
  const nouvelId = p => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const saisonCourante = () => +(evenements.find(e => e.cat === "regate") || { date: AUJOURDHUI }).date.slice(0, 4);
  const memeRegate = (d, e) => d.regate && d.regate.date === e.date && d.regate.titre === e.titre;
  const msg = (cible, type, html) => { const z = $(cible); if (z) z.innerHTML = `<p class="message message-${type}">${html}</p>`; };

  /* Lien de document accessible : type, régate, format et poids dans l'intitulé */
  function lienDoc(d, contexte, libelle) {
    const nom = libelle || TYPES_DOC[d.type] || d.titre;
    if (d.exemple || !urls.has(d.id)) {
      return `<span class="doc-absent" title="Document d'exemple de la maquette">${esc(nom)}<span class="sr-only">${contexte ? " " + esc(contexte) : ""}</span>&nbsp;<span class="format">(exemple)</span></span>`;
    }
    return `<a class="lien-doc" href="${urls.get(d.id)}" download="${esc(d.nom || d.titre)}">${esc(nom)}<span class="sr-only">${contexte ? " " + esc(contexte) : ""}</span> <span class="format">${format(d)}, ${taille(d.taille)}</span></a>`;
  }

  /* =====================================================================
     PARTIE PUBLIQUE
     ===================================================================== */
  function afficherDocsSaison() {
    const regates = evenements.filter(e => e.cat === "regate");
    $("#docs-saison-annee").textContent = saisonCourante();
    $("#docs-saison").innerHTML = regates.map(e => {
      const docs = M.documents.filter(d => memeRegate(d, e)).sort((a, b) => ORDRE.indexOf(a.type) - ORDRE.indexOf(b.type));
      const passee = (e.dateFin || e.date) < AUJOURDHUI;
      return `<li><div><p class="regate-nom">${esc(e.titre)}${e.annule ? ' <span class="badge badge-corail">Annulée</span>' : ""}</p><p class="regate-date">${quand(e)}</p></div>
        <div class="liens-docs">${docs.map(d => lienDoc(d, e.titre)).join("") || `<span class="doc-absent">${passee ? "Résultats à venir" : "Documents à venir"}</span>`}</div></li>`;
    }).join("") || "<li>Aucune régate dans l'agenda.</li>";
    const prat = M.documents.filter(d => d.type === "pratique");
    $("#docs-pratiques").innerHTML = prat.map(d => `<li>${lienDoc(d, "", d.titre)}</li>`).join("") || "<li>Aucun document pour l'instant.</li>";
  }

  function saisonsHistorique() {
    return [...new Set(M.documents.filter(d => d.regate).map(d => d.saison))].sort((a, b) => b - a);
  }
  function afficherHistorique() {
    const sel = $("#historique-saison"), saisons = saisonsHistorique();
    const choix = +sel.value || saisons.find(s => s < saisonCourante()) || saisons[0];
    sel.innerHTML = saisons.map(s => `<option value="${s}"${s === choix ? " selected" : ""}>Saison ${s}</option>`).join("");
    const parRegate = new Map();
    M.documents.filter(d => d.regate && d.saison === choix).forEach(d => {
      const cle = d.regate.date + "|" + d.regate.titre;
      if (!parRegate.has(cle)) parRegate.set(cle, { ...d.regate, docs: [] });
      parRegate.get(cle).docs.push(d);
    });
    const liste = [...parRegate.values()].sort((a, b) => a.date.localeCompare(b.date));
    $("#historique-compte").textContent = `${liste.length} régate${liste.length > 1 ? "s" : ""} en ${choix}.`;
    $("#historique").innerHTML = liste.map(r => `<li><div><p class="regate-nom">${esc(r.titre)}</p><p class="regate-date">${jourSemaine[new Date(r.date + "T12:00").getDay()]} ${dateLongue(r.date)}</p></div>
      <div class="liens-docs">${r.docs.sort((a, b) => ORDRE.indexOf(b.type) - ORDRE.indexOf(a.type)).map(d => lienDoc(d, `${r.titre} ${choix}`)).join("")}</div></li>`).join("")
      || "<li>Aucun résultat archivé pour cette saison.</li>";
  }
  $("#historique-saison").addEventListener("change", afficherHistorique);

  /* ---------- Galerie accessible ---------- */
  /* Trois emplacements : accueil (4 dernières), page Le club (4 dernières), page Photos (toutes, par album) */
  let listes = {}, photosVisibles = [], indexCourant = 0, declencheur = null;
  const vignettes = (liste, nom) => liste.map((p, i) => `<li><figure style="margin:0">
      <button type="button" data-photo="${i}" data-liste="${nom}"><img src="${srcPhoto(p)}" alt="${esc(p.alt)}" width="${p.w || 400}" height="${p.h || 300}" loading="lazy"><span class="sr-only"> (agrandir la photo)</span></button>
      <figcaption>${p.legende ? esc(p.legende) : ""}<span class="album-nom">${esc(p.album)}</span></figcaption></figure></li>`).join("");
  function afficherGalerie() {
    const albums = [...new Set(M.photos.map(p => p.album))].sort();
    const sel = $("#filtre-album"), choix = sel.value;
    sel.innerHTML = '<option value="">Tous les albums</option>' + albums.map(a => `<option${a === choix ? " selected" : ""}>${esc(a)}</option>`).join("");
    listes.galerie = M.photos.filter(p => !sel.value || p.album === sel.value);
    listes.apercu = M.photos.slice(0, 4);
    $("#compte-photos").textContent = `${listes.galerie.length} photo${listes.galerie.length > 1 ? "s" : ""}${sel.value ? " dans l'album « " + sel.value + " »" : ""}.`;
    $("#galerie").innerHTML = vignettes(listes.galerie, "galerie") || "<li>Aucune photo dans cet album.</li>";
    $("#galerie-accueil").innerHTML = $("#galerie-club").innerHTML = vignettes(listes.apercu, "apercu");
  }
  $("#filtre-album").addEventListener("change", afficherGalerie);
  const vis = $("#visionneuse");
  function montrer(i) {
    indexCourant = (i + photosVisibles.length) % photosVisibles.length;
    const p = photosVisibles[indexCourant];
    $("#visionneuse-img").src = srcPhoto(p); $("#visionneuse-img").alt = p.alt;
    $("#visionneuse-legende").textContent = p.legende || "";
    $("#visionneuse-titre").textContent = `Photo ${indexCourant + 1} sur ${photosVisibles.length} · ${p.album}`;
    const seule = photosVisibles.length < 2;
    $("#visionneuse-prec").hidden = $("#visionneuse-suiv").hidden = seule;
  }
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-photo]"); if (!b) return;
    photosVisibles = listes[b.dataset.liste] || [];
    declencheur = b; montrer(+b.dataset.photo);
    if (typeof vis.showModal === "function") vis.showModal(); else vis.setAttribute("open", "");
    $("#visionneuse-fermer").focus();
  });
  $("#visionneuse-fermer").addEventListener("click", () => vis.close());
  $("#visionneuse-prec").addEventListener("click", () => montrer(indexCourant - 1));
  $("#visionneuse-suiv").addEventListener("click", () => montrer(indexCourant + 1));
  vis.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") { e.preventDefault(); montrer(indexCourant - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); montrer(indexCourant + 1); }
  });
  vis.addEventListener("click", e => { if (e.target === vis) vis.close(); });   // clic sur le fond
  vis.addEventListener("close", () => { if (declencheur) declencheur.focus(); });

  /* =====================================================================
     ESPACE BUREAU : DOCUMENTS
     ===================================================================== */
  let cibleAjout = null;
  function confirmer(bouton, texte, surOui) {
    const zone = document.createElement("div");
    zone.className = "confirmation"; zone.setAttribute("role", "group"); zone.setAttribute("aria-label", "Confirmer la suppression");
    zone.innerHTML = `<span>${esc(texte)}</span><button class="bouton bouton-principal bouton-petit" type="button">Oui, supprimer</button><button class="bouton bouton-secondaire bouton-petit" type="button">Non</button>`;
    bouton.after(zone); bouton.hidden = true;
    const [oui, non] = zone.querySelectorAll("button");
    oui.focus();
    oui.onclick = surOui;
    non.onclick = () => { zone.remove(); bouton.hidden = false; bouton.focus(); };
  }
  function afficherAdminDocs() {
    $("#bd-annee").textContent = saisonCourante();
    $("#bd-regates").innerHTML = evenements.filter(e => e.cat === "regate").map((e, i) => `<li><div><p class="regate-nom">${esc(e.titre)}</p><p class="regate-date">${quand(e)}</p></div>
      <div class="liens-docs">${ORDRE.map(t => {
        const d = M.documents.find(x => memeRegate(x, e) && x.type === t);
        return d ? `<span class="creneau-doc">${lienDoc(d, e.titre)}<button class="bouton bouton-secondaire bouton-petit" type="button" data-suppr-doc="${d.id}">Retirer<span class="sr-only"> ${TYPES_DOC[t]} ${esc(e.titre)}</span></button></span>`
          : `<button class="bouton bouton-secondaire bouton-petit" type="button" data-ajout-doc="${t}" data-regate="${i}">+ ${TYPES_DOC[t]}<span class="sr-only"> pour ${esc(e.titre)}</span></button>`;
      }).join("")}</div></li>`).join("") || "<li>Aucune régate dans l'agenda : ajoutez-les d'abord dans « Gérer l'agenda ».</li>";
    $("#bd-pratiques").innerHTML = M.documents.filter(d => d.type === "pratique").map(d => `<li><div><p class="regate-nom">${esc(d.titre)}</p></div>
      <div class="liens-docs">${lienDoc(d, "", "Voir")}<button class="bouton bouton-secondaire bouton-petit" type="button" data-suppr-doc="${d.id}">Retirer<span class="sr-only"> ${esc(d.titre)}</span></button></div></li>`).join("") || "<li>Aucun document pratique.</li>";
    // Archives
    const sel = $("#bd-archives-saison"), saisons = saisonsHistorique().filter(s => s < saisonCourante());
    const choix = +sel.value || saisons[0];
    sel.innerHTML = saisons.map(s => `<option value="${s}"${s === choix ? " selected" : ""}>${s}</option>`).join("") || "<option value=''>Aucune</option>";
    $("#bd-archives").innerHTML = M.documents.filter(d => d.regate && d.saison === choix && d.saison < saisonCourante()).sort((a, b) => a.regate.date.localeCompare(b.regate.date))
      .map(d => `<li><div><p class="regate-nom">${esc(d.regate.titre)}</p><p class="regate-date">${dateLongue(d.regate.date)} · ${TYPES_DOC[d.type]}</p></div>
        <div class="liens-docs">${lienDoc(d, d.regate.titre, "Voir")}<button class="bouton bouton-secondaire bouton-petit" type="button" data-suppr-doc="${d.id}">Retirer<span class="sr-only"> ${TYPES_DOC[d.type]} ${esc(d.regate.titre)} ${d.saison}</span></button></div></li>`).join("")
      || "<li>Aucune archive pour l'instant.</li>";
    $("#bda-noms").innerHTML = [...new Set([...evenements.filter(e => e.cat === "regate").map(e => e.titre), ...M.documents.filter(d => d.regate).map(d => d.regate.titre)])].map(n => `<option value="${esc(n)}">`).join("");
  }
  $("#bd-archives-saison").addEventListener("change", afficherAdminDocs);

  async function ajouterDocument(fichier, infos) {
    const d = { id: nouvelId("doc"), fichier: true, nom: fichier.name, taille: fichier.size, mime: fichier.type, ajoute: new Date().toISOString(), ...infos };
    await stockerFichier(d.id, fichier);
    M.documents.push(d); enregistrer(); toutAfficher();
    return d;
  }
  // Ajout en un clic : le bouton ouvre directement le choix du fichier
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-ajout-doc]");
    if (b) { cibleAjout = { type: b.dataset.ajoutDoc, regate: evenements.filter(x => x.cat === "regate")[+b.dataset.regate], bouton: b }; $("#bd-fichier").value = ""; $("#bd-fichier").click(); }
    const s = e.target.closest("[data-suppr-doc]");
    if (s) {
      const d = M.documents.find(x => x.id === s.dataset.supprDoc);
      confirmer(s, `Retirer « ${d.titre} » ?`, async () => {
        M.documents = M.documents.filter(x => x !== d); await supprimerFichier(d.id); enregistrer(); toutAfficher();
        msg("#bd-message", "ok", `« ${esc(d.titre)} » a été retiré.`);
      });
    }
  });
  $("#bd-fichier").addEventListener("change", async () => {
    const f = $("#bd-fichier").files[0]; if (!f || !cibleAjout) return;
    const { type, regate } = cibleAjout;
    const d = await ajouterDocument(f, { type, saison: +regate.date.slice(0, 4), regate: { titre: regate.titre, date: regate.date }, titre: `${TYPES_DOC[type]} – ${regate.titre}` });
    msg("#bd-message", "ok", `${esc(TYPES_DOC[type])} de « ${esc(regate.titre)} » ajouté (${esc(f.name)}). Il est visible dans l'Espace régates.`);
    const suivant = document.querySelector(`[data-suppr-doc="${d.id}"]`); if (suivant) suivant.focus();
  });
  function erreurChamp(champ, zone, texte) {
    $(zone).innerHTML = `<p class="message message-erreur">${texte}</p>`;
    $(champ).setAttribute("aria-invalid", "true"); $(champ).focus();
  }
  $("#bd-form-pratique").addEventListener("submit", async e => {
    e.preventDefault();
    document.querySelectorAll("#bd-form-pratique [aria-invalid]").forEach(n => n.removeAttribute("aria-invalid")); $("#bdp-erreur").innerHTML = "";
    const titre = $("#bdp-titre").value.trim(), f = $("#bdp-fichier").files[0];
    if (!titre) return erreurChamp("#bdp-titre", "#bdp-erreur", "Indiquez le titre du document.");
    if (!f) return erreurChamp("#bdp-fichier", "#bdp-erreur", "Choisissez le fichier à ajouter.");
    await ajouterDocument(f, { type: "pratique", saison: saisonCourante(), regate: null, titre });
    e.target.reset(); $("#bdp-erreur").innerHTML = `<p class="message message-ok">« ${esc(titre)} » ajouté.</p>`;
  });
  $("#bd-form-archive").addEventListener("submit", async e => {
    e.preventDefault();
    document.querySelectorAll("#bd-form-archive [aria-invalid]").forEach(n => n.removeAttribute("aria-invalid")); $("#bda-erreur").innerHTML = "";
    const nom = $("#bda-nom").value.trim(), date = $("#bda-date").value, type = $("#bda-type").value, f = $("#bda-fichier").files[0];
    if (!nom) return erreurChamp("#bda-nom", "#bda-erreur", "Indiquez le nom de la régate.");
    if (!date) return erreurChamp("#bda-date", "#bda-erreur", "Indiquez la date de la régate.");
    if (!f) return erreurChamp("#bda-fichier", "#bda-erreur", "Choisissez le fichier à ajouter.");
    const saison = +date.slice(0, 4);
    await ajouterDocument(f, { type, saison, regate: { titre: nom, date }, titre: `${TYPES_DOC[type]} – ${nom}` });
    e.target.reset(); $("#bd-archives-saison").value = saison; afficherAdminDocs();
    $("#bda-erreur").innerHTML = `<p class="message message-ok">${esc(TYPES_DOC[type])} de « ${esc(nom)} » (${saison}) ajouté à l'historique.</p>`;
  });

  /* =====================================================================
     ESPACE BUREAU : PHOTOS
     ===================================================================== */
  let enAttente = [];
  async function reduire(fichier) {
    const bmp = await createImageBitmap(fichier);
    const r = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * r); c.height = Math.round(bmp.height * r);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise(ok => c.toBlob(ok, "image/jpeg", 0.85));
    return { blob, w: c.width, h: c.height };
  }
  async function preparerPhotos(fichiers) {
    const images = [...fichiers].filter(f => f.type.startsWith("image/"));
    const refusees = [];
    for (const f of images) {
      try { const r = await reduire(f); enAttente.push({ id: nouvelId("photo"), nom: f.name, ...r, apercu: URL.createObjectURL(r.blob) }); }
      catch { refusees.push(f.name); }
    }
    afficherApercus();
    if (refusees.length) msg("#bph-message", "erreur", `Format non pris en charge : ${refusees.map(esc).join(", ")}. Utilisez des photos JPEG ou PNG.`);
    else $("#bph-message").innerHTML = "";
    if (enAttente.length) { const premier = document.querySelector("#bph-apercus textarea"); if (premier) premier.focus(); }
  }
  function afficherApercus() {
    $("#bph-form").hidden = !enAttente.length;
    $("#bph-publier").textContent = `Publier ${enAttente.length > 1 ? "les " + enAttente.length + " photos" : "la photo"}`;
    $("#bph-albums").innerHTML = [...new Set(M.photos.map(p => p.album))].map(a => `<option value="${esc(a)}">`).join("");
    $("#bph-apercus").innerHTML = enAttente.map((p, i) => `<li><img src="${p.apercu}" alt="Aperçu de la photo ${i + 1} : ${esc(p.nom)}">
      <div class="corps">
        <div class="champ"><label for="bph-alt-${i}">Que montre la photo ? <span class="obligatoire" aria-hidden="true">*</span><span class="aide">Une phrase pour les personnes qui ne la voient pas. Ex. : « Trois J80 au départ, spis colorés. »</span></label>
          <textarea id="bph-alt-${i}" data-i="${i}" data-champ="alt" rows="2" required style="min-height:70px">${esc(p.alt || "")}</textarea></div>
        <div class="champ"><label for="bph-leg-${i}">Légende<span class="aide">Facultatif, affichée sous la photo</span></label>
          <input type="text" id="bph-leg-${i}" data-i="${i}" data-champ="legende" value="${esc(p.legende || "")}"></div>
        <button class="bouton bouton-secondaire bouton-petit" type="button" data-retirer-apercu="${i}" style="align-self:flex-start">Ne pas publier<span class="sr-only"> la photo ${i + 1}</span></button>
      </div></li>`).join("");
  }
  $("#bph-apercus").addEventListener("input", e => { const c = e.target.dataset; if (c.champ) enAttente[+c.i][c.champ] = e.target.value; });
  $("#bph-apercus").addEventListener("click", e => {
    const b = e.target.closest("[data-retirer-apercu]"); if (!b) return;
    const [p] = enAttente.splice(+b.dataset.retirerApercu, 1); URL.revokeObjectURL(p.apercu); afficherApercus();
    if (!enAttente.length) $("#bph-fichiers").focus();
  });
  $("#bph-fichiers").addEventListener("change", e => preparerPhotos(e.target.files));
  const depot = $("#bph-depot");
  ["dragenter", "dragover"].forEach(t => depot.addEventListener(t, e => { e.preventDefault(); depot.classList.add("survol"); }));
  ["dragleave", "drop"].forEach(t => depot.addEventListener(t, e => { e.preventDefault(); depot.classList.remove("survol"); }));
  depot.addEventListener("drop", e => preparerPhotos(e.dataTransfer.files));
  $("#bph-annuler").addEventListener("click", () => { enAttente.forEach(p => URL.revokeObjectURL(p.apercu)); enAttente = []; afficherApercus(); $("#bph-fichiers").value = ""; $("#bph-fichiers").focus(); });
  $("#bph-form").addEventListener("submit", async e => {
    e.preventDefault();
    document.querySelectorAll("#bph-form [aria-invalid]").forEach(n => n.removeAttribute("aria-invalid")); $("#bph-erreur").innerHTML = "";
    const album = $("#bph-album").value.trim();
    if (!album) return erreurChamp("#bph-album", "#bph-erreur", "Indiquez l'album (par exemple « Régates 2026 »).");
    const sansDescription = enAttente.findIndex(p => !(p.alt || "").trim());
    if (sansDescription >= 0) return erreurChamp(`#bph-alt-${sansDescription}`, "#bph-erreur", `Décrivez la photo ${sansDescription + 1} : c'est ce que liront les personnes aveugles.`);
    for (const p of enAttente) {
      await stockerFichier(p.id, p.blob);
      M.photos.unshift({ id: p.id, fichier: true, w: p.w, h: p.h, album, alt: p.alt.trim(), legende: (p.legende || "").trim(), ajoute: new Date().toISOString() });
      URL.revokeObjectURL(p.apercu);
    }
    const n = enAttente.length; enAttente = []; enregistrer(); afficherApercus(); toutAfficher(); $("#bph-fichiers").value = "";
    msg("#bph-message", "ok", `${n} photo${n > 1 ? "s publiées" : " publiée"} dans l'album « ${esc(album)} ». <a href="#/galerie">Voir la page Photos</a>`);
  });
  function afficherAdminPhotos() {
    $("#bph-liste").innerHTML = M.photos.map(p => `<li><img src="${srcPhoto(p)}" alt="" loading="lazy">
      <div class="corps">
        <div class="champ"><label for="bphl-alt-${p.id}">Que montre la photo ?</label><textarea id="bphl-alt-${p.id}" rows="2" style="min-height:64px">${esc(p.alt)}</textarea></div>
        <div class="champ"><label for="bphl-leg-${p.id}">Légende</label><input type="text" id="bphl-leg-${p.id}" value="${esc(p.legende || "")}"></div>
        <div class="champ"><label for="bphl-alb-${p.id}">Album</label><input type="text" id="bphl-alb-${p.id}" value="${esc(p.album)}" list="bph-albums"></div>
        <div class="actions" style="margin-top:auto"><button class="bouton bouton-principal bouton-petit" type="button" data-maj-photo="${p.id}">Enregistrer</button>
          <button class="bouton bouton-secondaire bouton-petit" type="button" data-suppr-photo="${p.id}">Supprimer<span class="sr-only"> la photo ${esc(p.legende || p.alt.slice(0, 40))}</span></button></div>
        <div aria-live="polite" data-retour-photo="${p.id}"></div>
      </div></li>`).join("") || "<li>Aucune photo.</li>";
  }
  $("#bph-liste").addEventListener("click", e => {
    const maj = e.target.closest("[data-maj-photo]"), sup = e.target.closest("[data-suppr-photo]");
    if (maj) {
      const p = M.photos.find(x => x.id === maj.dataset.majPhoto), alt = $(`#bphl-alt-${p.id}`);
      const retour = document.querySelector(`[data-retour-photo="${p.id}"]`);
      if (!alt.value.trim()) { alt.setAttribute("aria-invalid", "true"); alt.focus(); retour.innerHTML = '<p class="erreur-champ">La description est obligatoire.</p>'; return; }
      alt.removeAttribute("aria-invalid");
      p.alt = alt.value.trim(); p.legende = $(`#bphl-leg-${p.id}`).value.trim(); p.album = $(`#bphl-alb-${p.id}`).value.trim() || p.album;
      enregistrer(); afficherGalerie(); retour.innerHTML = '<p class="message message-ok" style="margin-top:8px">Enregistré.</p>';
    }
    if (sup) {
      const p = M.photos.find(x => x.id === sup.dataset.supprPhoto);
      confirmer(sup, "Supprimer cette photo ?", async () => {
        M.photos = M.photos.filter(x => x !== p); if (p.fichier) await supprimerFichier(p.id); enregistrer(); toutAfficher();
        msg("#bph-message", "ok", "Photo supprimée."); $("#t-bph-liste").setAttribute("tabindex", "-1"); $("#t-bph-liste").focus();
      });
    }
  });

  /* ---------- Rafraîchissement ---------- */
  function toutAfficher() { afficherDocsSaison(); afficherHistorique(); afficherGalerie(); afficherAdminDocs(); afficherAdminPhotos(); }
  document.addEventListener("agenda-modifie", () => { afficherDocsSaison(); afficherAdminDocs(); });
  toutAfficher();                       // tout de suite avec les données connues
  chargerFichiers().then(toutAfficher); // puis avec les fichiers stockés
})();
