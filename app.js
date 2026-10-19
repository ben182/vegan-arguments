(() => {
  const $ = (sel) => document.querySelector(sel);
  const SPEICHER = "vk-anki-v1";
  const NEU_PRO_TAG = 10;
  const VORLERNEN = 20 * FSRS.MIN; // wie Anki: Lernkarten bis 20 Min. vorziehen
  // Farbton je Kategorie (OKLCH). Unbekannte Kategorien bekommen einen festen Ton aus ihrem Namen.
  const TOENE = { gesundheit: 20, natur: 135, umwelt: 200, ethik: 300, tierprodukte: 75, alltag: 250 };
  const ton = (kat) => TOENE[kat] ?? [...String(kat)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  const katName = (kat) => KATEGORIEN[kat] || kat;
  const alleKats = () => [...new Set([...Object.keys(KATEGORIEN), ...KARTEN.map((k) => k.kategorie)])];
  const host = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const ohneZeichen = (s) => s.replace(/^[„"]|[“"]$/g, "");
  const nachId = Object.fromEntries(KARTEN.map((k) => [k.id, k]));

  // ---------- Speicher ----------
  let stand = JSON.parse(localStorage.getItem(SPEICHER) || "null") || { karten: {}, neuHeute: { tag: 0, anzahl: 0, extra: 0 } };
  const speichern = () => localStorage.setItem(SPEICHER, JSON.stringify(stand));
  const plan = (id) => stand.karten[id] || FSRS.NEU;

  function neuHeute(jetzt) {
    const heute = FSRS.tag(jetzt);
    if (stand.neuHeute.tag !== heute) stand.neuHeute = { tag: heute, anzahl: 0, extra: 0 };
    return stand.neuHeute;
  }

  function inTagen(t) {
    if (t === 1) return "morgen";
    if (t < 30) return `in ${t} Tagen`;
    if (t < 365) { const m = Math.round(t / 30.4); return m === 1 ? "in einem Monat" : `in ${m} Monaten`; }
    const j = Math.round(t / 365); return j === 1 ? "in einem Jahr" : `in ${j} Jahren`;
  }

  function statusText(id, jetzt = Date.now()) {
    const p = plan(id);
    if (p.status === "neu") return "";
    if (p.status !== "wiederholen") return "lernst du gerade";
    const tage = FSRS.tag(p.faellig) - FSRS.tag(jetzt);
    return tage <= 0 ? "heute dran" : `${inTagen(tage)} dran`;
  }

  // ---------- Nachschlagen ----------
  let filterKat = null;

  function reiter(container, istAn, onClick, mitAlle) {
    const anzahl = (key) => KARTEN.filter((k) => !key || k.kategorie === key).length;
    const kats = alleKats().filter((key) => anzahl(key) > 0);
    const eintraege = mitAlle ? ["", ...kats] : kats;
    container.innerHTML = eintraege
      .map((key) => `<button class="reiter-knopf" data-kat="${key}" aria-pressed="${istAn(key)}"${key ? ` style="--h:${ton(key)}"` : ""}>${key ? '<span class="punkt" aria-hidden="true"></span>' : ""}${esc(key ? katName(key) : "Alle")}<span class="anzahl">${anzahl(key)}</span></button>`)
      .join("");
    container.onclick = (e) => {
      const b = e.target.closest(".reiter-knopf");
      if (b) onClick(b.dataset.kat);
    };
  }

  const normal = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  function rasterZeichnen() {
    reiter($("#filter"), (k) => (filterKat || "") === k, (k) => { filterKat = k || null; rasterZeichnen(); }, true);
    const q = normal($("#suche").value.trim());
    const liste = KARTEN.filter((k) =>
      (!filterKat || k.kategorie === filterKat) &&
      (!q || normal([k.argument, k.kurz, ...(k.punkte || [])].join(" ")).includes(q))
    );
    const gruppen = alleKats()
      .map((kat) => [kat, liste.filter((k) => k.kategorie === kat)])
      .filter(([, karten]) => karten.length);
    $("#raster").innerHTML = gruppen
      .map(([kat, karten], gi) => `
        <section class="gruppe" style="--h:${ton(kat)}" aria-labelledby="g-${esc(kat)}">
          <h2 class="gruppe-titel" id="g-${esc(kat)}"><span class="punkt" aria-hidden="true"></span>${esc(katName(kat))}<span class="anzahl">${karten.length} ${karten.length === 1 ? "Argument" : "Argumente"}</span></h2>
          ${gi === 0 ? '<div class="spaltenkopf" aria-hidden="true"><span>Sie sagen</span><span>Du antwortest</span></div>' : ""}
          <ul class="zeilen">${karten.map((k) => {
            const st = statusText(k.id);
            const n = k.quellen?.length || 0;
            return `
            <li><a class="zeile" href="#karte/${esc(k.id)}" data-id="${esc(k.id)}">
              <span class="z-argument">${esc(ohneZeichen(k.argument))}</span>
              <span class="z-antwort">${esc(k.kurz)}</span>
              <span class="z-meta">${n ? `<span class="belege">${n} ${n === 1 ? "Quelle" : "Quellen"}</span>` : ""}${st ? `<span class="status">${esc(st)}</span>` : ""}</span>
            </a></li>`;
          }).join("")}</ul>
        </section>`)
      .join("");
    $("#leer").hidden = liste.length > 0;
    const nQuellen = new Set(KARTEN.flatMap((k) => (k.quellen || []).map((q) => q.url))).size;
    $("#bestand").textContent = `${KARTEN.length} Argumente, ${nQuellen} verschiedene Quellen`;
  }

  $("#suche").addEventListener("input", rasterZeichnen);

  // ---------- Detail ----------
  function zahlHtml(k) {
    return k.zahl ? `<p class="zahl"><strong>${esc(k.zahl.wert)}</strong><span>${esc(k.zahl.text)}</span></p>` : "";
  }

  function detailHtml(k) {
    const st = statusText(k.id);
    const teile = [
      `<div class="detail-koerper" style="--h:${ton(k.kategorie)}">`,
      `<header class="d-kopf">`,
      `<p class="d-thema"><span class="punkt" aria-hidden="true"></span>${esc(katName(k.kategorie))}${st ? `<span class="status">${esc(st)}</span>` : ""}</p>`,
      `<p class="d-sagt">Jemand sagt:</p>`,
      `<h2 id="detail-argument" class="d-argument">${esc(ohneZeichen(k.argument))}</h2>`,
      `</header>`,
      `<section class="d-antwort"><h3>Deine Antwort fürs Gespräch</h3><p class="kurz">${esc(k.kurz)}</p>${zahlHtml(k)}</section>`,
    ];
    if (k.punkte?.length) teile.push(`<section class="d-abschnitt"><h3>Wenn jemand nachhakt</h3><ul class="punkte">${k.punkte.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></section>`);
    const notizen = [];
    if (k.konter) notizen.push(`<div class="notiz konter"><h3>Gegenfrage</h3><p>${esc(k.konter)}</p></div>`);
    if (k.fehlschluss) notizen.push(`<div class="notiz fehlschluss"><h3>Denkfehler: ${esc(k.fehlschluss.name)}</h3><p>${esc(k.fehlschluss.erklaerung)}</p></div>`);
    if (k.ehrlich) notizen.push(`<div class="notiz ehrlich"><h3>Was du fairerweise zugeben solltest</h3><p>${esc(k.ehrlich)}</p></div>`);
    if (notizen.length) teile.push(`<div class="notizen">${notizen.join("")}</div>`);
    if (k.quellen?.length) {
      teile.push(`<section class="d-abschnitt"><h3>Quellen</h3><ol class="quellen">${k.quellen
        .map((q) => `<li><a href="${esc(q.url)}" target="_blank" rel="noopener">${esc(q.titel)}</a><span class="q-meta">${esc(host(q.url))}${q.jahr && !q.titel.includes(q.jahr) ? `, ${q.jahr}` : ""}</span></li>`)
        .join("")}</ol></section>`);
    }
    teile.push(`<div class="detail-fuss"><button class="knopf" id="teilen">Link kopieren</button></div></div>`);
    return teile.join("");
  }

  const dialog = $("#detail");
  function detailOeffnen(id) {
    const k = nachId[id];
    if (!k) return;
    $("#detail-inhalt").innerHTML = detailHtml(k);
    $("#teilen").onclick = async (e) => {
      const url = `${location.origin}${location.pathname}#karte/${k.id}`;
      try {
        if (navigator.share && matchMedia("(pointer: coarse)").matches) await navigator.share({ title: k.argument, text: k.kurz, url });
        else { await navigator.clipboard.writeText(url); e.target.textContent = "Link kopiert"; }
      } catch { /* abgebrochen */ }
    };
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
  }
  const detailZu = () => { if (location.hash.startsWith("#karte/")) history.back(); else dialog.close(); };
  $("#detail-zu").onclick = detailZu;
  dialog.addEventListener("click", (e) => { if (e.target === dialog) detailZu(); });
  dialog.addEventListener("cancel", (e) => { e.preventDefault(); detailZu(); });

  // ---------- Üben (Anki-Warteschlange) ----------
  let uebenKats = new Set(alleKats());
  let aktuell = null;

  function stapel(jetzt) {
    const auswahl = KARTEN.filter((k) => uebenKats.has(k.kategorie));
    const heute = FSRS.tag(jetzt);
    const lernen = [], faellig = [], neu = [];
    for (const k of auswahl) {
      const p = plan(k.id);
      if (p.status === "neu") neu.push(k.id);
      else if (p.status === "wiederholen") { if (FSRS.tag(p.faellig) <= heute) faellig.push(k.id); }
      else lernen.push(k.id);
    }
    const nachTermin = (a, b) => plan(a).faellig - plan(b).faellig;
    lernen.sort(nachTermin);
    faellig.sort(nachTermin);
    const n = neuHeute(jetzt);
    const neuFrei = Math.max(0, NEU_PRO_TAG + n.extra - n.anzahl);
    return {
      lernenJetzt: lernen.filter((id) => plan(id).faellig <= jetzt),
      lernenBald: lernen.filter((id) => plan(id).faellig <= jetzt + VORLERNEN),
      lernenSpaeter: lernen.filter((id) => plan(id).faellig > jetzt + VORLERNEN),
      faellig,
      neu: neu.slice(0, neuFrei),
    };
  }

  function naechsteKarte(jetzt) {
    const s = stapel(jetzt);
    return s.lernenJetzt[0] || s.faellig[0] || s.neu[0] || s.lernenBald[0] || null;
  }

  function zaehlerHtml(s, hervorheben) {
    const feld = (cls, zahl, name) =>
      `<div class="${cls}${hervorheben === cls ? " aktuell" : ""}"><dt>${name}</dt><dd>${zahl}</dd></div>`;
    return feld("z-neu", s.neu.length, "neu") + feld("z-lernen", s.lernenBald.length, "in Arbeit") + feld("z-faellig", s.faellig.length, "zum Wiederholen");
  }

  function faelligAnzeigen() {
    const s = stapel(Date.now());
    const n = s.lernenBald.length + s.faellig.length;
    const el = $("#faellig-zahl");
    el.hidden = n === 0;
    el.textContent = n;
  }

  function uebenStartZeichnen() {
    reiter($("#ueben-filter"), (k) => uebenKats.has(k), (k) => {
      uebenKats.has(k) ? uebenKats.delete(k) : uebenKats.add(k);
      uebenStartZeichnen();
    }, false);
    const s = stapel(Date.now());
    $("#zaehler-start").innerHTML = zaehlerHtml(s);
    $("#start").disabled = !naechsteKarte(Date.now());
    $("#start").textContent = naechsteKarte(Date.now()) ? "Üben starten" : "Gerade nichts zu üben";
  }

  function karteZeigen() {
    const jetzt = Date.now();
    aktuell = naechsteKarte(jetzt);
    if (!aktuell) return fertig();

    const k = nachId[aktuell];
    const p = plan(aktuell);
    const karte = $("#lernkarte");
    const warOffen = karte.classList.contains("offen");
    karte.classList.remove("offen");
    karte.style.setProperty("--h", ton(k.kategorie));
    $("#lern-kategorie").textContent = katName(k.kategorie);
    $("#lern-argument").textContent = ohneZeichen(k.argument);
    // Rückseite erst tauschen, wenn sie weggedreht ist, sonst blitzt die neue Antwort auf
    setTimeout(() => {
      $("#lern-bezug").textContent = `„${ohneZeichen(k.argument).replace(/[.?!]$/, "")}“`;
      $("#lern-kurz").textContent = k.kurz;
      $("#lern-zahl").innerHTML = zahlHtml(k);
    }, warOffen ? 280 : 0);

    const art = p.status === "neu" ? "z-neu" : p.status === "wiederholen" ? "z-faellig" : "z-lernen";
    $("#zaehler-lauf").innerHTML = zaehlerHtml(stapel(jetzt), art);
    const abstaende = FSRS.vorschau(p, jetzt);
    document.querySelectorAll(".bewertung small").forEach((el, i) => (el.textContent = FSRS.abstandText(abstaende[i])));
    $("#aufdecken-reihe").hidden = false;
    $("#bewerten-reihe").hidden = true;
  }

  function aufdecken() {
    $("#lernkarte").classList.add("offen");
    $("#aufdecken-reihe").hidden = true;
    $("#bewerten-reihe").hidden = false;
  }

  function bewerten(note) {
    if (!aktuell || $("#bewerten-reihe").hidden) return;
    const jetzt = Date.now();
    if (plan(aktuell).status === "neu") neuHeute(jetzt).anzahl++;
    stand.karten[aktuell] = FSRS.planen(plan(aktuell), note, jetzt);
    speichern();
    faelligAnzeigen();
    karteZeigen();
  }

  let weckerId = null;
  function fertig() {
    $("#ueben-karte").hidden = true;
    $("#ueben-ende").hidden = false;
    const jetzt = Date.now();
    const s = stapel(jetzt);
    const offenNeu = KARTEN.filter((k) => uebenKats.has(k.kategorie) && plan(k.id).status === "neu").length;
    let text;
    if (s.lernenSpaeter.length) {
      const bis = plan(s.lernenSpaeter[0]).faellig - jetzt;
      text = `Eine Karte in Arbeit kommt in ${FSRS.abstandText(bis)} wieder. Lass die Seite offen, dann geht es automatisch weiter.`;
      clearTimeout(weckerId);
      weckerId = setTimeout(() => { if (!$("#ueben-ende").hidden) starten(); }, bis + 500);
    } else {
      const naechste = KARTEN.map((k) => plan(k.id)).filter((p) => p.status === "wiederholen").map((p) => p.faellig).sort((a, b) => a - b)[0];
      text = naechste ? `Die nächste Wiederholung ist ${inTagen(Math.max(1, FSRS.tag(naechste) - FSRS.tag(jetzt)))} dran.` : "";
    }
    if (offenNeu) text += ` ${offenNeu} ${offenNeu === 1 ? "Karte hast" : "Karten hast"} du noch nicht gesehen.`;
    $("#ende-text").textContent = text.trim();
    $("#mehr-neue").hidden = offenNeu === 0;
  }

  function starten() {
    $("#ueben-start").hidden = true;
    $("#ueben-ende").hidden = true;
    $("#ueben-karte").hidden = false;
    karteZeigen();
  }

  $("#start").onclick = starten;
  $("#mehr-neue").onclick = () => { neuHeute(Date.now()).extra += NEU_PRO_TAG; speichern(); starten(); };
  $("#aufdecken").onclick = aufdecken;
  $("#lernkarte").onclick = () => { if (!$("#lernkarte").classList.contains("offen")) aufdecken(); };
  $("#bewerten-reihe").onclick = (e) => {
    const b = e.target.closest(".bewertung");
    if (b) bewerten(Number(b.dataset.note));
  };
  $("#lern-mehr").onclick = (e) => { e.stopPropagation(); detailOeffnen(aktuell); };
  $("#zuruecksetzen").onclick = () => {
    if (!confirm("Deinen ganzen Lernfortschritt löschen? Das lässt sich nicht rückgängig machen.")) return;
    stand = { karten: {}, neuHeute: { tag: 0, anzahl: 0, extra: 0 } };
    speichern();
    faelligAnzeigen();
    uebenStartZeichnen();
  };

  document.addEventListener("keydown", (e) => {
    if ($("#ueben-karte").hidden || dialog.open || e.metaKey || e.ctrlKey) return;
    if ((e.key === " " || e.key === "Enter") && !$("#aufdecken-reihe").hidden) { e.preventDefault(); aufdecken(); }
    else if (["1", "2", "3", "4"].includes(e.key)) bewerten(Number(e.key));
    else if (e.key === " " && !$("#bewerten-reihe").hidden) { e.preventDefault(); bewerten(FSRS.GUT); } // wie Anki
  });

  // ---------- Routing ----------
  function route() {
    const h = location.hash.slice(1);
    const ueben = h === "ueben";
    document.querySelectorAll(".umschalter a").forEach((a) => a.classList.toggle("aktiv", a.dataset.tab === (ueben ? "ueben" : "stoebern")));
    if (h.startsWith("karte/")) {
      if ($("#ansicht-stoebern").hidden && $("#ueben-karte").hidden) zeige("stoebern");
      detailOeffnen(h.slice(6));
      return;
    }
    if (dialog.open) dialog.close();
    zeige(ueben ? "ueben" : "stoebern");
  }

  function zeige(ansicht) {
    $("#ansicht-stoebern").hidden = ansicht !== "stoebern";
    $("#ansicht-ueben").hidden = ansicht !== "ueben";
    if (ansicht === "stoebern") rasterZeichnen();
    else if ($("#ueben-karte").hidden) {
      $("#ueben-start").hidden = false;
      $("#ueben-ende").hidden = true;
      uebenStartZeichnen();
    }
  }

  localStorage.removeItem("vk-fortschritt"); // alter Leitner-Stand
  window.addEventListener("hashchange", route);
  route();
  faelligAnzeigen();
})();
