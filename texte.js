// Alle Oberflächentexte auf Deutsch und Englisch.
// Statische Texte in index.html tragen data-t="schlüssel" bzw. data-ta="attribut=schlüssel;…"
// und werden beim Ausliefern von /en/ ersetzt; dynamische Texte holt app.js von hier.

const de = {
  lang: "de",
  locale: "de-DE",
  start: "/",
  kartePfad: (id) => `/karte/${id}/`,
  uebenPfad: "/ueben/",
  zitat: (s) => `„${s}“`,

  // Seite
  titel: "Gut vorbereitet – Antworten auf Argumente gegen Veganismus",
  beschreibung: "Kurze, belegte Antworten auf die häufigsten Argumente gegen Veganismus – zum Nachschlagen und Üben.",
  marke: "Gut vorbereitet",
  navLabel: "Bereich",
  navNachschlagen: "Nachschlagen",
  navUeben: "Üben",
  sprache: "English",
  spracheKurz: "EN",
  spracheLink: "/en/",
  spracheCode: "en",

  // Nachschlagen
  introTitel: "Was du antwortest, wenn jemand sagt …",
  introText: "Die häufigsten Argumente gegen Veganismus, jeweils mit einer kurzen Antwort fürs Gespräch und Quellen, die einer Nachfrage standhalten.",
  suche: "Suchen, z. B. Protein oder Soja",
  sucheLabel: "Argumente durchsuchen",
  filterLabel: "Nach Thema filtern",
  leer: "Dazu gibt es noch keine Karte. Versuch ein anderes Stichwort oder wähle „Alle“. Fehlt ein Argument?",
  leerLink: "Schlag es vor",
  alle: "Alle",
  argumente: (n) => `${n} ${n === 1 ? "Argument" : "Argumente"}`,
  spalteSie: "Sie sagen",
  spalteDu: "Du antwortest",
  quellenAnzahl: (n) => `${n} ${n === 1 ? "Quelle" : "Quellen"}`,
  bestand: (n, m) => `${n} Argumente, ${m} verschiedene Quellen`,

  // Üben
  uebenTitel: "Üben wie mit Anki",
  uebenText: "Du liest ein Argument und legst dir deine Antwort zurecht, am besten laut. Dann deckst du die Antwort auf und sagst ehrlich, wie gut es ging. Die Seite plant danach, wann die Karte wiederkommt: kurz bevor du sie vergessen würdest.",
  uebenThemen: "Diese Themen üben",
  uebenFilterLabel: "Themen zum Üben",
  uebenStarten: "Üben starten",
  nichtsZuUeben: "Gerade nichts zu üben",
  erklaerungTitel: "Wie funktioniert das?",
  erklaerungText: "Die Planung nutzt FSRS, den Algorithmus, mit dem auch Anki arbeitet. Neue Karten kommen nach 1 und 10 Minuten noch einmal, danach in wachsenden Abständen: erst nach Tagen, später nach Wochen und Monaten. Was du vergisst, kommt sofort wieder dran. Pro Tag kommen höchstens 10 neue Karten dazu. Dein Fortschritt bleibt nur in diesem Browser gespeichert.",
  zuruecksetzen: "Fortschritt löschen",
  zuruecksetzenFrage: "Deinen ganzen Lernfortschritt löschen? Das lässt sich nicht rückgängig machen.",
  sagt: "Jemand sagt:",
  duAntwortest: "Du antwortest:",
  ganzeKarte: "Ganze Karte mit Quellen lesen",
  aufdecken: "Antwort zeigen",
  leertaste: "Leertaste",
  bewertenFrage: "Wie gut konntest du antworten?",
  nochmal: "Nochmal",
  schwer: "Schwer",
  gut: "Gut",
  einfach: "Einfach",
  zNeu: "neu",
  zLernen: "in Arbeit",
  zFaellig: "zum Wiederholen",
  endeTitel: "Für heute bist du durch",
  mehrNeue: "10 weitere neue Karten",
  zumNachschlagen: "Zum Nachschlagen",
  endeLernen: (abstand) => `Eine Karte in Arbeit kommt in ${abstand} wieder. Lass die Seite offen, dann geht es automatisch weiter.`,
  endeNaechste: (wann) => `Die nächste Wiederholung ist ${wann} dran.`,
  endeUngesehen: (n) => `${n} ${n === 1 ? "Karte hast" : "Karten hast"} du noch nicht gesehen.`,
  statusLernen: "lernst du gerade",
  statusHeute: "heute dran",
  statusDran: (wann) => `${wann} dran`,
  inTagen(t) {
    if (t === 1) return "morgen";
    if (t < 30) return `in ${t} Tagen`;
    if (t < 365) { const m = Math.round(t / 30.4); return m === 1 ? "in einem Monat" : `in ${m} Monaten`; }
    const j = Math.round(t / 365); return j === 1 ? "in einem Jahr" : `in ${j} Jahren`;
  },

  // Karte
  antwortTitel: "Deine Antwort fürs Gespräch",
  nachhakt: "Wenn jemand nachhakt",
  gegenfrage: "Gegenfrage",
  denkfehler: "Denkfehler",
  fairerweise: "Was du fairerweise zugeben solltest",
  quellen: "Quellen",
  geprueft: (monat) => `Quellen zuletzt geprüft im ${monat}`,
  fehlerMelden: "Fehler melden",
  linkKopieren: "Link kopieren",
  linkKopiert: "Link kopiert",
  schliessen: "Schließen",

  // Einzelseite
  seitenTitel: (argument) => `„${argument}“ – was du antworten kannst`,
  antwortenUeben: "Antworten üben",
  mehrZu: (kat) => `Mehr zu ${kat}`,
  alleArgumente: "Alle Argumente ansehen",

  // Fuß
  fussText: "Jede Zahl hat eine Quelle, die Links werden jeden Monat geprüft. Wenn dir ein Fehler auffällt, melde ihn direkt auf der Karte. Glaubwürdigkeit geht vor.",
  vorschlagen: "Argument vorschlagen",
};

