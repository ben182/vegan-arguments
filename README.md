# vegan-arguments

Flashcards with short, evidence-based answers to the most common arguments against veganism. The site is in German (an English version is planned).

- **Look up** every argument, with a one-line answer for the conversation, follow-up points, a counter-question, the fallacy behind it, what to honestly concede, and sources.
- **Practise** like in Anki: cards are scheduled with [FSRS](https://github.com/open-spaced-repetition/fsrs4anki), the algorithm Anki uses by default, including learning steps and a daily limit. Progress is stored in the browser only.

Every number has a source. Accuracy comes first: if you find an error or an outdated source, please [report it](../../issues/new?template=error.yml).

## Run locally

Plain HTML, CSS and JavaScript, no build step:

```sh
python3 -m http.server 8765
```

Then open http://localhost:8765.

## Files

| File | Purpose |
| --- | --- |
| `karten.js` | All cards and categories (content) |
| `fsrs.js` | Spaced-repetition scheduling (FSRS-5, Anki defaults) |
| `app.js` | UI: browsing, card detail, practice queue |
| `scripts/check-sources.mjs` | Checks every source link; runs monthly via GitHub Actions |

## Tests

```sh
node --test fsrs.test.js
node scripts/check-sources.mjs
```

## Contributing

- [Report an error on a card](../../issues/new?template=error.yml)
- [Suggest a new argument](../../issues/new?template=argument.yml)
