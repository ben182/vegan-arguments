// Checks every source link in shared/data/cards.de.ts and cards.en.ts. Usage: node scripts/check-sources.mjs
// (Node 22.18+ runs the TypeScript data modules directly.)
// Exits with code 1 if a link is definitely broken (404, 410, DNS error, ...).
import { cards as DE } from "../shared/data/cards.de.ts";
import { cards as EN } from "../shared/data/cards.en.ts";

const links = new Map(); // url -> [card ids]
for (const [lang, cards] of [["de", DE], ["en", EN]]) {
  for (const card of cards) for (const s of card.sources || []) links.set(s.url, [...new Set([...(links.get(s.url) || []), lang === "de" ? card.id : `${card.id} (en)`])]);
}

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";
// These status codes usually mean "bot blocked", not "page gone"
const BLOCKED = new Set([401, 403, 429, 503]);

async function check(url) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, {
        redirect: "follow",
        headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8" },
        signal: AbortSignal.timeout(25000),
      });
      res.body?.cancel();
      if (res.ok) return { result: "ok", code: res.status };
      if (BLOCKED.has(res.status)) return { result: "blocked", code: res.status };
      if (attempt === 2 || res.status < 500) return { result: "broken", code: res.status };
    } catch (e) {
      if (attempt === 2) return { result: "broken", code: e.cause?.code || e.name };
    }
  }
}

const entries = [...links.entries()];
const results = [];
let i = 0;
await Promise.all(Array.from({ length: 6 }, async () => {
  while (i < entries.length) {
    const [url, ids] = entries[i++];
    results.push({ url, ids, ...(await check(url)) });
  }
}));

const by = (r) => results.filter((e) => e.result === r);
for (const e of by("broken")) console.log(`✗ ${e.code}  ${e.url}\n    used in: ${e.ids.join(", ")}`);
for (const e of by("blocked")) console.log(`? ${e.code}  ${e.url}  (probably blocks bots, check in a browser)\n    used in: ${e.ids.join(", ")}`);
console.log(`\n${links.size} links: ${by("ok").length} ok, ${by("blocked").length} blocked, ${by("broken").length} broken`);
process.exit(by("broken").length ? 1 : 0);
