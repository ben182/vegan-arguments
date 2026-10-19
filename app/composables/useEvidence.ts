import { checkRange, deckSources, evidenceAxis, kindCounts, recentShare, SOURCE_KINDS, uniqueSources, type Axis } from "#shared/evidence";
import type { Source } from "#shared/types/cards";

export interface EvidenceView {
  /** Year axis shared by every timeline of the deck. */
  axis: Axis;
  /** Distinct sources of the deck (by URL). */
  sources: Source[];
  /** Share of sources from the last five years up to the axis end. */
  recent: number;
  /** "Alle Quellen wurden am … geprüft." or the range of check dates. */
  checkedText: string;
  /** Text alternative of a timeline: count, years, kinds. */
  summary: (sources: Source[]) => string;
  /** Long date in the current language, e.g. "19. Oktober 2026". */
  longDate: (iso: string) => string;
  /** Short date for the sticker, e.g. "19.10.2026". */
  shortDate: (iso: string) => string;
}

/** Evidence figures of the current deck; everything is derived from the card data, nothing is fixed. */
export function useEvidence(): ComputedRef<EvidenceView> {
  const deck = useDeck();
  const t = useTexts();
  return computed(() => {
    const tt = t.value;
    const cards = deck.value.cards;
    const sources = deckSources(cards);
    const axis = evidenceAxis(cards);
    const date = (iso: string, options: Intl.DateTimeFormatOptions) =>
      new Date(`${iso}T12:00:00Z`).toLocaleDateString(tt.locale, { timeZone: "UTC", ...options });
    const longDate = (iso: string) => date(iso, { day: "numeric", month: "long", year: "numeric" });
    const shortDate = (iso: string) => date(iso, { day: "2-digit", month: "2-digit", year: "numeric" });
    const checked = checkRange(cards);
    const checkedText = !checked ? "" : checked.first === checked.last
      ? tt.checkedAll(longDate(checked.last))
      : tt.checkedBetween(longDate(checked.first), longDate(checked.last));
    const summary = (list: Source[]) => {
      const unique = uniqueSources(list);
      if (!unique.length) return "";
      const counts = kindCounts(unique);
      const years = unique.map((s) => s.year);
      const kinds = SOURCE_KINDS.filter((k) => counts[k] > 0).map((k) => tt.kindCount(k, counts[k]));
      return tt.evidenceSummary(unique.length, Math.min(...years), Math.max(...years), kinds);
    };
    return { axis, sources, recent: recentShare(sources, axis.to), checkedText, summary, longDate, shortDate };
  });
}
