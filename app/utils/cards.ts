// Presentation helpers for cards (auto-imported).
import { REPO_URL } from "#shared/site";
import type { Card } from "#shared/types/cards";

// Hue per category (OKLCH). Unknown categories get a stable hue derived from their name.
const TONES: Record<string, number> = { gesundheit: 20, natur: 135, umwelt: 200, ethik: 300, tierprodukte: 75, alltag: 250 };
export const categoryHue = (category: string) =>
  TONES[category] ?? [...String(category)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

/** Prefilled GitHub issue for reporting an error on a card (fields of .github/ISSUE_TEMPLATE/error.yml). */
export const reportErrorLink = (card: Card) =>
  `${REPO_URL}/issues/new?template=error.yml&title=${encodeURIComponent(`Error: ${card.id}`)}&karte=${encodeURIComponent(card.id)}`;

/** GitHub issue for suggesting a new argument, optionally prefilled with the search text. */
export const suggestArgumentLink = (text = "") =>
  `${REPO_URL}/issues/new?template=argument.yml${text ? `&argument=${encodeURIComponent(text)}` : ""}`;

/** Removes the quotation marks around an argument (the CSS adds language-specific ones). */
export const stripQuotes = (s: string) => s.replace(/^[„"“]|[“"”]$/g, "");

export const sourceHost = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

/** Normalizes text for search: lower case, without diacritics. */
export const normalizeForSearch = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
