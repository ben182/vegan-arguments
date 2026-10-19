// Darstellung einer Karte als HTML-String. Wird von der App (Detailansicht)
// und beim Build für die statischen Einzelseiten genutzt – in jeder Sprache.

// Farbton je Kategorie (OKLCH). Unbekannte Kategorien bekommen einen festen Ton aus ihrem Namen.
const TOENE = { gesundheit: 20, natur: 135, umwelt: 200, ethik: 300, tierprodukte: 75, alltag: 250 };
export const ton = (kat) => TOENE[kat] ?? [...String(kat)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

export const REPO = "https://github.com/ben182/vegan-arguments";
export const fehlerLink = (k) => `${REPO}/issues/new?template=error.yml&title=${encodeURIComponent(`Error: ${k.id}`)}&karte=${encodeURIComponent(k.id)}`;
export const vorschlagLink = (text = "") => `${REPO}/issues/new?template=argument.yml${text ? `&argument=${encodeURIComponent(text)}` : ""}`;

const host = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } };

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const ohneZeichen = (s) => s.replace(/^[„"“]|[“"”]$/g, "");

// t: Texte einer Sprache (texte.js), kategorien: KATEGORIEN derselben Sprache
export function darstellung(t, kategorien) {
  const katName = (kat) => kategorien[kat] || kat;
  const monatJahr = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(t.locale, { month: "long", year: "numeric" });

  function zahlHtml(k) {
    return k.zahl ? `<p class="zahl"><strong>${esc(k.zahl.wert)}</strong><span>${esc(k.zahl.text)}</span></p>` : "";
  }

  // status: Lernstand (nur in der App); fuss: HTML vor „Fehler melden“; ueberschrift: h1 auf Einzelseiten
  function karteHtml(k, { status = "", fuss = "", ueberschrift = "h2" } = {}) {
    const H = ueberschrift;
    const teile = [
      `<div class="detail-koerper" style="--h:${ton(k.kategorie)}">`,
      `<header class="d-kopf">`,
      `<p class="d-thema"><span class="punkt" aria-hidden="true"></span>${esc(katName(k.kategorie))}${status ? `<span class="status">${esc(status)}</span>` : ""}</p>`,
      `<p class="d-sagt">${esc(t.sagt)}</p>`,
      `<${H} id="detail-argument" class="d-argument">${esc(ohneZeichen(k.argument))}</${H}>`,
      `</header>`,
      `<section class="d-antwort"><h3>${esc(t.antwortTitel)}</h3><p class="kurz">${esc(k.kurz)}</p>${zahlHtml(k)}</section>`,
    ];
    if (k.punkte?.length) teile.push(`<section class="d-abschnitt"><h3>${esc(t.nachhakt)}</h3><ul class="punkte">${k.punkte.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></section>`);
    const notizen = [];
    if (k.konter) notizen.push(`<div class="notiz konter"><h3>${esc(t.gegenfrage)}</h3><p>${esc(k.konter)}</p></div>`);
    if (k.fehlschluss) notizen.push(`<div class="notiz fehlschluss"><h3>${esc(t.denkfehler)}: ${esc(k.fehlschluss.name)}</h3><p>${esc(k.fehlschluss.erklaerung)}</p></div>`);
    if (k.ehrlich) notizen.push(`<div class="notiz ehrlich"><h3>${esc(t.fairerweise)}</h3><p>${esc(k.ehrlich)}</p></div>`);
    if (notizen.length) teile.push(`<div class="notizen">${notizen.join("")}</div>`);
    if (k.quellen?.length) {
      teile.push(`<section class="d-abschnitt"><h3>${esc(t.quellen)}</h3><ol class="quellen">${k.quellen
        .map((q) => `<li><a href="${esc(q.url)}" target="_blank" rel="noopener">${esc(q.titel)}</a><span class="q-meta">${esc(host(q.url))}${q.jahr && !q.titel.includes(q.jahr) ? `, ${q.jahr}` : ""}</span></li>`)
        .join("")}</ol>${k.geprueft ? `<p class="geprueft">${esc(t.geprueft(monatJahr(k.geprueft)))}</p>` : ""}</section>`);
    }
    teile.push(`<div class="detail-fuss">${fuss}<a class="textknopf" href="${fehlerLink(k)}" target="_blank" rel="noopener">${esc(t.fehlerMelden)}</a></div></div>`);
    return teile.join("");
  }

  return { katName, zahlHtml, karteHtml };
}
