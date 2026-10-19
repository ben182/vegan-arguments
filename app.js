import "@fontsource-variable/bricolage-grotesque/standard.css";
import "@fontsource-variable/atkinson-hyperlegible-next/wght.css";
import "@fontsource-variable/atkinson-hyperlegible-next/wght-italic.css";
import "./style.css";
import * as FSRS from "./fsrs.js";
import { TEXTE } from "./texte.js";
import { ton, vorschlagLink, esc, ohneZeichen, darstellung } from "./karte-html.js";

const t = document.documentElement.lang === "en" ? TEXTE.en : TEXTE.de;
const { KARTEN, KATEGORIEN } = t.lang === "en" ? await import("./karten.en.js") : await import("./karten.js");
const { katName, zahlHtml, karteHtml } = darstellung(t, KATEGORIEN);

const $ = (sel) => document.querySelector(sel);
const SPEICHER = "vk-anki-v1";
const NEU_PRO_TAG = 10;
const VORLERNEN = 20 * FSRS.MIN; // wie Anki: Lernkarten bis 20 Min. vorziehen
const alleKats = () => [...new Set([...Object.keys(KATEGORIEN), ...KARTEN.map((k) => k.kategorie)])];
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

function statusText(id, jetzt = Date.now()) {
  const p = plan(id);
  if (p.status === "neu") return "";
  if (p.status !== "wiederholen") return t.statusLernen;
  const tage = FSRS.tag(p.faellig) - FSRS.tag(jetzt);
  return tage <= 0 ? t.statusHeute : t.statusDran(t.inTagen(tage));
}

// ---------- Nachschlagen ----------
let filterKat = null;

