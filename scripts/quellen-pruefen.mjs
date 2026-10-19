// Prüft alle Quellen-Links in karten.js. Aufruf: node scripts/quellen-pruefen.mjs
// Exit-Code 1, wenn ein Link sicher kaputt ist (404, 410, DNS-Fehler).
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const datei = new URL("../karten.js", import.meta.url);
const ctx = {};
runInNewContext(readFileSync(datei, "utf8") + ";this.KARTEN = KARTEN;", ctx);

const links = new Map(); // url -> [karten-ids]
for (const k of ctx.KARTEN) for (const q of k.quellen || []) links.set(q.url, [...(links.get(q.url) || []), k.id]);

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";
// Diese Codes heißen meist „Bot blockiert“, nicht „Seite weg“
const BLOCKIERT = new Set([401, 403, 429, 503]);

async function pruefen(url) {
  for (let versuch = 1; versuch <= 2; versuch++) {
    try {
      const res = await fetch(url, {
        redirect: "follow",
        headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8" },
        signal: AbortSignal.timeout(25000),
      });
      res.body?.cancel();
      if (res.ok) return { stufe: "ok", code: res.status };
      if (BLOCKIERT.has(res.status)) return { stufe: "blockiert", code: res.status };
      if (versuch === 2 || res.status < 500) return { stufe: "kaputt", code: res.status };
    } catch (e) {
      if (versuch === 2) return { stufe: "kaputt", code: e.cause?.code || e.name };
    }
  }
}

const eintraege = [...links.entries()];
const ergebnisse = [];
let i = 0;
await Promise.all(Array.from({ length: 6 }, async () => {
  while (i < eintraege.length) {
    const [url, ids] = eintraege[i++];
    ergebnisse.push({ url, ids, ...(await pruefen(url)) });
  }
}));

const nach = (s) => ergebnisse.filter((e) => e.stufe === s);
for (const e of nach("kaputt")) console.log(`✗ ${e.code}  ${e.url}\n    in: ${e.ids.join(", ")}`);
for (const e of nach("blockiert")) console.log(`? ${e.code}  ${e.url}  (vermutlich Bot-Sperre, im Browser prüfen)\n    in: ${e.ids.join(", ")}`);
console.log(`\n${links.size} Links: ${nach("ok").length} ok, ${nach("blockiert").length} blockiert, ${nach("kaputt").length} kaputt`);
process.exit(nach("kaputt").length ? 1 : 0);
