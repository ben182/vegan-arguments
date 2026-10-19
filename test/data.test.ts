// Proves that the migrated card data deep-equals the legacy karten.js / karten.en.js exports.
import { describe, expect, it } from "vitest";
import * as de from "../shared/data/cards.de";
import * as en from "../shared/data/cards.en";
import type { Card } from "../shared/types/cards";
import { importLegacy, legacyAvailable } from "./legacy";

interface LegacyModule {
  KARTEN: Record<string, unknown>[];
  KATEGORIEN: Record<string, string>;
}

/** Maps a migrated card back to the legacy shape (German keys), omitting absent fields. */
function toLegacy(c: Card): Record<string, unknown> {
  const out: Record<string, unknown> = {
    id: c.id,
    kategorie: c.category,
    geprueft: c.checked,
    argument: c.argument,
    kurz: c.answer,
  };
  if (c.figure) out.zahl = { wert: c.figure.value, text: c.figure.text };
  if (c.points) out.punkte = [...c.points];
  if (c.counterQuestion !== undefined) out.konter = c.counterQuestion;
  if (c.fallacy) out.fehlschluss = { name: c.fallacy.name, erklaerung: c.fallacy.explanation };
  if (c.concession !== undefined) out.ehrlich = c.concession;
  if (c.sources) out.quellen = c.sources.map((s) => ({ titel: s.title, url: s.url, jahr: s.year }));
  return out;
}

describe.skipIf(!legacyAvailable())("migrated card data equals the legacy data", () => {
  for (const [lang, file, mod] of [["de", "karten.js", de], ["en", "karten.en.js", en]] as const) {
    it(`${lang}: cards and categories`, async () => {
      const legacy = await importLegacy<LegacyModule>(file);
      expect(legacy.KARTEN).toHaveLength(54);
      expect(mod.cards.map(toLegacy)).toStrictEqual(legacy.KARTEN);
      expect(mod.categories).toStrictEqual(legacy.KATEGORIEN);
      // Same order of categories (it drives the order of groups and filter tabs)
      expect(Object.keys(mod.categories)).toEqual(Object.keys(legacy.KATEGORIEN));
    });
  }
});

describe("card data is consistent across languages", () => {
  it("has the same ids, categories and dates in both languages", () => {
    const shape = (cards: Card[]) => cards.map((c) => [c.id, c.category, c.checked]);
    expect(shape(en.cards)).toEqual(shape(de.cards));
  });
});
