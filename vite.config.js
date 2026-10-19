import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { existsSync, readFileSync } from "node:fs";
import * as de from "./karten.js";
import { TEXTE, htmlUebersetzen } from "./texte.js";
import { darstellung, esc, ohneZeichen, ton } from "./karte-html.js";

// Produktionsadresse für Canonical-Links und Sitemap, z. B. SITE_URL=https://example.org npm run build
const SITE = (process.env.SITE_URL || "https://vegan-arguments.pages.dev").replace(/\/$/, "");

// Inhalte je Sprache; Englisch nur, wenn die Übersetzung existiert
const INHALTE = { de };
if (existsSync(new URL("./karten.en.js", import.meta.url))) INHALTE.en = await import("./karten.en.js");
const SPRACHEN = Object.keys(INHALTE);

// Web-App-Manifest je Sprache (Name, Startseite)
const ICONS = [
  { src: "/pwa-64x64.png", sizes: "64x64", type: "image/png" },
  { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
  { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
  { src: "/maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
];
const manifest = (t) => ({
  name: t.titel,
  short_name: t.marke,
  description: t.beschreibung,
  lang: t.lang,
  start_url: t.start,
  scope: "/",
  display: "standalone",
  theme_color: "#2b1a2c",
  background_color: "#f5f3f4",
  icons: ICONS,
});
const manifestDatei = (t) => (t.lang === "de" ? "/manifest.webmanifest" : `/manifest.${t.lang}.webmanifest`);

// <link rel="alternate" hreflang> für eine Seite, die es in allen Sprachen gibt
const alternativen = (pfad) => [
  ...SPRACHEN.map((l) => `<link rel="alternate" hreflang="${l}" href="${SITE}${pfad(TEXTE[l])}">`),
  `<link rel="alternate" hreflang="x-default" href="${SITE}${pfad(TEXTE.de)}">`,
].join("\n  ");

function kopf(t) {
  const anderes = TEXTE[t.spracheCode];
  return `<header class="kopf">
    <div class="kopf-innen">
      <a class="marke" href="${t.start}"><span class="marke-zeichen" aria-hidden="true">„</span>${esc(t.marke)}</a>
      <nav class="umschalter" aria-label="${esc(t.navLabel)}">
        <a href="${t.start}">${esc(t.navNachschlagen)}</a>
        <a href="${t.uebenPfad}">${esc(t.navUeben)}</a>
      </nav>
      ${INHALTE[anderes.lang] ? `<a class="sprachwahl" href="__ANDERE_SEITE__" hreflang="${anderes.lang}" lang="${anderes.lang}" aria-label="${esc(t.sprache)}">${t.spracheKurz}</a>` : ""}
    </div>
  </header>`;
}

function einzelseite(k, t, css) {
  const { KARTEN, KATEGORIEN } = INHALTE[t.lang];
  const { karteHtml, katName } = darstellung(t, KATEGORIEN);
  const url = `${SITE}${t.kartePfad(k.id)}`;
  const titel = `${t.seitenTitel(ohneZeichen(k.argument).replace(/[.!]$/, ""))} | ${t.marke}`;
  const verwandt = KARTEN.filter((x) => x.kategorie === k.kategorie && x.id !== k.id);
  const andere = TEXTE[t.spracheCode];
  return `<!doctype html>
<html lang="${t.lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(titel)}</title>
  <meta name="description" content="${esc(k.kurz)}">
  <link rel="canonical" href="${url}">
  ${alternativen((tt) => tt.kartePfad(k.id))}
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="${esc(t.marke)}">
  <meta property="og:locale" content="${t.locale.replace("-", "_")}">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${esc(t.zitat(ohneZeichen(k.argument)))}">
  <meta property="og:description" content="${esc(k.kurz)}">
  <meta name="twitter:card" content="summary">
  <meta name="theme-color" content="#2b1a2c">
  <link rel="manifest" href="${manifestDatei(t)}">
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="icon" href="/icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png">
${css.map((f) => `  <link rel="stylesheet" href="/${f}">`).join("\n")}
</head>
<body>
  ${kopf(t).replace("__ANDERE_SEITE__", andere.kartePfad(k.id))}
  <main class="einzel">
    <article class="einzel-karte">
      ${karteHtml(k, { ueberschrift: "h1", fuss: `<a class="knopf haupt" href="${t.uebenPfad}">${esc(t.antwortenUeben)}</a>` })}
    </article>
    ${verwandt.length ? `<nav class="einzel-weiter" aria-labelledby="weiter-titel" style="--h:${ton(k.kategorie)}">
      <h2 id="weiter-titel">${esc(t.mehrZu(katName(k.kategorie)))}</h2>
      <ul>${verwandt.map((x) => `<li><a href="${t.kartePfad(x.id)}">${esc(t.zitat(ohneZeichen(x.argument)))}</a></li>`).join("")}</ul>
      <p><a class="textknopf" href="${t.start}">${esc(t.alleArgumente)}</a></p>
    </nav>` : ""}
  </main>
</body>
</html>
`;
}

// Echte 404-Seite (sonst liefern Cloudflare Pages und vite preview bei Tippfehlern die Startseite)
function fehlerseite(css) {
  const t = TEXTE.de;
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Seite nicht gefunden | ${esc(t.marke)}</title>
  <meta name="robots" content="noindex">
  <link rel="icon" href="/favicon.ico" sizes="48x48">
${css.map((f) => `  <link rel="stylesheet" href="/${f}">`).join("\n")}
</head>
<body>
  ${kopf(t).replace(/<a class="sprachwahl"[^>]*>[^<]*<\/a>/, "")}
  <main class="einzel">
    <div class="ueben-text">
      <h1>Diese Seite gibt es nicht</h1>
      <p>Vielleicht ist der Link veraltet oder hat einen Tippfehler. Alle Argumente findest du auf der Startseite.</p>
      <p lang="en">This page doesn’t exist. You can find all arguments on the start page.</p>
      <div class="knopfreihe"><a class="knopf haupt" href="/">Zu allen Argumenten</a><a class="knopf" href="/en/" lang="en">All arguments in English</a></div>
    </div>
  </main>
</body>
</html>
`;
}

function sitemap() {
  const eintrag = (pfad, datum) => `  <url><loc>${SITE}${pfad}</loc>${datum ? `<lastmod>${datum}</lastmod>` : ""}</url>`;
  const zeilen = SPRACHEN.flatMap((l) => [
    eintrag(TEXTE[l].start),
    ...INHALTE[l].KARTEN.map((k) => eintrag(TEXTE[l].kartePfad(k.id), k.geprueft)),
  ]);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${zeilen.join("\n")}
</urlset>
`;
}

// Startseite in einer Sprache: Texte ersetzen, Canonical und hreflang ergänzen
function startseite(html, t) {
  const kopfzeilen = `<link rel="canonical" href="${SITE}${t.start}">\n  ${alternativen((tt) => tt.start)}\n</head>`;
  return htmlUebersetzen(html, t).replace("</head>", kopfzeilen);
}

// Zweisprachigkeit und statische Einzelseiten:
// - /en/ ist dieselbe index.html mit englischen Texten (Dev-Server und Build)
// - jede Karte bekommt eine Seite unter /karte/<id>/ bzw. /en/card/<id>/
// - dazu sitemap.xml und robots.txt
function seiten() {
  return {
    name: "seiten",
    enforce: "post",
    transformIndexHtml: {
      order: "post",
      handler: (html, ctx) => (ctx.path.startsWith("/en/") ? html : startseite(html, TEXTE.de)),
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Englische App-Adressen; die deutschen (/ueben/, /karte/…/) bedient Vites SPA-Fallback
        if (!/^\/en(\/(index\.html|practise\/?|card\/[\w-]+\/?)?)?(\?.*)?$/.test(req.url || "")) return next();
        const roh = readFileSync(new URL("./index.html", import.meta.url), "utf8");
        const html = await server.transformIndexHtml("/en/index.html", roh);
        res.setHeader("content-type", "text/html; charset=utf-8");
        res.end(startseite(html, TEXTE.en));
      });
    },
    generateBundle(_, bundle) {
      const css = Object.values(bundle).filter((f) => f.fileName.endsWith(".css")).map((f) => f.fileName);
      // Die App-Seiten (Start und Üben) in jeder Sprache: dieselbe index.html mit anderen Texten,
      // eigenem Canonical, hreflang und Manifest
      const deStart = String(bundle["index.html"].source);
      const appSeite = (t, pfad) => htmlUebersetzen(deStart, t)
        .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${SITE}${pfad(t)}">`)
        .replace(/(<link rel="alternate" hreflang[^>]*>\s*)+/, `${alternativen(pfad)}\n  `)
        .replace(/(<link rel="manifest" href=")[^"]*/, `$1${manifestDatei(t)}`);
      for (const l of SPRACHEN) {
        const t = TEXTE[l];
        if (l !== "de") {
          this.emitFile({ type: "asset", fileName: `${t.start.slice(1)}index.html`, source: appSeite(t, (tt) => tt.start) });
          this.emitFile({ type: "asset", fileName: manifestDatei(t).slice(1), source: JSON.stringify(manifest(t)) });
        }
        this.emitFile({ type: "asset", fileName: `${t.uebenPfad.slice(1)}index.html`, source: appSeite(t, (tt) => tt.uebenPfad) });
      }
      for (const l of SPRACHEN) {
        const t = TEXTE[l];
        for (const k of INHALTE[l].KARTEN) {
          this.emitFile({ type: "asset", fileName: `${t.kartePfad(k.id).slice(1)}index.html`, source: einzelseite(k, t, css) });
        }
      }
      this.emitFile({ type: "asset", fileName: "404.html", source: fehlerseite(css) });
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemap() });
      this.emitFile({ type: "asset", fileName: "robots.txt", source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n` });
    },
  };
}

export default defineConfig({
  plugins: [
    seiten(),
    // Installierbar auf dem Homescreen und offline nutzbar
    VitePWA({
      registerType: "autoUpdate",
      manifest: manifest(TEXTE.de),
      workbox: {
        globPatterns: ["**/*.{html,js,css,woff2,png,svg,ico,webmanifest}"],
        navigateFallbackDenylist: [/^\/karte\//, /^\/ueben\//, /^\/en\//],
      },
    }),
  ],
});
