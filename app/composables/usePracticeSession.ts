import * as fsrs from "#shared/fsrs";
import type { ReviewQueue } from "./useReviewQueue";

export type PracticePhase = "start" | "card" | "done";
export type QueueKind = "new" | "learning" | "review";

export interface QueueCounts {
  new: number;
  learning: number;
  review: number;
}

interface SessionState {
  phase: PracticePhase;
  /** Card currently asked. */
  currentId: string | null;
  /** Card shown on the answer side (swapped only once the answer is hidden again). */
  answerId: string | null;
  revealed: boolean;
  /** Queue counts while practising, with the queue the current card comes from. */
  counts: QueueCounts;
  currentKind: QueueKind;
  /** Interval labels for the four rating buttons. */
  intervals: string[];
  doneText: string;
  showMoreNew: boolean;
}

export const countsOf = (q: ReviewQueue): QueueCounts => ({ new: q.new.length, learning: q.learningSoon.length, review: q.review.length });

// Client-only timers (never set during server rendering)
let wakeTimer: ReturnType<typeof setTimeout> | undefined;
let answerTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * A practice session like in Anki. The state survives navigating between the pages, so a
 * running session continues when you come back to the practice page.
 */
export function usePracticeSession() {
  const state = useState<SessionState>("practice-session", () => ({
    phase: "start",
    currentId: null,
    answerId: null,
    revealed: false,
    counts: { new: 0, learning: 0, review: 0 },
    currentKind: "new",
    intervals: ["", "", "", ""],
    doneText: "",
    showMoreNew: false,
  }));
  const deck = useDeck();
  const t = useTexts();
  const progress = useProgress();
  const { queue, nextCard, isSelected } = useReviewQueue();

  function showCard() {
    const now = Date.now();
    const id = nextCard(now);
    if (!id) return finish();
    const s = state.value;
    const wasRevealed = s.revealed;
    s.revealed = false;
    s.currentId = id;
    // Swap the answer side only once it is hidden, otherwise the new answer flashes up
    clearTimeout(answerTimer);
    if (wasRevealed) answerTimer = setTimeout(() => (state.value.answerId = id), 280);
    else s.answerId = id;
    const schedule = progress.scheduleOf(id);
    s.currentKind = schedule.state === "new" ? "new" : schedule.state === "review" ? "review" : "learning";
    s.counts = countsOf(queue(now));
    s.intervals = fsrs.previewIntervals(schedule, now).map((ms) => fsrs.formatInterval(ms, t.value.lang));
  }

  function start() {
    state.value.phase = "card";
    showCard();
  }

  function reveal() {
    state.value.revealed = true;
  }

  function rate(rating: fsrs.Rating) {
    const s = state.value;
    if (s.phase !== "card" || !s.currentId || !s.revealed) return;
    progress.rate(s.currentId, rating);
    showCard();
  }

  function finish() {
    const s = state.value;
    s.phase = "done";
    const now = Date.now();
    const q = queue(now);
    const unseen = deck.value.cards.filter((c) => isSelected(c.category) && progress.scheduleOf(c.id).state === "new").length;
    let text: string;
    const firstLater = q.learningLater[0];
    if (firstLater) {
      const wait = progress.scheduleOf(firstLater).due - now;
      text = t.value.doneLearning(fsrs.formatInterval(wait, t.value.lang));
      clearTimeout(wakeTimer);
      wakeTimer = setTimeout(() => {
        if (state.value.phase === "done") start();
      }, wait + 500);
    } else {
      const nextReview = deck.value.cards
        .map((c) => progress.scheduleOf(c.id))
        .filter((c) => c.state === "review")
        .map((c) => c.due)
        .sort((a, b) => a - b)[0];
      text = nextReview ? t.value.doneNextReview(t.value.inDays(Math.max(1, fsrs.dayNumber(nextReview) - fsrs.dayNumber(now)))) : "";
    }
    if (unseen) text += ` ${t.value.doneUnseen(unseen)}`;
    s.doneText = text.trim();
    s.showMoreNew = unseen > 0;
  }

  function moreNewCards() {
    progress.editableNewCardsToday(Date.now()).extra += NEW_CARDS_PER_DAY;
    progress.save();
    start();
  }

  /** Coming back to the practice page: a finished session shows the start screen again. */
  function enterPage() {
    if (state.value.phase === "done") state.value.phase = "start";
  }

  return { state, start, reveal, rate, moreNewCards, enterPage };
}
