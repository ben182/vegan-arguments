import { describe, expect, it } from "vitest";
import { checkRange, deckSources, evidenceAxis, kindCounts, recentShare, sourceKind, speakingSeconds, timelineMarkers, uniqueSources } from "../shared/evidence";
import type { Card, Source } from "../shared/types/cards";

const src = (url: string, year: number, kind?: Source["kind"]): Source => ({ title: url, url, year, kind });
const card = (id: string, checked: string, sources: Source[]): Card => ({ id, category: "alltag", checked, argument: id, answer: id, sources });

describe("evidence", () => {
  const cards = [
    card("a", "2026-10-01", [src("u1", 2024, "review"), src("u2", 2019, "study"), src("u1", 2024, "review")]),
    card("b", "2026-10-19", [src("u1", 2024, "review"), src("u3", 2003)]),
  ];

  it("counts distinct URLs, not citations", () => {
    expect(uniqueSources(cards[0]!.sources!)).toHaveLength(2);
    expect(deckSources(cards).map((s) => s.url)).toEqual(["u1", "u2", "u3"]);
  });

  it("treats a missing kind as other", () => {
    expect(sourceKind(src("x", 2020))).toBe("other");
    expect(kindCounts(deckSources(cards))).toEqual({ review: 1, study: 1, official: 0, other: 1 });
  });

  it("derives the axis and check dates from the data", () => {
    expect(checkRange(cards)).toEqual({ first: "2026-10-01", last: "2026-10-19" });
    expect(evidenceAxis(cards)).toEqual({ from: 2000, to: 2026 });
  });

  it("computes the share of the last five years", () => {
    // 2022–2026 count as the last five years of 2026: u1 (2024) only
    expect(recentShare(deckSources(cards), 2026)).toBe(33);
    expect(recentShare([], 2026)).toBe(0);
  });

  it("stacks markers of the same year", () => {
    const m = timelineMarkers([src("a", 2020, "study"), src("b", 2020, "review"), src("c", 2010)], { from: 2015, to: 2026 });
    expect(m.map((x) => [x.year, x.level, x.kind])).toEqual([[2015, 0, "other"], [2020, 0, "review"], [2020, 1, "study"]]);
  });

  it("estimates the speaking time in steps of five seconds", () => {
    expect(speakingSeconds("Ja.")).toBe(5);
    expect(speakingSeconds(Array(22).fill("Wort").join(" "))).toBe(10);
    expect(speakingSeconds(Array(40).fill("Wort").join(" "))).toBe(20);
  });
});
