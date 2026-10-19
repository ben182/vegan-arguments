// Checks that the card data is consistent across languages and that every source is well-formed.
import { describe, expect, it } from "vitest";
import * as de from "../shared/data/cards.de";
import * as en from "../shared/data/cards.en";
import type { Card, SourceKind } from "../shared/types/cards";

const KINDS: readonly SourceKind[] = ["review", "study", "official", "other"];
const decks = [["de", de.cards], ["en", en.cards]] as const;

describe("card data is consistent across languages", () => {
  it("has 54 cards", () => {
    expect(de.cards).toHaveLength(54);
    expect(en.cards).toHaveLength(54);
  });

  it("has the same ids, categories and dates in both languages", () => {
    const shape = (cards: Card[]) => cards.map((c) => [c.id, c.category, c.checked]);
    expect(shape(en.cards)).toEqual(shape(de.cards));
  });

  it("has the same categories in the same order in both languages", () => {
    expect(Object.keys(en.categories)).toEqual(Object.keys(de.categories));
  });

  it("has the same sources (url, year, kind, order) in both languages", () => {
    // The only exception: Bible verses are quoted from a translation in the card's language
    // (Lutherbibel 2017 / NIV), so these links point to the same verse in different editions.
    const localized: Record<string, string> = {
      "https://www.die-bibel.de/bibel/LU17/GEN.1": "bible:genesis-1",
      "https://www.biblegateway.com/passage/?search=Genesis%201%3A29&version=NIV": "bible:genesis-1",
      "https://www.die-bibel.de/bibel/LU17/GEN.9": "bible:genesis-9",
      "https://www.biblegateway.com/passage/?search=Genesis%209%3A3&version=NIV": "bible:genesis-9",
    };
    const shape = (cards: Card[]) =>
      cards.map((c) => [
        c.id,
        (c.sources ?? []).map((s) => (localized[s.url] ? [localized[s.url], s.kind] : [s.url, s.year, s.kind])),
      ]);
    expect(shape(en.cards)).toEqual(shape(de.cards));
  });
});

describe.each(decks)("sources (%s)", (_lang, cards) => {
  it("every source has a valid kind, a title and an https url", () => {
    for (const c of cards) {
      for (const s of c.sources ?? []) {
        expect(KINDS, `${c.id}: ${s.url}`).toContain(s.kind);
        expect(s.title.trim(), `${c.id}: ${s.url}`).not.toBe("");
        expect(s.url, c.id).toMatch(/^https:\/\//);
        expect(Number.isInteger(s.year), `${c.id}: ${s.url}`).toBe(true);
        expect(s.year, `${c.id}: ${s.url}`).toBeGreaterThan(1900);
        expect(s.year, `${c.id}: ${s.url}`).toBeLessThanOrEqual(Number(c.checked.slice(0, 4)));
      }
    }
  });

  it("no card lists the same url twice", () => {
    for (const c of cards) {
      const urls = (c.sources ?? []).map((s) => s.url);
      expect(new Set(urls).size, c.id).toBe(urls.length);
    }
  });

  it("every card with a key figure has at least one source", () => {
    for (const c of cards.filter((c) => c.figure)) {
      expect(c.sources?.length ?? 0, c.id).toBeGreaterThan(0);
    }
  });
});
