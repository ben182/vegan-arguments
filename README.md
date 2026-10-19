# vegan-arguments

Flashcards with short, evidence-based answers to the most common arguments against veganism. The site is in German, with an English version at `/en/`.

- **Look up** every argument, with a one-line answer for the conversation, follow-up points, a counter-question, the fallacy behind it, what to honestly concede, and sources.
- **Practise** like in Anki: cards are scheduled with [FSRS](https://github.com/open-spaced-repetition/fsrs4anki), the algorithm Anki uses by default, including learning steps and a daily limit. Progress is stored in the browser only.

Every number has a source. Accuracy comes first: if you find an error or an outdated source, please [report it](../../issues/new?template=error.yml).

## Run locally

Built with [Nuxt](https://nuxt.com) 4 and generated as a fully static site (Node.js 22.22+ or 24.15+):

```sh
npm install
npm run dev        # http://localhost:3000
npm run generate   # static site in .output/public/
npm run preview    # serve the generated site locally
```

`npm run generate` prerenders every page in both languages: the start and practice pages (`/`, `/ueben/`, `/en/`, `/en/practise/`), a page per card at `/karte/<id>/` and `/en/card/<id>/` (for search engines and sharing), a real `404.html`, `sitemap.xml`, `robots.txt`, both web app manifests and a service worker so the site can be installed and used offline. Deploy `.output/public/` to any static host, e.g. Cloudflare Pages.

Set `SITE_URL` to the production address for canonical links, hreflang alternates and the sitemap, e.g. `SITE_URL=https://example.org npm run generate` (default: `https://vegan-arguments.pages.dev`).

## Structure

| Path | Purpose |
| --- | --- |
| `shared/data/cards.de.ts` | All cards and categories (German content) |
| `shared/data/cards.en.ts` | English translation, same IDs |
| `shared/types/cards.ts` | Types of the card data |
| `shared/texts.ts` | UI texts and localized paths in German and English |
| `shared/fsrs.ts` | Spaced-repetition scheduling (FSRS-5, Anki defaults) |
| `shared/progress-storage.ts` | Stored progress format (`localStorage` key `vk-anki-v1`) |
| `app/pages/` | Look up (`index.vue`), practise (`practise.vue`), card page (`card/[id].vue`) |
| `app/components/` | Header, footer, card body, card panel, category tabs, counters |
| `app/composables/` | State: cards (`useDeck`), progress (`useProgress`), queue (`useReviewQueue`), practice session, SEO |
| `app/plugins/card-panel.ts` | Opens cards from the list in a side panel while the URL changes to the card |
| `server/routes/` | `robots.txt` and the English web app manifest |
| `nuxt.config.ts` | Modules: i18n routes, sitemap, PWA; prerendered routes |
| `scripts/check-sources.mjs` | Checks every source link; runs monthly via GitHub Actions |

Modules: [`@nuxtjs/i18n`](https://i18n.nuxtjs.org) for the localized routes, [`@nuxtjs/sitemap`](https://nuxtseo.com/docs/sitemap) for the bilingual sitemap, [`@vite-pwa/nuxt`](https://vite-pwa-org.netlify.app/frameworks/nuxt) for the service worker and [`@nuxt/eslint`](https://eslint.nuxt.com). Fonts are self-hosted via Fontsource.

## Tests

```sh
npm test               # Vitest: scheduling, storage format, content
npm run lint
npm run typecheck
npm run check-sources  # checks every source link (needs network)
```

The tests also compare the card data, the UI texts and the scheduling with the last pre-Nuxt version in git history, to prove the migration changed nothing.

## Contributing

- [Report an error on a card](../../issues/new?template=error.yml)
- [Suggest a new argument](../../issues/new?template=argument.yml)
