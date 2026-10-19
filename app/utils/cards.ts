// Presentation helpers for cards (auto-imported).
import { REPO_URL } from "#shared/site";
import type { Card } from "#shared/types/cards";

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
