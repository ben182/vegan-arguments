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
        <a href="${t.start}#ueben">${esc(t.navUeben)}</a>
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
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="icon" href="/icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png">
${css.map((f) => `  <link rel="stylesheet" href="/${f}">`).join("\n")}
</head>
<body>
  ${kopf(t).replace("__ANDERE_SEITE__", andere.kartePfad(k.id))}
  <main class="einzel">
    <article class="einzel-karte">
      ${karteHtml(k, { ueberschrift: "h1", fuss: `<a class="knopf haupt" href="${t.start}#ueben">${esc(t.antwortenUeben)}</a>` })}
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
        if (!/^\/en(\/|\/index\.html)?(\?.*)?$/.test(req.url || "")) return next();
        const roh = readFileSync(new URL("./index.html", import.meta.url), "utf8");
        const html = await server.transformIndexHtml("/en/index.html", roh);
        res.setHeader("content-type", "text/html; charset=utf-8");
        res.end(startseite(html, TEXTE.en));
      });
    },
    generateBundle(_, bundle) {
      const css = Object.values(bundle).filter((f) => f.fileName.endsWith(".css")).map((f) => f.fileName);
      if (INHALTE.en) {
        const deStart = String(bundle["index.html"].source);
        // Die deutsche Startseite ist schon übersetzt; für Englisch die Marken neu anwenden
        this.emitFile({ type: "asset", fileName: "en/index.html", source: htmlUebersetzen(deStart, TEXTE.en)
          .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${SITE}/en/">`) });
      }
      for (const l of SPRACHEN) {
        const t = TEXTE[l];
        for (const k of INHALTE[l].KARTEN) {
          this.emitFile({ type: "asset", fileName: `${t.kartePfad(k.id).slice(1)}index.html`, source: einzelseite(k, t, css) });
        }
      }
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
      manifest: {
        name: TEXTE.de.titel,
        short_name: TEXTE.de.marke,
        description: TEXTE.de.beschreibung,
        lang: "de",
        start_url: "/",
        display: "standalone",
        theme_color: "#2b1a2c",
        background_color: "#f5f3f4",
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{html,js,css,woff2,png,svg,ico}"],
        navigateFallbackDenylist: [/^\/karte\//, /^\/en\//],
      },
    }),
  ],
});