function reiter(container, istAn, onClick, mitAlle) {
  const anzahl = (key) => KARTEN.filter((k) => !key || k.kategorie === key).length;
  const kats = alleKats().filter((key) => anzahl(key) > 0);
  const eintraege = mitAlle ? ["", ...kats] : kats;
  container.innerHTML = eintraege
    .map((key) => `<button class="reiter-knopf" data-kat="${key}" aria-pressed="${istAn(key)}"${key ? ` style="--h:${ton(key)}"` : ""}>${key ? '<span class="punkt" aria-hidden="true"></span>' : ""}${esc(key ? katName(key) : t.alle)}<span class="anzahl">${anzahl(key)}</span></button>`)
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
        <h2 class="gruppe-titel" id="g-${esc(kat)}"><span class="punkt" aria-hidden="true"></span>${esc(katName(kat))}<span class="anzahl">${t.argumente(karten.length)}</span></h2>
        ${gi === 0 ? `<div class="spaltenkopf" aria-hidden="true"><span>${t.spalteSie}</span><span>${t.spalteDu}</span></div>` : ""}
        <ul class="zeilen">${karten.map((k) => {
          const st = statusText(k.id);
          const n = k.quellen?.length || 0;
          return `
          <li><a class="zeile" href="${t.kartePfad(k.id)}" data-id="${esc(k.id)}">
            <span class="z-argument">${esc(ohneZeichen(k.argument))}</span>
            <span class="z-antwort">${esc(k.kurz)}</span>
            <span class="z-meta">${n ? `<span class="belege">${t.quellenAnzahl(n)}</span>` : ""}${st ? `<span class="status">${esc(st)}</span>` : ""}</span>
          </a></li>`;
        }).join("")}</ul>
      </section>`)
    .join("");
  $("#leer").hidden = liste.length > 0;
  $("#leer-vorschlag").href = vorschlagLink($("#suche").value.trim());
  const nQuellen = new Set(KARTEN.flatMap((k) => (k.quellen || []).map((q) => q.url))).size;
  $("#bestand").textContent = t.bestand(KARTEN.length, nQuellen);
}

$("#suche").addEventListener("input", rasterZeichnen);

// ---------- Detail ----------
function detailHtml(k) {
  return karteHtml(k, { status: statusText(k.id), fuss: `<button class="knopf" id="teilen">${esc(t.linkKopieren)}</button>` });
}

const dialog = $("#detail");
function detailOeffnen(id) {
  const k = nachId[id];
  if (!k) return;
  $("#detail-inhalt").innerHTML = detailHtml(k);
  $("#teilen").onclick = async (e) => {
    const url = `${location.origin}${t.kartePfad(k.id)}`;
    try {
      if (navigator.share && matchMedia("(pointer: coarse)").matches) await navigator.share({ title: k.argument, text: k.kurz, url });
      else { await navigator.clipboard.writeText(url); e.target.textContent = t.linkKopiert; }
    } catch { /* abgebrochen */ }
  };
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
}
// Schließen: zurück zur Seite, von der aus die Karte geöffnet wurde (sonst zum Nachschlagen)
const detailZu = () => {
  if (!karteAusPfad()) return dialog.close();
  if (history.state?.app) history.back();
  else gehe(t.start, { ersetzen: true });
};
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
  return feld("z-neu", s.neu.length, t.zNeu) + feld("z-lernen", s.lernenBald.length, t.zLernen) + feld("z-faellig", s.faellig.length, t.zFaellig);
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
  $("#start").textContent = naechsteKarte(Date.now()) ? t.uebenStarten : t.nichtsZuUeben;
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
    $("#lern-bezug").textContent = t.zitat(ohneZeichen(k.argument).replace(/[.?!]$/, ""));
    $("#lern-kurz").textContent = k.kurz;
    $("#lern-zahl").innerHTML = zahlHtml(k);
  }, warOffen ? 280 : 0);

  const art = p.status === "neu" ? "z-neu" : p.status === "wiederholen" ? "z-faellig" : "z-lernen";
  $("#zaehler-lauf").innerHTML = zaehlerHtml(stapel(jetzt), art);
  const abstaende = FSRS.vorschau(p, jetzt);
  document.querySelectorAll(".bewertung small").forEach((el, i) => (el.textContent = FSRS.abstandText(abstaende[i], t.lang)));
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
    text = t.endeLernen(FSRS.abstandText(bis, t.lang));
    clearTimeout(weckerId);
    weckerId = setTimeout(() => { if (!$("#ueben-ende").hidden) starten(); }, bis + 500);
  } else {
    const naechste = KARTEN.map((k) => plan(k.id)).filter((p) => p.status === "wiederholen").map((p) => p.faellig).sort((a, b) => a - b)[0];
    text = naechste ? t.endeNaechste(t.inTagen(Math.max(1, FSRS.tag(naechste) - FSRS.tag(jetzt)))) : "";
  }
  if (offenNeu) text += ` ${t.endeUngesehen(offenNeu)}`;
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
  if (!confirm(t.zuruecksetzenFrage)) return;
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

// ---------- Routing (echte Adressen, History API) ----------
// /           Nachschlagen     /ueben/        Üben        /karte/<id>/      Karte
// /en/        Look up          /en/practise/  Practise    /en/card/<id>/    Card
const kartenMuster = new RegExp(`^${t.kartePfad("__ID__").replace("__ID__", "([\\w-]+)")}?$`);
const karteAusPfad = (pfad = location.pathname) => (pfad.match(kartenMuster) || [])[1];

function ansichtAusPfad(pfad = location.pathname) {
  if (pfad === t.uebenPfad || pfad === t.uebenPfad.slice(0, -1)) return "ueben";
  return "stoebern";
}

function gehe(pfad, { ersetzen = false } = {}) {
  if (pfad === location.pathname) return route();
  history[ersetzen ? "replaceState" : "pushState"]({ app: true }, "", pfad);
  route();
}

function route() {
  const id = karteAusPfad();
  const ansicht = ansichtAusPfad();
  document.querySelectorAll(".umschalter a").forEach((a) => a.classList.toggle("aktiv", a.dataset.tab === ansicht));
  if (id) {
    if ($("#ansicht-stoebern").hidden && $("#ueben-karte").hidden) zeige("stoebern");
    detailOeffnen(id);
    return;
  }
  if (dialog.open) dialog.close();
  zeige(ansicht);
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

// Interne Links ohne Neuladen öffnen; Strg/Cmd-Klick, neue Tabs und andere Sprache normal
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[href]");
  if (!a || a.target || a.hasAttribute("download") || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || a.classList.contains("sprachwahl")) return;
  const pfad = url.pathname;
  if (pfad !== t.start && !karteAusPfad(pfad) && ansichtAusPfad(pfad) !== "ueben") return;
  e.preventDefault();
  gehe(pfad);
});
window.addEventListener("popstate", route);

// Sprachwechsel: dieselbe Ansicht in der anderen Sprache
$(".sprachwahl")?.addEventListener("click", (e) => {
  const andere = TEXTE[t.spracheCode];
  const id = karteAusPfad();
  e.currentTarget.href = id ? andere.kartePfad(id) : ansichtAusPfad() === "ueben" ? andere.uebenPfad : andere.start;
});

// Alte Links mit #karte/<id> oder #ueben auf die echten Adressen umleiten
function alteLinks() {
  if (location.hash.startsWith("#karte/")) history.replaceState(null, "", t.kartePfad(location.hash.slice(7)));
  else if (location.hash === "#ueben") history.replaceState(null, "", t.uebenPfad);
  else return false;
  return true;
}
window.addEventListener("hashchange", () => { if (alteLinks()) route(); });
alteLinks();

localStorage.removeItem("vk-fortschritt"); // alter Leitner-Stand
route();
faelligAnzeigen();
