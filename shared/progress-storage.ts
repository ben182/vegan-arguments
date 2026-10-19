// Practice progress as stored in localStorage under STORAGE_KEY.
//
// The stored JSON format predates this code base and uses German field names. It must stay
// exactly as it is so existing users keep their progress, so it is translated here at the
// edge: the rest of the app only sees the English `Progress` model.
import { NEW_CARD, type CardState, type Schedule } from "./fsrs";

export const STORAGE_KEY = "vk-anki-v1";
/** Leitner-style progress of an even older version; removed on start. */
export const LEGACY_STORAGE_KEY = "vk-fortschritt";

export interface NewCardsToday {
  /** Anki day number (see fsrs.dayNumber) this counter belongs to. */
  day: number;
  /** New cards introduced on that day. */
  count: number;
  /** Extra new cards granted via "10 more new cards". */
  extra: number;
}

export interface Progress {
  cards: Record<string, Schedule>;
  newToday: NewCardsToday;
}

/** Stored format of one card (see Schedule). */
interface StoredSchedule {
  status: "neu" | "lernen" | "wiederholen" | "neulernen";
  schritt: number;
  s: number;
  d: number;
  faellig: number;
  zuletzt: number | null;
  wdh: number;
  vergessen: number;
}

interface StoredProgress {
  karten: Record<string, StoredSchedule>;
  neuHeute: { tag: number; anzahl: number; extra: number };
}

const TO_STORED: Record<CardState, StoredSchedule["status"]> = {
  new: "neu", learning: "lernen", review: "wiederholen", relearning: "neulernen",
};
const FROM_STORED = Object.fromEntries(Object.entries(TO_STORED).map(([k, v]) => [v, k])) as Record<StoredSchedule["status"], CardState>;

export const emptyProgress = (): Progress => ({ cards: {}, newToday: { day: 0, count: 0, extra: 0 } });

function decodeSchedule(s: Partial<StoredSchedule>): Schedule {
  return {
    state: (s.status && FROM_STORED[s.status]) || NEW_CARD.state,
    step: s.schritt ?? NEW_CARD.step,
    stability: s.s ?? NEW_CARD.stability,
    difficulty: s.d ?? NEW_CARD.difficulty,
    due: s.faellig ?? NEW_CARD.due,
    lastReview: s.zuletzt ?? NEW_CARD.lastReview,
    reps: s.wdh ?? NEW_CARD.reps,
    lapses: s.vergessen ?? NEW_CARD.lapses,
  };
}

const encodeSchedule = (c: Schedule): StoredSchedule => ({
  status: TO_STORED[c.state],
  schritt: c.step,
  s: c.stability,
  d: c.difficulty,
  faellig: c.due,
  zuletzt: c.lastReview,
  wdh: c.reps,
  vergessen: c.lapses,
});

/** Parses the stored JSON (or null). Falls back to empty progress like the original app. */
export function decodeProgress(json: string | null): Progress {
  const stored = JSON.parse(json || "null") as Partial<StoredProgress> | null;
  if (!stored) return emptyProgress();
  const cards: Record<string, Schedule> = {};
  for (const [id, s] of Object.entries(stored.karten ?? {})) cards[id] = decodeSchedule(s);
  const n = stored.neuHeute ?? { tag: 0, anzahl: 0, extra: 0 };
  return { cards, newToday: { day: n.tag, count: n.anzahl, extra: n.extra } };
}

export function encodeProgress(p: Progress): string {
  const stored: StoredProgress = {
    karten: Object.fromEntries(Object.entries(p.cards).map(([id, c]) => [id, encodeSchedule(c)])),
    neuHeute: { tag: p.newToday.day, anzahl: p.newToday.count, extra: p.newToday.extra },
  };
  return JSON.stringify(stored);
}
