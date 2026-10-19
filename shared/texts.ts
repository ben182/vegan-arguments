// All UI texts in German and English, plus the localized route paths.
import type { SourceKind } from "./types/cards";

/** "a, b und c" / "a, b and c" */
const joinList = (items: string[], and: string) =>
  items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} ${and} ${items[items.length - 1]}`;

interface BackPreview {
  figure: boolean;
  sources: number;
  concession: boolean;
}

const de = {
  lang: "de",
  locale: "de-DE",
  homePath: "/",
  cardPath: (id: string) => `/karte/${id}/`,
  practicePath: "/ueben/",
  quote: (s: string) => `„${s}“`,
  // Page
  title: "Gut vorbereitet – Antworten auf Argumente gegen Veganismus",
  description: "Kurze, belegte Antworten auf die häufigsten Argumente gegen Veganismus – zum Nachschlagen und Üben.",
  brand: "Gut vorbereitet",
  navLabel: "Bereich",
  navLookUp: "Nachschlagen",
  navPractise: "Üben",
  otherLanguage: "English",
  otherLanguageShort: "EN",
  otherLanguageHome: "/en/",
  otherLocale: "en",
  // Look up
  searchPlaceholder: "Suchen, z. B. Protein oder Soja",
  searchLabel: "Argumente durchsuchen",
  filterLabel: "Nach Thema filtern",
  emptyText: "Dazu gibt es noch keine Karte. Versuch ein anderes Stichwort oder wähle „Alle“. Fehlt ein Argument?",
  emptyLink: "Schlag es vor",
  all: "Alle",
  // Practise
  practiseTitle: "Üben wie mit Anki",
  practiseText: "Du liest ein Argument und legst dir deine Antwort zurecht, am besten laut. Dann deckst du die Antwort auf und sagst ehrlich, wie gut es ging. Die Seite plant danach, wann die Karte wiederkommt: kurz bevor du sie vergessen würdest.",
  practiseTopics: "Diese Themen üben",
  practiseFilterLabel: "Themen zum Üben",
  startPractising: "Üben starten",
  nothingToPractise: "Gerade nichts zu üben",
  explainTitle: "Wie funktioniert das?",
  explainText: "Die Planung nutzt FSRS, den Algorithmus, mit dem auch Anki arbeitet. Neue Karten kommen nach 1 und 10 Minuten noch einmal, danach in wachsenden Abständen: erst nach Tagen, später nach Wochen und Monaten. Was du vergisst, kommt sofort wieder dran. Pro Tag kommen höchstens 10 neue Karten dazu. Dein Fortschritt bleibt nur in diesem Browser gespeichert.",
  resetProgress: "Fortschritt löschen",
  resetConfirm: "Deinen ganzen Lernfortschritt löschen? Das lässt sich nicht rückgängig machen.",
  someoneSays: "Jemand sagt:",
  readFullCard: "Ganze Karte mit Quellen lesen",
  showAnswer: "Antwort zeigen",
  spaceKey: "Leertaste",
  rateQuestion: "Wie gut konntest du antworten?",
  again: "Nochmal",
  hard: "Schwer",
  good: "Gut",
  easy: "Einfach",
  countNew: "neu",
  countLearning: "in Arbeit",
  countReview: "zum Wiederholen",
  doneTitle: "Für heute bist du durch",
  moreNewCards: "10 weitere neue Karten",
  backToLookUp: "Zum Nachschlagen",
  doneLearning: (interval: string) => `Eine Karte in Arbeit kommt in ${interval} wieder. Lass die Seite offen, dann geht es automatisch weiter.`,
  doneNextReview: (when: string) => `Die nächste Wiederholung ist ${when} dran.`,
  doneUnseen: (n: number) => `${n} ${n === 1 ? "Karte hast" : "Karten hast"} du noch nicht gesehen.`,
  statusLearning: "lernst du gerade",
  statusDueToday: "heute dran",
  statusDue: (when: string) => `${when} dran`,
  inDays(days: number) {
    if (days === 1) return "morgen";
    if (days < 30) return `in ${days} Tagen`;
    if (days < 365) { const months = Math.round(days / 30.4); return months === 1 ? "in einem Monat" : `in ${months} Monaten`; }
    const years = Math.round(days / 365); return years === 1 ? "in einem Jahr" : `in ${years} Jahren`;
  },
  // Card
  answerTitle: "Deine Antwort fürs Gespräch",
  pushBack: "Wenn jemand nachhakt",
  counterQuestion: "Gegenfrage",
  fallacy: "Denkfehler",
  concede: "Was du fairerweise zugeben solltest",
  reportError: "Fehler melden",
  copyLink: "Link kopieren",
  linkCopied: "Link kopiert",
  close: "Schließen",
  // Card page
  pageTitle: (argument: string) => `„${argument}“ – was du antworten kannst`,
  practiseAnswers: "Antworten üben",
  moreOn: (category: string) => `Mehr zu ${category}`,
  allArguments: "Alle Argumente ansehen",
  // Evidence
  heroTitle: (cards: number, sources: number) => `${cards} Einwände gegen Veganismus. ${sources} Belege für deine Antwort.`,
  heroText: (recent: number) => `Jede Karte nennt, worauf sie sich stützt und was sie nicht beweisen kann. ${recent} Prozent der Quellen sind aus den letzten fünf Jahren.`,
  checkedAll: (date: string) => `Alle Quellen wurden am ${date} geprüft.`,
  checkedBetween: (first: string, last: string) => `Geprüft wurden die Quellen zwischen dem ${first} und dem ${last}.`,
  chartLabel: (n: number, from: number, to: number) => `Alle ${n} Quellen nach Erscheinungsjahr, ${from} bis ${to}`,
  chartCaption: "Jedes Zeichen ist eine Quelle, eingeordnet nach Erscheinungsjahr. Quellen, die auf mehreren Karten stehen, zählen einmal.",
  legendLabel: "Zeichenerklärung",
  kindName: { review: "Übersichtsarbeit oder Positionspapier", study: "Einzelstudie", official: "Behörde, Amt oder Statistik", other: "Bericht, Buch oder Sonstiges" } as Record<SourceKind, string>,
  kindCount(kind: SourceKind, n: number) {
    const words = { review: ["Übersichtsarbeit", "Übersichtsarbeiten"], study: ["Einzelstudie", "Einzelstudien"], official: ["Behördenquelle", "Behördenquellen"], other: ["sonstige Quelle", "sonstige Quellen"] }[kind];
    return `${n} ${n === 1 ? words[0] : words[1]}`;
  },
  evidenceSummary: (n: number, from: number, to: number, kinds: string[]) =>
    `${n} ${n === 1 ? "Quelle" : "Quellen"} ${from === to ? `aus ${from}` : `von ${from} bis ${to}`}: ${joinList(kinds, "und")}.`,
  checkedMark: "geprüft",
  columnArgument: "Einwand",
  columnFigure: "Kennzahl",
  columnEvidence: "Belege nach Jahr",
  noFigure: "ohne Kennzahl",
  rowEvidence: (n: number, concession: boolean) => `${n} ${n === 1 ? "Quelle" : "Quellen"}${concession ? ", mit Einschränkung" : ""}`,
  evidenceTitle: "Worauf sich die Karte stützt",
  stickerTitle: "Geprüft",
  stickerNote: "Quellen nachgesehen",
  speakingTime: (seconds: number) => `Etwa ${seconds} Sekunden laut gesprochen (geschätzt)`,
  allCards: "Alle Karten",
  breadcrumbLabel: "Pfad",
  skipToContent: "Zum Inhalt springen",
  // Practise as a conversation
  speakerThem: "Gegenüber",
  speakerYou: "Du",
  speakerAskBack: "Und dann fragst du",
  frontHint: "Sag dir deine Antwort laut oder im Kopf vor. Dann deck auf und vergleiche.",
  backPreview({ figure, sources, concession }: BackPreview) {
    const parts = [figure ? "eine Kennzahl" : "", sources ? `${sources} ${sources === 1 ? "Quelle" : "Quellen"}` : "", concession ? "eine ehrliche Einschränkung" : ""].filter(Boolean);
    return parts.length ? `Auf der Rückseite: ${joinList(parts, "und")}.` : "";
  },
  concedeShort: "Fairerweise zugeben",
  backSources: (n: number, date: string) => `${n} ${n === 1 ? "Quelle" : "Quellen"}, geprüft am ${date}.`,
  // Footer
  footerText: "Jede Zahl hat eine Quelle, die Links werden jeden Monat geprüft. Wenn dir ein Fehler auffällt, melde ihn direkt auf der Karte. Glaubwürdigkeit geht vor.",
  suggestArgument: "Argument vorschlagen",
};

const en: Texts = {
  lang: "en",
  locale: "en-GB",
  homePath: "/en/",
  cardPath: (id: string) => `/en/card/${id}/`,
  practicePath: "/en/practise/",
  quote: (s: string) => `“${s}”`,

  title: "Well prepared – answers to arguments against veganism",
  description: "Short, evidence-based answers to the most common arguments against veganism – to look up and to practise.",
  brand: "Well prepared",
  navLabel: "Section",
  navLookUp: "Look up",
  navPractise: "Practise",
  otherLanguage: "Deutsch",
  otherLanguageShort: "DE",
  otherLanguageHome: "/",
  otherLocale: "de",

  searchPlaceholder: "Search, e.g. protein or soy",
  searchLabel: "Search arguments",
  filterLabel: "Filter by topic",
  emptyText: "There’s no card for that yet. Try another word or choose “All”. Missing an argument?",
  emptyLink: "Suggest it",
  all: "All",

  practiseTitle: "Practise like with Anki",
  practiseText: "Read an argument and work out your answer, ideally out loud. Then reveal the answer and rate honestly how well it went. The site then schedules when the card comes back: just before you would forget it.",
  practiseTopics: "Topics to practise",
  practiseFilterLabel: "Topics to practise",
  startPractising: "Start practising",
  nothingToPractise: "Nothing to practise right now",
  explainTitle: "How does this work?",
  explainText: "Scheduling uses FSRS, the algorithm Anki also uses. New cards come back after 1 and 10 minutes, then at growing intervals: first days, later weeks and months. Anything you forget comes back right away. At most 10 new cards are added per day. Your progress is only stored in this browser.",
  resetProgress: "Delete progress",
  resetConfirm: "Delete all your learning progress? This cannot be undone.",
  someoneSays: "Someone says:",
  readFullCard: "Read the full card with sources",
  showAnswer: "Show answer",
  spaceKey: "Space",
  rateQuestion: "How well could you answer?",
  again: "Again",
  hard: "Hard",
  good: "Good",
  easy: "Easy",
  countNew: "new",
  countLearning: "learning",
  countReview: "to review",
  doneTitle: "You’re done for today",
  moreNewCards: "10 more new cards",
  backToLookUp: "Back to look-up",
  doneLearning: (interval: string) => `A card you’re learning comes back in ${interval}. Keep the page open and it will continue automatically.`,
  doneNextReview: (when: string) => `Your next review is ${when}.`,
  doneUnseen: (n: number) => `You haven’t seen ${n} ${n === 1 ? "card" : "cards"} yet.`,
  statusLearning: "learning now",
  statusDueToday: "due today",
  statusDue: (when: string) => `due ${when}`,
  inDays(days: number) {
    if (days === 1) return "tomorrow";
    if (days < 30) return `in ${days} days`;
    if (days < 365) { const months = Math.round(days / 30.4); return months === 1 ? "in a month" : `in ${months} months`; }
    const years = Math.round(days / 365); return years === 1 ? "in a year" : `in ${years} years`;
  },

  answerTitle: "Your answer for the conversation",
  pushBack: "If they push back",
  counterQuestion: "Counter-question",
  fallacy: "Fallacy",
  concede: "What you should honestly concede",
  reportError: "Report an error",
  copyLink: "Copy link",
  linkCopied: "Link copied",
  close: "Close",

  pageTitle: (argument: string) => `“${argument}” – what to answer`,
  practiseAnswers: "Practise answers",
  moreOn: (category: string) => `More on ${category}`,
  allArguments: "See all arguments",

  heroTitle: (cards: number, sources: number) => `${cards} objections to veganism. ${sources} sources for your answer.`,
  heroText: (recent: number) => `Every card shows what it is based on and what it can’t prove. ${recent} per cent of the sources are from the last five years.`,
  checkedAll: (date: string) => `All sources were checked on ${date}.`,
  checkedBetween: (first: string, last: string) => `The sources were checked between ${first} and ${last}.`,
  chartLabel: (n: number, from: number, to: number) => `All ${n} sources by year of publication, ${from} to ${to}`,
  chartCaption: "Each mark is a source, placed by its year of publication. A source cited on several cards counts once.",
  legendLabel: "Key",
  kindName: { review: "Review or position paper", study: "Single study", official: "Agency, official body or statistics", other: "Report, book or other" } as Record<SourceKind, string>,
  kindCount(kind: SourceKind, n: number) {
    const words = { review: ["review", "reviews"], study: ["single study", "single studies"], official: ["official source", "official sources"], other: ["other source", "other sources"] }[kind];
    return `${n} ${n === 1 ? words[0] : words[1]}`;
  },
  evidenceSummary: (n: number, from: number, to: number, kinds: string[]) =>
    `${n} ${n === 1 ? "source" : "sources"} ${from === to ? `from ${from}` : `from ${from} to ${to}`}: ${joinList(kinds, "and")}.`,
  checkedMark: "checked",
  columnArgument: "Objection",
  columnFigure: "Key figure",
  columnEvidence: "Sources by year",
  noFigure: "no key figure",
  rowEvidence: (n: number, concession: boolean) => `${n} ${n === 1 ? "source" : "sources"}${concession ? ", with a caveat" : ""}`,
  evidenceTitle: "What this card is based on",
  stickerTitle: "Checked",
  stickerNote: "Sources reviewed",
  speakingTime: (seconds: number) => `About ${seconds} seconds out loud (estimated)`,
  allCards: "All cards",
  breadcrumbLabel: "Breadcrumb",
  skipToContent: "Skip to content",

  speakerThem: "They say",
  speakerYou: "You",
  speakerAskBack: "Then you ask",
  frontHint: "Say your answer out loud or in your head. Then reveal it and compare.",
  backPreview({ figure, sources, concession }: BackPreview) {
    const parts = [figure ? "a key figure" : "", sources ? `${sources} ${sources === 1 ? "source" : "sources"}` : "", concession ? "an honest caveat" : ""].filter(Boolean);
    return parts.length ? `On the back: ${joinList(parts, "and")}.` : "";
  },
  concedeShort: "Honestly concede",
  backSources: (n: number, date: string) => `${n} ${n === 1 ? "source" : "sources"}, checked on ${date}.`,

  footerText: "Every number has a source, and the links are checked every month. If you spot an error, report it right on the card. Accuracy comes first.",
  suggestArgument: "Suggest an argument",
};

export type Texts = typeof de;
export type Locale = "de" | "en";

export const TEXTS: Record<Locale, Texts> = { de, en };
