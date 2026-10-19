// Evidence statistics for the source timelines ("Belegleiste"): pure functions of the card data.
import type { Card, Source, SourceKind } from "./types/cards";

export const SOURCE_KINDS: SourceKind[] = ["review", "study", "official", "other"];

/** Kind of a source; sources without a kind count as "other". */
export const sourceKind = (s: Source): SourceKind => s.kind ?? "other";

/** Sources without duplicates (same URL), keeping the first occurrence. */
export function uniqueSources(sources: Source[]): Source[] {
  const seen = new Set<string>();
  return sources.filter((s) => !seen.has(s.url) && !!seen.add(s.url));
}

/** All distinct sources of a deck: a source cited on several cards counts once. */
export const deckSources = (cards: Card[]): Source[] => uniqueSources(cards.flatMap((c) => c.sources ?? []));

/** Number of sources per kind, in the order of SOURCE_KINDS. */
export function kindCounts(sources: Source[]): Record<SourceKind, number> {
  const counts: Record<SourceKind, number> = { review: 0, study: 0, official: 0, other: 0 };
  for (const s of sources) counts[sourceKind(s)]++;
  return counts;
}

/** Most recent check date (YYYY-MM-DD) of the cards, and the oldest one. */
export function checkRange(cards: Card[]): { first: string; last: string } | null {
  const dates = cards.map((c) => c.checked).filter(Boolean).sort();
  return dates.length ? { first: dates[0]!, last: dates[dates.length - 1]! } : null;
}

export interface Axis {
  from: number;
  to: number;
}

/**
 * Year axis shared by every timeline of a deck, so they can be compared: from the oldest source
 * (rounded down to a multiple of five) to the year of the latest check (or the newest source).
 */
export function evidenceAxis(cards: Card[]): Axis {
  const years = deckSources(cards).map((s) => s.year).filter((y) => Number.isFinite(y));
  const checked = checkRange(cards);
  const to = Math.max(checked ? Number(checked.last.slice(0, 4)) : 0, ...years, 2000);
  const oldest = years.length ? Math.min(...years) : to - 10;
  return { from: Math.min(Math.floor(oldest / 5) * 5, to - 10), to };
}

/** Share (0–100, rounded) of sources published in the last five years up to `year`. */
export function recentShare(sources: Source[], year: number): number {
  if (!sources.length) return 0;
  return Math.round((sources.filter((s) => s.year > year - 5).length / sources.length) * 100);
}

/**
 * Rough time to say a text out loud: about 2.2 words per second (≈ 130 words per minute, a calm
 * speaking pace), rounded to 5 seconds and at least 5. An estimate, not a measurement.
 */
export function speakingSeconds(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(5, Math.round(words / 2.2 / 5) * 5);
}

export interface Marker {
  kind: SourceKind;
  /** Year of the source, clamped to the axis. */
  year: number;
  /** 0 for the lowest marker of a year, 1 for the one above, … */
  level: number;
  source: Source;
}

/** Markers of a timeline: one per source in its year, stacked when years repeat (sorted by year, then kind). */
export function timelineMarkers(sources: Source[], axis: Axis): Marker[] {
  const order = (k: SourceKind) => SOURCE_KINDS.indexOf(k);
  const sorted = [...sources].sort((a, b) => a.year - b.year || order(sourceKind(a)) - order(sourceKind(b)));
  const levels: Record<number, number> = {};
  return sorted.map((source) => {
    const year = Math.min(axis.to, Math.max(axis.from, source.year));
    const level = levels[year] ?? 0;
    levels[year] = level + 1;
    return { kind: sourceKind(source), year, level, source };
  });
}
