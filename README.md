# vegan-arguments

Flashcards with short, evidence-based answers to the most common arguments against veganism. The site is in German, with an English version at `/en/`.

- **Look up** every argument, with a one-line answer for the conversation, follow-up points, a counter-question, the fallacy behind it, what to honestly concede, and sources.
- **Practise** like in Anki: cards are scheduled with [FSRS](https://github.com/open-spaced-repetition/fsrs4anki), the algorithm Anki uses by default, including learning steps and a daily limit. Progress is stored in the browser only.

Every number has a source. Accuracy comes first: if you find an error or an outdated source, please [report it](../../issues/new?template=error.yml).

## Run locally

Built with [Vite](https://vite.dev), no framework:

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/
npm run preview    # serve dist/ locally
```

The build also generates the English start page at `/en/`, a static page per card at `/karte/<id>/` and `/en/card/<id>/` (for search engines and sharing), `sitemap.xml`, `robots.txt`, and a service worker so the site can be installed and used offline. Set `SITE_URL` to the production address for canonical links and the sitemap, e.g. `SITE_URL=https://example.org npm run build`.

## Files

| File | Purpose |
| --- | --- |
| `karten.js` | All cards and categories (German content) |
| `karten.en.js` | English translation, same IDs and sources |
| `texte.js` | UI texts in German and English |
| `fsrs.js` | Spaced-repetition scheduling (FSRS-5, Anki defaults) |
| `app.js` | UI: browsing, card detail, practice queue |
| `karte-html.js` | Renders a card as HTML (shared by the app and the static card pages) |
| `vite.config.js` | Static card pages, sitemap, PWA manifest and service worker |
| `scripts/check-sources.mjs` | Checks every source link; runs monthly via GitHub Actions |

## Tests

```sh
npm test
npm run check-sources
```

## Contributing

- [Report an error on a card](../../issues/new?template=error.yml)
- [Suggest a new argument](../../issues/new?template=argument.yml)
