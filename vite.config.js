import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { KARTEN } from "./karten.js";
import { karteHtml, esc, ohneZeichen, katName, ton } from "./karte-html.js";

// Produktionsadresse für Canonical-Links und Sitemap, z. B. SITE_URL=https://example.org npm run build
const SITE = (process.env.SITE_URL || "https://vegan-arguments.pages.dev").replace(/\/$/, "");
const TITEL = "Gut vorbereitet";

function kopf() {
  return `<header class="kopf">
    <div class="kopf-innen">
      <a class="marke" href="/"><span class="marke-zeichen" aria-hidden="true">„</span>${TITEL}</a>
      <nav class="umschalter" aria-label="Bereich">
        <a href="/">Nachschlagen</a>
        <a href="/#ueben">Üben</a>
      </nav>
    </div>
  </header>`;
}

function seite(k, css) {
  const url = `${SITE}/karte/${k.id}/`;
  const titel = `„${ohneZeichen(k.argument).replace(/[.!]$/, "")}“ – was du antworten kannst | ${TITEL}`;
  const verwandt = KARTEN.filter((x) => x.kategorie === k.kategorie && x.id !== k.id);
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(titel)}</title>
  <meta name="description" content="${esc(k.kurz)}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="${TITEL}">
  <meta property="og:locale" content="de_DE">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${esc(`„${ohneZeichen(k.argument)}“`)}">
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
  ${kopf()}
  <main class="einzel">
    <article class="einzel-karte">
      ${karteHtml(k, { ueberschrift: "h1", fuss: `<a class="knopf haupt" href="/#ueben">Antworten üben</a>` })}
    </article>
    ${verwandt.length ? `<nav class="einzel-weiter" aria-labelledby="weiter-titel" style="--h:${ton(k.kategorie)}">
      <h2 id="weiter-titel">Mehr zu ${esc(katName(k.kategorie))}</h2>
      <ul>${verwandt.map((x) => `<li><a href="/karte/${x.id}/">„${esc(ohneZeichen(x.argument))}“</a></li>`).join("")}</ul>
      <p><a class="textknopf" href="/">Alle Argumente ansehen</a></p>
    </nav>` : ""}
  </main>
</body>
</html>
`;
}

function sitemap() {
  const urls = ["/", ...KARTEN.map((k) => `/karte/${k.id}/`)];
  const datum = (pfad) => KARTEN.find((k) => pfad === `/karte/${k.id}/`)?.geprueft;
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u}</loc>${datum(u) ? `<lastmod>${datum(u)}</lastmod>` : ""}</url>`).join("\n")}
</urlset>
`;
}

// Erzeugt beim Build für jede Karte eine statische Seite unter /karte/<id>/,
// dazu sitemap.xml und robots.txt – damit Suchmaschinen jede Antwort einzeln finden.
function einzelseiten() {
  return {
    name: "einzelseiten",
    apply: "build",
    enforce: "post",
    generateBundle(_, bundle) {
      const css = Object.values(bundle).filter((f) => f.fileName.endsWith(".css")).map((f) => f.fileName);
      for (const k of KARTEN) this.emitFile({ type: "asset", fileName: `karte/${k.id}/index.html`, source: seite(k, css) });
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemap() });
      this.emitFile({ type: "asset", fileName: "robots.txt", source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n` });
    },
  };
}

export default defineConfig({
  plugins: [
    einzelseiten(),
    // Installierbar auf dem Homescreen und offline nutzbar
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: `${TITEL} – Antworten auf Argumente gegen Veganismus`,
        short_name: TITEL,
        description: "Kurze, belegte Antworten auf die häufigsten Argumente gegen Veganismus – zum Nachschlagen und Üben.",
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
        navigateFallbackDenylist: [/^\/karte\//],
      },
    }),
  ],
});
