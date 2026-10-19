import { cards as cardsDe } from "./shared/data/cards.de";
import { cards as cardsEn } from "./shared/data/cards.en";
import { resolveSiteUrl, THEME_COLOR, webManifest } from "./shared/site";
import { TEXTS, type Locale } from "./shared/texts";

// Production address for canonical links and the sitemap, e.g. SITE_URL=https://example.org npm run generate
const siteUrl = resolveSiteUrl(process.env.SITE_URL);

const LOCALES: Locale[] = ["de", "en"];
const CARDS = { de: cardsDe, en: cardsEn };

// Every page of the site, in both languages, with trailing slash
const pages = LOCALES.flatMap((l) => {
  const t = TEXTS[l];
  return [t.homePath, t.practicePath, ...CARDS[l].map((c) => t.cardPath(c.id))];
});

// One bilingual sitemap: start pages and card pages, with hreflang alternates and lastmod
const alternates = (path: (t: (typeof TEXTS)[Locale]) => string) => [
  ...LOCALES.map((l) => ({ hreflang: l, href: path(TEXTS[l]) })),
  { hreflang: "x-default", href: path(TEXTS.de) },
];
const sitemapUrls = LOCALES.flatMap((l) => [
  { loc: TEXTS[l].homePath, alternatives: alternates((t) => t.homePath) },
  ...CARDS[l].map((c) => ({ loc: TEXTS[l].cardPath(c.id), lastmod: c.checked, alternatives: alternates((t) => t.cardPath(c.id)) })),
]);

export default defineNuxtConfig({
  modules: ["@nuxtjs/i18n", "@nuxtjs/sitemap", "@vite-pwa/nuxt", "@nuxt/eslint"],

  devtools: { enabled: true },

  app: {
    head: {
      meta: [{ name: "theme-color", content: THEME_COLOR }],
      link: [
        { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
        { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon-180x180.png" },
      ],
    },
  },

  // Self-hosted fonts. Bricolage Grotesque "standard" includes the wdth axis used via font-stretch.
  css: [
    "@fontsource-variable/bricolage-grotesque/standard.css",
    "@fontsource-variable/atkinson-hyperlegible-next/wght.css",
    "@fontsource-variable/atkinson-hyperlegible-next/wght-italic.css",
    "~/assets/css/main.css",
  ],

  site: { url: siteUrl, trailingSlash: true },

  runtimeConfig: {
    public: { siteUrl },
  },

  experimental: {
    // No useAsyncData in this app: keep page state inline instead of extra _payload.json files
    payloadExtraction: false,
    // Server-render 404.html at build time instead of an empty SPA shell
    prerenderErrorPages: [404],
    defaults: { nuxtLink: { trailingSlash: "append" } },
  },

  compatibilityDate: "2026-10-19",

  nitro: {
    prerender: {
      routes: [...pages, "/robots.txt", "/manifest.en.webmanifest"],
      crawlLinks: true,
      failOnError: true,
    },
  },

  eslint: {
    config: { stylistic: false },
  },

  // Localized routes only: /ueben/ <-> /en/practise/, /karte/:id/ <-> /en/card/:id/ (paths in definePageMeta).
  // The UI copy lives in shared/texts.ts (typed, with plural/number logic), not in vue-i18n messages.
  i18n: {
    locales: [
      { code: "de", language: "de-DE" },
      { code: "en", language: "en-GB" },
    ],
    defaultLocale: "de",
    strategy: "prefix_except_default",
    customRoutes: "meta",
    detectBrowserLanguage: false,
    baseUrl: siteUrl,
    // No vue-i18n messages are used: leave out the message compiler and global components
    bundle: { runtimeOnly: true, dropMessageCompiler: true, fullInstall: false },
  },

  // Installable and usable offline. The English manifest comes from server/routes/manifest.en.webmanifest.ts.
  pwa: {
    registerType: "autoUpdate",
    manifest: webManifest(TEXTS.de),
    workbox: {
      globPatterns: ["**/*.{html,js,css,woff2,png,svg,ico,webmanifest}"],
      // 200.html is an SPA shell nobody navigates to; the German manifest is added by the module itself
      globIgnores: ["200.html", "manifest.webmanifest"],
      // Every page is precached as <path>/index.html, which Workbox serves for <path>/.
      // An empty list replaces the module's default transform that strips the trailing slash.
      manifestTransforms: [],
      navigateFallback: "/index.html",
      navigateFallbackAllowlist: [/^\/$/],
    },
    client: { installPrompt: false },
  },

  sitemap: {
    autoI18n: false,
    excludeAppSources: true,
    xsl: false,
    urls: sitemapUrls,
  },
});
