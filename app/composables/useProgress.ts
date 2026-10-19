import * as fsrs from "#shared/fsrs";
import { decodeProgress, emptyProgress, encodeProgress, LEGACY_STORAGE_KEY, STORAGE_KEY, type NewCardsToday, type Progress } from "#shared/progress-storage";

/**
 * Practice progress, stored only in this browser (localStorage).
 *
 * The server and the first client render always see empty progress; the stored progress is
 * loaded once hydration has finished (plugins/progress.client.ts). Anything that depends on it
 * must check `ready` so server and client markup match.
 */
export function useProgress() {
  const progress = useState<Progress>("progress", emptyProgress);
  const ready = useState("progress-ready", () => false);

  const scheduleOf = (id: string): fsrs.Schedule => progress.value.cards[id] ?? fsrs.NEW_CARD;

  /** New-card counter of the Anki day of `now` (read-only: a new day starts at zero). */
  const newCardsToday = (now: number): NewCardsToday => {
    const day = fsrs.dayNumber(now);
    const n = progress.value.newToday;
    return n.day === day ? n : { day, count: 0, extra: 0 };
  };

  /** Like newCardsToday, but resets the stored counter on a new day so it can be changed. */
  const editableNewCardsToday = (now: number): NewCardsToday => {
    const day = fsrs.dayNumber(now);
    if (progress.value.newToday.day !== day) progress.value.newToday = { day, count: 0, extra: 0 };
    return progress.value.newToday;
  };

  const save = () => {
    if (import.meta.client) localStorage.setItem(STORAGE_KEY, encodeProgress(progress.value));
  };

  const load = () => {
    progress.value = decodeProgress(localStorage.getItem(STORAGE_KEY));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    ready.value = true;
  };

  const rate = (id: string, rating: fsrs.Rating, now = Date.now()) => {
    if (scheduleOf(id).state === "new") editableNewCardsToday(now).count++;
    progress.value.cards[id] = fsrs.schedule(scheduleOf(id), rating, now);
    save();
  };

  const reset = () => {
    progress.value = emptyProgress();
    save();
  };

  return { progress, ready, scheduleOf, newCardsToday, editableNewCardsToday, rate, reset, save, load };
}

/** Learning status of a card for lists and the card panel ("heute dran", "lernst du gerade", …). */
export function useCardStatus() {
  const { ready, scheduleOf } = useProgress();
  const t = useTexts();
  return (id: string, now = Date.now()): string => {
    if (!ready.value) return "";
    const s = scheduleOf(id);
    if (s.state === "new") return "";
    if (s.state !== "review") return t.value.statusLearning;
    const days = fsrs.dayNumber(s.due) - fsrs.dayNumber(now);
    return days <= 0 ? t.value.statusDueToday : t.value.statusDue(t.value.inDays(days));
  };
}
