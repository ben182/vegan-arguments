// Proves that the UI copy carried over unchanged: every legacy text in texte.js that is still used
// has an English-keyed counterpart in shared/texts.ts with the same value (functions: same output).
// Texts dropped by the "Die Belege" redesign are listed in REMOVED.
import { describe, expect, it } from "vitest";
import { TEXTS } from "../shared/texts";
import { importLegacy, legacyAvailable } from "./legacy";

const KEYS: Record<string, string> = {
  lang: "lang", locale: "locale", start: "homePath", kartePfad: "cardPath", uebenPfad: "practicePath", zitat: "quote",
  titel: "title", beschreibung: "description", marke: "brand", navLabel: "navLabel", navNachschlagen: "navLookUp", navUeben: "navPractise",
  sprache: "otherLanguage", spracheKurz: "otherLanguageShort", spracheLink: "otherLanguageHome", spracheCode: "otherLocale",
  introTitel: "introTitle", introText: "introText", suche: "searchPlaceholder", sucheLabel: "searchLabel", filterLabel: "filterLabel",
  leer: "emptyText", leerLink: "emptyLink", alle: "all", argumente: "argumentCount", spalteSie: "columnTheySay", spalteDu: "columnYouAnswer",
  quellenAnzahl: "sourceCount", bestand: "inventory",
  uebenTitel: "practiseTitle", uebenText: "practiseText", uebenThemen: "practiseTopics", uebenFilterLabel: "practiseFilterLabel",
  uebenStarten: "startPractising", nichtsZuUeben: "nothingToPractise", erklaerungTitel: "explainTitle", erklaerungText: "explainText",
  zuruecksetzen: "resetProgress", zuruecksetzenFrage: "resetConfirm", sagt: "someoneSays", duAntwortest: "youAnswer", ganzeKarte: "readFullCard",
  aufdecken: "showAnswer", leertaste: "spaceKey", bewertenFrage: "rateQuestion", nochmal: "again", schwer: "hard", gut: "good", einfach: "easy",
  zNeu: "countNew", zLernen: "countLearning", zFaellig: "countReview", endeTitel: "doneTitle", mehrNeue: "moreNewCards", zumNachschlagen: "backToLookUp",
  endeLernen: "doneLearning", endeNaechste: "doneNextReview", endeUngesehen: "doneUnseen", statusLernen: "statusLearning", statusHeute: "statusDueToday",
  statusDran: "statusDue", inTagen: "inDays",
  antwortTitel: "answerTitle", nachhakt: "pushBack", gegenfrage: "counterQuestion", denkfehler: "fallacy", fairerweise: "concede", quellen: "sources",
  geprueft: "checked", fehlerMelden: "reportError", linkKopieren: "copyLink", linkKopiert: "linkCopied", schliessen: "close",
  seitenTitel: "pageTitle", antwortenUeben: "practiseAnswers", mehrZu: "moreOn", alleArgumente: "allArguments",
  fussText: "footerText", vorschlagen: "suggestArgument",
};

/** Legacy texts the redesign no longer uses (the start page now opens with the evidence chart). */
const REMOVED = new Set([
  "introTitle", "introText", "columnTheySay", "columnYouAnswer", "inventory",
  "argumentCount", "sourceCount", "youAnswer", "sources", "checked",
]);

const SAMPLE_ARGS: unknown[][] = [[0], [1], [2], [7], [29], [30], [45], [200], [364], [365], [800], ["abc"], ["Woher?"], [3, 5]];

describe.skipIf(!legacyAvailable())("UI texts equal the legacy texts", () => {
  it("has every legacy key with the same value in both languages", async () => {
    const { TEXTE } = await importLegacy<{ TEXTE: Record<string, Record<string, unknown>> }>("texte.js");
    for (const lang of ["de", "en"] as const) {
      const legacy = TEXTE[lang]!;
      const current = TEXTS[lang] as unknown as Record<string, unknown>;
      const kept = Object.keys(legacy).map((k) => KEYS[k]!).filter((k) => !REMOVED.has(k));
      expect(Object.keys(current)).toEqual(expect.arrayContaining(kept));
      for (const removed of REMOVED) expect(current).not.toHaveProperty(removed);
      for (const [oldKey, value] of Object.entries(legacy)) {
        if (REMOVED.has(KEYS[oldKey]!)) continue;
        const now = current[KEYS[oldKey]!];
        if (typeof value === "function") {
          for (const args of SAMPLE_ARGS) expect((now as (...a: unknown[]) => unknown)(...args)).toBe(value(...args));
        } else {
          expect(now).toBe(value);
        }
      }
    }
  });
});

describe("UI texts", () => {
  it("has the same keys and value types in both languages", () => {
    const de = TEXTS.de as unknown as Record<string, unknown>;
    const en = TEXTS.en as unknown as Record<string, unknown>;
    expect(Object.keys(en).sort()).toEqual(Object.keys(de).sort());
    for (const key of Object.keys(de)) expect(typeof en[key], key).toBe(typeof de[key]);
    expect(Object.keys(TEXTS.en.kindName).sort()).toEqual(Object.keys(TEXTS.de.kindName).sort());
  });

  it("uses English quotation marks on the English side", () => {
    const strings = (v: unknown): string[] =>
      typeof v === "string" ? [v] : typeof v === "object" && v ? Object.values(v).flatMap(strings) : [];
    for (const s of strings(TEXTS.en)) expect(s).not.toMatch(/[„‚]/);
    expect(TEXTS.en.quote("x")).toBe("“x”");
  });

  it("builds the evidence texts", () => {
    expect(TEXTS.de.heroTitle(54, 141)).toBe("54 Einwände gegen Veganismus. 141 Belege für deine Antwort.");
    expect(TEXTS.de.evidenceSummary(4, 2017, 2025, [TEXTS.de.kindCount("review", 1), TEXTS.de.kindCount("study", 3)]))
      .toBe("4 Quellen von 2017 bis 2025: 1 Übersichtsarbeit und 3 Einzelstudien.");
    expect(TEXTS.en.evidenceSummary(1, 2024, 2024, [TEXTS.en.kindCount("official", 1)])).toBe("1 source from 2024: 1 official source.");
    expect(TEXTS.de.backPreview({ figure: true, sources: 4, concession: true }))
      .toBe("Auf der Rückseite: eine Kennzahl, 4 Quellen und eine ehrliche Einschränkung.");
    expect(TEXTS.en.backPreview({ figure: false, sources: 1, concession: false })).toBe("On the back: 1 source.");
    expect(TEXTS.de.backPreview({ figure: false, sources: 0, concession: false })).toBe("");
    expect(TEXTS.en.speakingTime(10)).toBe("About 10 seconds out loud (estimated)");
  });
});
