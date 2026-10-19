import test from "node:test";
import assert from "node:assert";
import * as F from "./fsrs.js";

const START = new Date(2026, 9, 19, 12, 0).getTime();
const tage = (k, jetzt) => Math.round((k.faellig - jetzt) / F.TAG);
const minuten = (k, jetzt) => Math.round((k.faellig - jetzt) / F.MIN);

test("neue Karte: Lernschritte wie in Anki", () => {
  assert.strictEqual(minuten(F.planen(null, F.NOCHMAL, START), START), 1);
  assert.strictEqual(minuten(F.planen(null, F.SCHWER, START), START), 6);
  assert.strictEqual(minuten(F.planen(null, F.GUT, START), START), 10);
  const einfach = F.planen(null, F.EINFACH, START);
  assert.strictEqual(einfach.status, "wiederholen");
  assert.strictEqual(tage(einfach, START), 16); // S0(Einfach) ≈ 15,7
});

test("zweimal Gut: Karte ist gelernt und kommt in einigen Tagen wieder", () => {
  const a = F.planen(null, F.GUT, START);
  const t2 = START + 10 * F.MIN;
  const b = F.planen(a, F.GUT, t2);
  assert.strictEqual(b.status, "wiederholen");
  assert.ok(tage(b, t2) >= 3 && tage(b, t2) <= 5, `Intervall ${tage(b, t2)}`);
});

test("Wiederholung: Intervalle wachsen, Schwer ≤ Gut < Einfach", () => {
  let k = F.planen(F.planen(null, F.GUT, START), F.GUT, START + 10 * F.MIN);
  let jetzt = k.faellig;
  const [, schwer, gut, einfach] = F.vorschau(k, jetzt).map((ms) => Math.round(ms / F.TAG));
  assert.ok(schwer <= gut && gut < einfach, `${schwer} ${gut} ${einfach}`);
  const vorher = tage(k, START);
  k = F.planen(k, F.GUT, jetzt);
  assert.ok(tage(k, jetzt) > vorher);
});

test("Vergessen: Karte geht in Neulernen und wird schwieriger", () => {
  let k = F.planen(F.planen(null, F.GUT, START), F.GUT, START + 10 * F.MIN);
  const jetzt = k.faellig;
  const vergessen = F.planen(k, F.NOCHMAL, jetzt);
  assert.strictEqual(vergessen.status, "neulernen");
  assert.strictEqual(minuten(vergessen, jetzt), 10);
  assert.strictEqual(vergessen.vergessen, 1);
  assert.ok(vergessen.s < k.s && vergessen.d > k.d);
  const wieder = F.planen(vergessen, F.GUT, jetzt + 10 * F.MIN);
  assert.strictEqual(wieder.status, "wiederholen");
  assert.ok(tage(wieder, jetzt) >= 1);
});

test("Tageswechsel um 4 Uhr", () => {
  const dreiUhr = new Date(2026, 9, 20, 3, 0).getTime();
  const fuenfUhr = new Date(2026, 9, 20, 5, 0).getTime();
  assert.strictEqual(F.tag(dreiUhr), F.tag(START));
  assert.strictEqual(F.tag(fuenfUhr), F.tag(START) + 1);
});

test("Abstandstexte", () => {
  assert.strictEqual(F.abstandText(20 * 1000), "< 1 Min.");
  assert.strictEqual(F.abstandText(10 * F.MIN), "10 Min.");
  assert.strictEqual(F.abstandText(F.TAG), "1 Tag");
  assert.strictEqual(F.abstandText(16 * F.TAG), "16 Tage");
  assert.strictEqual(F.abstandText(61 * F.TAG), "2 Mon.");
});
