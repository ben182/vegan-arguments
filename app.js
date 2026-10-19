(() => {
  const $ = (sel) => document.querySelector(sel);
  const SPEICHER = "vk-fortschritt";
  const RUNDE = 10;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const nachId = Object.fromEntries(KARTEN.map((k) => [k.id, k]));

  // Fortschritt: Leitner-Fach je Karte (0 = neu, 1 = üben … 5 = sitzt sicher)
  let fortschritt = JSON.parse(localStorage.getItem(SPEICHER) || "{}");
  const fach = (id) => fortschritt[id] || 0;
  const speichern = () => localStorage.setItem(SPEICHER, JSON.stringify(fortschritt));
  const statusText = (id) => {
    const f = fach(id);
    if (f === 0) return "";
    if (f >= 3) return "✓ sitzt";
    return "↻ noch üben";
  };

  // ---------- Stöbern ----------
  let filterKat = null;

  function chips(container, aktiv, onClick, mehrfach = false) {
    const eintraege = mehrfach ? Object.entries(KATEGORIEN) : [[null, "Alle"], ...Object.entries(KATEGORIEN)];
    container.innerHTML = eintraege
      .map(([key, name]) => {
        const an = mehrfach ? aktiv.has(key) : aktiv === key;
        return `<button class="chip" data-kat="${key ?? ""}" aria-pressed="${an}">${esc(name)}</button>`;
      })
      .join("");
    container.onclick = (e) => {
      const b = e.target.closest(".chip");
      if (b) onClick(b.dataset.kat || null);
    };
  }

  function normal(s) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function rasterZeichnen() {
    chips($("#filter"), filterKat, (k) => { filterKat = k; rasterZeichnen(); });
    const q = normal($("#suche").value.trim());
    const liste = KARTEN.filter((k) =>
      (!filterKat || k.kategorie === filterKat) &&
      (!q || normal([k.argument, k.kurz, ...(k.punkte || [])].join(" ")).includes(q))
    );
    $("#raster").innerHTML = liste
      .map((k) => `
        <button class="kk" data-id="${k.id}">
          <span class="kategorie">${esc(KATEGORIEN[k.kategorie])}</span>
          <h3>${esc(k.argument)}</h3>
          <span class="status">${statusText(k.id)}</span>
        </button>`)
      .join("");
    $("#leer").hidden = liste.length > 0;
  }

  $("#raster").addEventListener("click", (e) => {
    const b = e.target.closest(".kk");
    if (b) location.hash = `karte/${b.dataset.id}`;
  });
  $("#suche").addEventListener("input", rasterZeichnen);

  // ---------- Detail ----------
  function detailHtml(k) {
    const teile = [
      `<span class="kategorie">${esc(KATEGORIEN[k.kategorie])}</span>`,
      `<h2 id="detail-argument">„${esc(k.argument.replace(/^[„"]|[“"]$/g, ""))}“</h2>`,
      `<p class="kurz">${esc(k.kurz)}</p>`,
    ];
    if (k.zahl) teile.push(`<div class="zahl"><strong>${esc(k.zahl.wert)}</strong><span>${esc(k.zahl.text)}</span></div>`);
    if (k.punkte?.length) teile.push(`<h4>Zum Vertiefen</h4><ul class="punkte">${k.punkte.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>`);
    if (k.konter) teile.push(`<div class="kasten konter"><b>Gegenfrage</b><p>${esc(k.konter)}</p></div>`);
    if (k.fehlschluss) teile.push(`<div class="kasten fehlschluss"><b>Denkfehler: ${esc(k.fehlschluss.name)}</b><p>${esc(k.fehlschluss.erklaerung)}</p></div>`);
    if (k.ehrlich) teile.push(`<div class="kasten ehrlich"><b>Fairerweise</b><p>${esc(k.ehrlich)}</p></div>`);
    if (k.quellen?.length) {
      teile.push(`<h4>Quellen</h4><ol class="quellen">${k.quellen
        .map((q) => `<li><a href="${esc(q.url)}" target="_blank" rel="noopener">${esc(q.titel)}</a>${q.jahr && !q.titel.includes(q.jahr) ? ` · ${q.jahr}` : ""}</li>`)
        .join("")}</ol>`);
    }
    teile.push(`<div class="detail-fuss"><span class="status">${statusText(k.id)}</span><button class="knopf" id="teilen">Link kopieren</button></div>`);
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
        else { await navigator.clipboard.writeText(url); e.target.textContent = "Kopiert ✓"; }
      } catch { /* abgebrochen */ }
    };
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
  }
  const detailZu = () => { if (location.hash.startsWith("#karte/")) history.back(); else dialog.close(); };
  $("#detail-zu").onclick = detailZu;
  dialog.addEventListener("click", (e) => { if (e.target === dialog) detailZu(); });
  dialog.addEventListener("cancel", (e) => { e.preventDefault(); detailZu(); });

  // ---------- Üben ----------
  let uebenKats = new Set(Object.keys(KATEGORIEN));
  let stapel = [], gesamt = 0, erledigt = 0, aufAnhieb = 0, versuche = {};

  function uebenStartZeichnen() {
    chips($("#ueben-filter"), uebenKats, (k) => {
      uebenKats.has(k) ? uebenKats.delete(k) : uebenKats.add(k);
      uebenStartZeichnen();
    }, true);
    const auswahl = KARTEN.filter((k) => uebenKats.has(k.kategorie));
    const sitzt = auswahl.filter((k) => fach(k.id) >= 3).length;
    const neu = auswahl.filter((k) => fach(k.id) === 0).length;
    $("#fortschritt-uebersicht").innerHTML = `
      <div><b>${auswahl.length}</b>Karten</div>
      <div><b>${neu}</b>neu</div>
      <div><b>${auswahl.length - neu - sitzt}</b>noch üben</div>
      <div><b>${sitzt}</b>sitzen</div>`;
    $("#start").disabled = auswahl.length === 0;
  }

  function mischen(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function rundeStarten() {
    // Unsichere Karten zuerst, innerhalb eines Fachs zufällig
    stapel = mischen(KARTEN.filter((k) => uebenKats.has(k.kategorie)))
      .sort((a, b) => fach(a.id) - fach(b.id))
      .slice(0, RUNDE)
      .map((k) => k.id);
    gesamt = stapel.length;
    erledigt = 0; aufAnhieb = 0; versuche = {};
    $("#ueben-start").hidden = true;
    $("#ueben-ende").hidden = true;
    $("#ueben-karte").hidden = false;
    karteZeigen();
  }

  function karteZeigen() {
    const k = nachId[stapel[0]];
    const karte = $("#lernkarte");
    karte.classList.remove("offen");
    $("#lern-kategorie").textContent = KATEGORIEN[k.kategorie];
    $("#lern-argument").textContent = `„${k.argument.replace(/^[„"]|[“"]$/g, "")}“`;
    // Rückseite erst nach dem Zurückdrehen tauschen, sonst blitzt die Antwort auf
    setTimeout(() => {
      $("#lern-bezug").textContent = `Auf „${k.argument.replace(/^[„"]|[“"]$/g, "").replace(/[.?!]$/, "")}“`;
      $("#lern-kurz").textContent = k.kurz;
      $("#lern-zahl").innerHTML = k.zahl ? `<div class="zahl"><strong>${esc(k.zahl.wert)}</strong><span>${esc(k.zahl.text)}</span></div>` : "";
    }, 250);
    $("#zaehler").textContent = `${erledigt} von ${gesamt} geschafft`;
    $("#leiste-fuellung").style.width = `${(erledigt / gesamt) * 100}%`;
    $("#aufdecken-reihe").hidden = false;
    $("#bewerten-reihe").hidden = true;
  }

  function aufdecken() {
    $("#lernkarte").classList.add("offen");
    $("#aufdecken-reihe").hidden = true;
    $("#bewerten-reihe").hidden = false;
  }

  function bewerten(gewusst) {
    const id = stapel.shift();
    versuche[id] = (versuche[id] || 0) + 1;
    if (gewusst) {
      fortschritt[id] = Math.min(5, fach(id) + 1);
      erledigt++;
      if (versuche[id] === 1) aufAnhieb++;
    } else {
      fortschritt[id] = 1;
      stapel.splice(Math.min(3, stapel.length), 0, id); // kommt in dieser Runde gleich nochmal
    }
    speichern();
    if (stapel.length) karteZeigen();
    else rundeBeenden();
  }

  function rundeBeenden() {
    $("#ueben-karte").hidden = true;
    $("#ueben-ende").hidden = false;
    $("#ende-text").textContent = aufAnhieb === gesamt
      ? `Alle ${gesamt} Karten auf Anhieb gewusst. Stark.`
      : `${aufAnhieb} von ${gesamt} Karten auf Anhieb gewusst. Die anderen kommen in der nächsten Runde wieder zuerst dran.`;
  }

  $("#start").onclick = rundeStarten;
  $("#nochmal-runde").onclick = rundeStarten;
  $("#aufdecken").onclick = aufdecken;
  $("#lernkarte").onclick = () => { if (!$("#lernkarte").classList.contains("offen")) aufdecken(); };
  $("#nochmal").onclick = () => bewerten(false);
  $("#gewusst").onclick = () => bewerten(true);
  $("#lern-mehr").onclick = (e) => { e.stopPropagation(); detailOeffnen(stapel[0]); };
  $("#zuruecksetzen").onclick = () => {
    if (!confirm("Lernfortschritt wirklich löschen?")) return;
    fortschritt = {};
    speichern();
    uebenStartZeichnen();
  };

  document.addEventListener("keydown", (e) => {
    if ($("#ueben-karte").hidden || dialog.open) return;
    if (e.key === " " && !$("#aufdecken-reihe").hidden) { e.preventDefault(); aufdecken(); }
    else if (!$("#bewerten-reihe").hidden && e.key === "1") bewerten(false);
    else if (!$("#bewerten-reihe").hidden && e.key === "2") bewerten(true);
  });

  // ---------- Routing ----------
  function route() {
    const h = location.hash.slice(1);
    const ueben = h === "ueben";
    document.querySelectorAll(".tabs a").forEach((a) => a.classList.toggle("aktiv", a.dataset.tab === (ueben ? "ueben" : "stoebern")));
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

  window.addEventListener("hashchange", route);
  route();
})();
