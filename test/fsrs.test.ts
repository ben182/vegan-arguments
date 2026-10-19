import { describe, expect, it } from "vitest";
import * as F from "../shared/fsrs";
import { decodeProgress, encodeProgress } from "../shared/progress-storage";
import { importLegacy, legacyAvailable } from "./legacy";

const START = new Date(2026, 9, 19, 12, 0).getTime();
const days = (c: F.Schedule, now: number) => Math.round((c.due - now) / F.DAY);
const minutes = (c: F.Schedule, now: number) => Math.round((c.due - now) / F.MINUTE);

describe("FSRS scheduling", () => {
  it("new card: learning steps like in Anki", () => {
    expect(minutes(F.schedule(null, F.AGAIN, START), START)).toBe(1);
    expect(minutes(F.schedule(null, F.HARD, START), START)).toBe(6);
    expect(minutes(F.schedule(null, F.GOOD, START), START)).toBe(10);
    const easy = F.schedule(null, F.EASY, START);
    expect(easy.state).toBe("review");
    expect(days(easy, START)).toBe(16); // S0(Easy) ≈ 15.7
  });

  it("Good twice: the card is learned and comes back in a few days", () => {
    const a = F.schedule(null, F.GOOD, START);
    const t2 = START + 10 * F.MINUTE;
    const b = F.schedule(a, F.GOOD, t2);
    expect(b.state).toBe("review");
    expect(days(b, t2)).toBeGreaterThanOrEqual(3);
    expect(days(b, t2)).toBeLessThanOrEqual(5);
  });

  it("review: intervals grow, Hard <= Good < Easy", () => {
    let c = F.schedule(F.schedule(null, F.GOOD, START), F.GOOD, START + 10 * F.MINUTE);
    const now = c.due;
    const [, hard, good, easy] = F.previewIntervals(c, now).map((ms) => Math.round(ms / F.DAY));
    expect(hard).toBeLessThanOrEqual(good!);
    expect(good).toBeLessThan(easy!);
    const before = days(c, START);
    c = F.schedule(c, F.GOOD, now);
    expect(days(c, now)).toBeGreaterThan(before);
  });

  it("forgetting: the card goes into relearning and gets harder", () => {
    const c = F.schedule(F.schedule(null, F.GOOD, START), F.GOOD, START + 10 * F.MINUTE);
    const now = c.due;
    const forgotten = F.schedule(c, F.AGAIN, now);
    expect(forgotten.state).toBe("relearning");
    expect(minutes(forgotten, now)).toBe(10);
    expect(forgotten.lapses).toBe(1);
    expect(forgotten.stability).toBeLessThan(c.stability);
    expect(forgotten.difficulty).toBeGreaterThan(c.difficulty);
    const again = F.schedule(forgotten, F.GOOD, now + 10 * F.MINUTE);
    expect(again.state).toBe("review");
    expect(days(again, now)).toBeGreaterThanOrEqual(1);
  });

  it("day rollover at 4 a.m.", () => {
    const threeAm = new Date(2026, 9, 20, 3, 0).getTime();
    const fiveAm = new Date(2026, 9, 20, 5, 0).getTime();
    expect(F.dayNumber(threeAm)).toBe(F.dayNumber(START));
    expect(F.dayNumber(fiveAm)).toBe(F.dayNumber(START) + 1);
  });

  it("interval labels", () => {
    expect(F.formatInterval(20 * 1000)).toBe("< 1 Min.");
    expect(F.formatInterval(10 * F.MINUTE)).toBe("10 Min.");
    expect(F.formatInterval(F.DAY)).toBe("1 Tag");
    expect(F.formatInterval(16 * F.DAY)).toBe("16 Tage");
    expect(F.formatInterval(61 * F.DAY)).toBe("2 Mon.");
  });

  it("interval labels in English", () => {
    expect(F.formatInterval(10 * F.MINUTE, "en")).toBe("10 min");
    expect(F.formatInterval(F.DAY, "en")).toBe("1 day");
    expect(F.formatInterval(16 * F.DAY, "en")).toBe("16 days");
    expect(F.formatInterval(76 * F.DAY, "en")).toBe("2.5 mo");
  });
});

// Behaves exactly like the legacy fsrs.js: same random rating sequences give the same stored state.
describe.skipIf(!legacyAvailable())("FSRS port matches the legacy implementation", () => {
  it("produces identical schedules, previews and labels", async () => {
    const L = await importLegacy<Record<string, any>>("fsrs.js"); // eslint-disable-line @typescript-eslint/no-explicit-any
    let seed = 42;
    const random = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    for (let run = 0; run < 200; run++) {
      let legacy: unknown = null;
      let current: F.Schedule | null = null;
      let now = START + Math.floor(random() * 30 * F.DAY);
      for (let i = 0; i < 25; i++) {
        const g = (1 + Math.floor(random() * 4)) as F.Rating;
        expect(F.previewIntervals(current, now)).toEqual(L.vorschau(legacy, now));
        legacy = L.planen(legacy, g, now);
        current = F.schedule(current, g, now);
        // Compare through the storage codec: the stored JSON must be byte-identical
        const stored = JSON.parse(encodeProgress({ cards: { x: current }, newToday: { day: 0, count: 0, extra: 0 } })).karten.x;
        expect(stored).toStrictEqual(legacy);
        now += Math.floor(random() * (random() < 0.5 ? 30 * F.MINUTE : 40 * F.DAY));
      }
    }
    for (const ms of [0, 20e3, 59e3, 10 * F.MINUTE, 3 * 3600e3, F.DAY, 16 * F.DAY, 45 * F.DAY, 76 * F.DAY, 400 * F.DAY, 4000 * F.DAY]) {
      expect(F.formatInterval(ms)).toBe(L.abstandText(ms));
      expect(F.formatInterval(ms, "en")).toBe(L.abstandText(ms, "en"));
    }
    for (let ms = START - 2 * F.DAY; ms < START + 3 * F.DAY; ms += 17 * F.MINUTE) expect(F.dayNumber(ms)).toBe(L.tag(ms));
  });
});

describe("progress storage keeps the legacy format", () => {
  it("round-trips the stored JSON unchanged", () => {
    const legacyJson = JSON.stringify({
      karten: {
        protein: { status: "wiederholen", schritt: 0, s: 3.17, d: 5.3, faellig: START + 3 * F.DAY, zuletzt: START, wdh: 2, vergessen: 0 },
        b12: { status: "lernen", schritt: 1, s: 1.18, d: 6.4, faellig: START + 10 * F.MINUTE, zuletzt: START, wdh: 1, vergessen: 0 },
        soja: { status: "neulernen", schritt: 0, s: 0.9, d: 7.1, faellig: START, zuletzt: START, wdh: 5, vergessen: 1 },
      },
      neuHeute: { tag: F.dayNumber(START), anzahl: 3, extra: 10 },
    });
    const progress = decodeProgress(legacyJson);
    expect(progress.cards.protein!.state).toBe("review");
    expect(progress.cards.b12!.step).toBe(1);
    expect(progress.cards.soja!.lapses).toBe(1);
    expect(progress.newToday).toEqual({ day: F.dayNumber(START), count: 3, extra: 10 });
    expect(encodeProgress(progress)).toBe(legacyJson);
  });

  it("starts empty without stored data", () => {
    expect(decodeProgress(null)).toEqual({ cards: {}, newToday: { day: 0, count: 0, extra: 0 } });
  });
});