const en = {
  lang: "en",
  locale: "en-GB",
  start: "/en/",
  kartePfad: (id) => `/en/card/${id}/`,
  uebenPfad: "/en/practise/",
  zitat: (s) => `“${s}”`,

  titel: "Well prepared – answers to arguments against veganism",
  beschreibung: "Short, evidence-based answers to the most common arguments against veganism – to look up and to practise.",
  marke: "Well prepared",
  navLabel: "Section",
  navNachschlagen: "Look up",
  navUeben: "Practise",
  sprache: "Deutsch",
  spracheKurz: "DE",
  spracheLink: "/",
  spracheCode: "de",

  introTitel: "What to say when someone tells you …",
  introText: "The most common arguments against veganism, each with a short answer for the conversation and sources that hold up when someone checks.",
  suche: "Search, e.g. protein or soy",
  sucheLabel: "Search arguments",
  filterLabel: "Filter by topic",
  leer: "There’s no card for that yet. Try another word or choose “All”. Missing an argument?",
  leerLink: "Suggest it",
  alle: "All",
  argumente: (n) => `${n} ${n === 1 ? "argument" : "arguments"}`,
  spalteSie: "They say",
  spalteDu: "You answer",
  quellenAnzahl: (n) => `${n} ${n === 1 ? "source" : "sources"}`,
  bestand: (n, m) => `${n} arguments, ${m} different sources`,

  uebenTitel: "Practise like with Anki",
  uebenText: "Read an argument and work out your answer, ideally out loud. Then reveal the answer and rate honestly how well it went. The site then schedules when the card comes back: just before you would forget it.",
  uebenThemen: "Topics to practise",
  uebenFilterLabel: "Topics to practise",
  uebenStarten: "Start practising",
  nichtsZuUeben: "Nothing to practise right now",
  erklaerungTitel: "How does this work?",
  erklaerungText: "Scheduling uses FSRS, the algorithm Anki also uses. New cards come back after 1 and 10 minutes, then at growing intervals: first days, later weeks and months. Anything you forget comes back right away. At most 10 new cards are added per day. Your progress is only stored in this browser.",
  zuruecksetzen: "Delete progress",
  zuruecksetzenFrage: "Delete all your learning progress? This cannot be undone.",
  sagt: "Someone says:",
  duAntwortest: "You answer:",
  ganzeKarte: "Read the full card with sources",
  aufdecken: "Show answer",
  leertaste: "Space",
  bewertenFrage: "How well could you answer?",
  nochmal: "Again",
  schwer: "Hard",
  gut: "Good",
  einfach: "Easy",
  zNeu: "new",
  zLernen: "learning",
  zFaellig: "to review",
  endeTitel: "You’re done for today",
  mehrNeue: "10 more new cards",
  zumNachschlagen: "Back to look-up",
  endeLernen: (abstand) => `A card you’re learning comes back in ${abstand}. Keep the page open and it will continue automatically.`,
  endeNaechste: (wann) => `Your next review is ${wann}.`,
  endeUngesehen: (n) => `You haven’t seen ${n} ${n === 1 ? "card" : "cards"} yet.`,
  statusLernen: "learning now",
  statusHeute: "due today",
  statusDran: (wann) => `due ${wann}`,
  inTagen(t) {
    if (t === 1) return "tomorrow";
    if (t < 30) return `in ${t} days`;
    if (t < 365) { const m = Math.round(t / 30.4); return m === 1 ? "in a month" : `in ${m} months`; }
    const j = Math.round(t / 365); return j === 1 ? "in a year" : `in ${j} years`;
  },

  antwortTitel: "Your answer for the conversation",
  nachhakt: "If they push back",
  gegenfrage: "Counter-question",
  denkfehler: "Fallacy",
  fairerweise: "What you should honestly concede",
  quellen: "Sources",
  geprueft: (monat) => `Sources last checked in ${monat}`,
  fehlerMelden: "Report an error",
  linkKopieren: "Copy link",
  linkKopiert: "Link copied",
  schliessen: "Close",

  seitenTitel: (argument) => `“${argument}” – what to answer`,
  antwortenUeben: "Practise answers",
  mehrZu: (kat) => `More on ${kat}`,
  alleArgumente: "See all arguments",

  fussText: "Every number has a source, and the links are checked every month. If you spot an error, report it right on the card. Accuracy comes first.",
  vorschlagen: "Suggest an argument",
};

