import * as fsrs from "#shared/fsrs";
import type { CategoryId } from "#shared/types/cards";

export const NEW_CARDS_PER_DAY = 10;
const LEARN_AHEAD = 20 * fsrs.MINUTE; // like Anki: learning cards may be shown up to 20 min early

export interface ReviewQueue {
  /** Learning cards due now. */
  learningNow: string[];
  /** Learning cards due within the learn-ahead limit (shown as "in Arbeit"). */
  learningSoon: string[];
  /** Learning cards due later than the learn-ahead limit. */
  learningLater: string[];
  /** Review cards due today. */
  review: string[];
  /** New cards still allowed today. */
  new: string[];
}

/** The Anki-like queue for the categories selected on the practice page. */
export function useReviewQueue() {
  const deck = useDeck();
  const { scheduleOf, newCardsToday } = useProgress();
  // Categories switched off on the practice page (default: none, i.e. practise everything)
  const deselected = useState<CategoryId[]>("practice-deselected", () => []);
  const selected = computed(() => deck.value.categoryIds.filter((c) => !deselected.value.includes(c)));
  const isSelected = (c: CategoryId) => !deselected.value.includes(c);
  const toggleCategory = (c: CategoryId) => {
    deselected.value = isSelected(c) ? [...deselected.value, c] : deselected.value.filter((x) => x !== c);
  };

  function queue(now: number): ReviewQueue {
    const today = fsrs.dayNumber(now);
    const learning: string[] = [];
    const review: string[] = [];
    const fresh: string[] = [];
    for (const card of deck.value.cards) {
      if (!isSelected(card.category)) continue;
      const s = scheduleOf(card.id);
      if (s.state === "new") fresh.push(card.id);
      else if (s.state === "review") {
        if (fsrs.dayNumber(s.due) <= today) review.push(card.id);
      } else learning.push(card.id);
    }
    const byDue = (a: string, b: string) => scheduleOf(a).due - scheduleOf(b).due;
    learning.sort(byDue);
    review.sort(byDue);
    const n = newCardsToday(now);
    const newAllowed = Math.max(0, NEW_CARDS_PER_DAY + n.extra - n.count);
    return {
      learningNow: learning.filter((id) => scheduleOf(id).due <= now),
      learningSoon: learning.filter((id) => scheduleOf(id).due <= now + LEARN_AHEAD),
      learningLater: learning.filter((id) => scheduleOf(id).due > now + LEARN_AHEAD),
      review,
      new: fresh.slice(0, newAllowed),
    };
  }

  /** Next card to show: learning due now, then reviews, then new cards, then learn-ahead. */
  function nextCard(now: number): string | null {
    const q = queue(now);
    return q.learningNow[0] || q.review[0] || q.new[0] || q.learningSoon[0] || null;
  }

  return { queue, nextCard, selected, isSelected, toggleCategory };
}
