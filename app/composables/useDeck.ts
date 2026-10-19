import type { Locale } from "#shared/texts";
import type { Card, CategoryId, Deck } from "#shared/types/cards";

// Each language's cards are a separate chunk, so a page only downloads its own language.
const loaders: Record<Locale, () => Promise<Deck>> = {
  de: () => import("#shared/data/cards.de").then((m) => ({ cards: m.cards, categories: m.categories })),
  en: () => import("#shared/data/cards.en").then((m) => ({ cards: m.cards, categories: m.categories })),
};

// Static content, identical for every request: safe to cache at module level (also on the server).
const loaded = shallowReactive<Partial<Record<Locale, Deck>>>({});

/** Loads the cards of a language. Awaited once in app.vue before anything renders. */
export async function loadDeck(locale: Locale): Promise<Deck> {
  return (loaded[locale] ??= await loaders[locale]());
}

export interface DeckView extends Deck {
  byId: Record<string, Card>;
  /** Categories in display order, including any category only used by cards. */
  categoryIds: CategoryId[];
  categoryName: (id: CategoryId) => string;
}

/** Cards of the current locale (requires loadDeck to have run). */
export function useDeck(): ComputedRef<DeckView> {
  const locale = useLocaleCode();
  return computed(() => {
    const deck = loaded[locale.value];
    if (!deck) throw new Error(`Cards for "${locale.value}" are not loaded`);
    return {
      ...deck,
      byId: Object.fromEntries(deck.cards.map((c) => [c.id, c])),
      categoryIds: [...new Set([...(Object.keys(deck.categories) as CategoryId[]), ...deck.cards.map((c) => c.category)])],
      categoryName: (id: CategoryId) => deck.categories[id] || id,
    };
  });
}