export const TEXTE = { de, en };

// Ersetzt data-t / data-ta in einem HTML-String durch die Texte einer Sprache.
// Elemente mit data-t dürfen nur reinen Text enthalten.
export function htmlUebersetzen(html, t) {
  const attr = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const text = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return html
    .replace(/(<[^>]*\sdata-t="(\w+)"[^>]*>)[^<]*</g, (_, tag, key) => `${tag}${text(t[key])}<`)
    .replace(/<[^>]*\sdata-ta="([^"]+)"[^>]*>/g, (tag, liste) =>
      liste.split(";").reduce((neu, paar) => {
        const [name, key] = paar.split("=");
        return neu.replace(new RegExp(`(\\s${name}=")[^"]*(")`), `$1${attr(t[key])}$2`);
      }, tag))
    .replace(/<html lang="[^"]*"/, `<html lang="${t.lang}"`)
    .replace(/<title>[^<]*<\/title>/, `<title>${text(t.titel)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*/, `$1${attr(t.beschreibung)}`)
    .replace(/(<meta property="og:title" content=")[^"]*/, `$1${attr(t.titel)}`)
    .replace(/(<meta property="og:description" content=")[^"]*/, `$1${attr(t.beschreibung)}`)
    .replace(/(<meta property="og:site_name" content=")[^"]*/, `$1${attr(t.marke)}`)
    .replace(/(<meta property="og:locale" content=")[^"]*/, `$1${t.locale.replace("-", "_")}`);
}
