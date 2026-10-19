// Proves that the UI copy is unchanged: every legacy text in texte.js has an English-keyed
// counterpart in shared/texts.ts with the same value (functions: same output).
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

const SAMPLE_ARGS: unknown[][] = [[0], [1], [2], [7], [29], [30], [45], [200], [364], [365], [800], ["abc"], ["Woher?"], [3, 5]];

describe.skipIf(!legacyAvailable())("UI texts equal the legacy texts", () => {
  it("has every legacy key with the same value in both languages", async () => {
    const { TEXTE } = await importLegacy<{ TEXTE: Record<string, Record<string, unknown>> }>("texte.js");
    for (const lang of ["de", "en"] as const) {
      const legacy = TEXTE[lang]!;
      const current = TEXTS[lang] as unknown as Record<string, unknown>;
      expect(Object.keys(current).sort()).toEqual(Object.keys(legacy).map((k) => KEYS[k]).sort());
      for (const [oldKey, value] of Object.entries(legacy)) {
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
