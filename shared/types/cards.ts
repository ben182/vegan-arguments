// Shape of the flashcard content in shared/data/cards.<locale>.ts.

/** Category slugs. They are content ids (like card ids) and stay as they are. */
export type CategoryId = "gesundheit" | "natur" | "umwelt" | "ethik" | "tierprodukte" | "alltag" | "gespraech";

/** Display name per category, in the language of the data module. */
export type Categories = Record<CategoryId, string>;

export interface Source {
  title: string;
  url: string;
  year: number;
}

export interface Card {
  /** Slug used in the URL (/karte/<id>/, /en/card/<id>/) and as key for the stored progress. */
  id: string;
  category: CategoryId;
  /** Date (YYYY-MM-DD) the sources were last checked. */
  checked: string;
  /** What someone says, as quoted on the card. */
  argument: string;
  /** The short answer for the conversation. */
  answer: string;
  /** A single key figure, e.g. "0,8 g" with an explanation. */
  figure?: { value: string; text: string };
  /** Follow-up points if someone pushes back. */
  points?: string[];
  counterQuestion?: string;
  fallacy?: { name: string; explanation: string };
  /** What you should honestly concede. */
  concession?: string;
  sources?: Source[];
}

export interface Deck {
  cards: Card[];
  categories: Categories;
}
