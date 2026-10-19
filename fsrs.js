// Wiederholungsplanung wie in Anki: FSRS-5 mit Standardgewichten, Lernschritten
// und Tageswechsel um 4 Uhr. Läuft im Browser (window.FSRS) und in Node (require).
(function (root) {
  const W = [
    0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192,
    1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621,
  ];
  const DECAY = -0.5;
  const FACTOR = 19 / 81; // 0.9^(1/DECAY) - 1
  const BEHALTEN = 0.9; // gewünschte Erinnerungsquote, Anki-Standard
  const MIN = 60 * 1000;
  const TAG = 24 * 60 * MIN;
  const LERNSCHRITTE = [1, 10]; // Minuten
  const NEULERNSCHRITTE = [10];
  const MAX_TAGE = 36500;

  const NOCHMAL = 1, SCHWER = 2, GUT = 3, EINFACH = 4;

  const begrenzen = (x, a, b) => Math.min(b, Math.max(a, x));

  // Anki-Tag: beginnt um 4 Uhr Ortszeit
  function tag(ms) {
    const d = new Date(ms - 4 * 60 * MIN);
    return Math.floor((d.getTime() - d.getTimezoneOffset() * MIN) / TAG);
  }

  const startStabilitaet = (g) => W[g - 1];
  const startSchwierigkeit = (g) => begrenzen(W[4] - Math.exp(W[5] * (g - 1)) + 1, 1, 10);
  const abrufbarkeit = (tage, s) => Math.pow(1 + (FACTOR * tage) / s, DECAY);
  const intervall = (s) => begrenzen(Math.round((s / FACTOR) * (Math.pow(BEHALTEN, 1 / DECAY) - 1)), 1, MAX_TAGE);

  function neueSchwierigkeit(d, g) {
    const d1 = d - W[6] * (g - 3) * ((10 - d) / 9);
    return begrenzen(W[7] * startSchwierigkeit(EINFACH) + (1 - W[7]) * d1, 1, 10);
  }

  function neueStabilitaet(k, g, tageSeit) {
    if (tageSeit < 1) return k.s * Math.exp(W[17] * (g - 3 + W[18])); // am selben Tag
    const r = abrufbarkeit(tageSeit, k.s);
    if (g === NOCHMAL) {
      return Math.min(k.s, W[11] * Math.pow(k.d, -W[12]) * (Math.pow(k.s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r)));
    }
    const faktor = g === SCHWER ? W[15] : g === EINFACH ? W[16] : 1;
    return k.s * (1 + Math.exp(W[8]) * (11 - k.d) * Math.pow(k.s, -W[9]) * (Math.exp(W[10] * (1 - r)) - 1) * faktor);
  }

  // Gedächtniswerte (s, d) nach einer Bewertung, ohne Terminplanung
  function gedaechtnis(k, g, jetzt) {
    if (k.status === "neu") return { s: startStabilitaet(g), d: startSchwierigkeit(g) };
    const tageSeit = tag(jetzt) - tag(k.zuletzt);
    return { s: neueStabilitaet(k, g, tageSeit), d: neueSchwierigkeit(k.d, g) };
  }

  const NEU = { status: "neu", schritt: 0, s: 0, d: 0, faellig: 0, zuletzt: null, wdh: 0, vergessen: 0 };

  function planen(alt, g, jetzt) {
    const k = { ...NEU, ...alt };
    const { s, d } = gedaechtnis(k, g, jetzt);
    const neu = { ...k, s, d, zuletzt: jetzt, wdh: k.wdh + 1 };
    const inMinuten = (m) => ({ ...neu, faellig: jetzt + Math.round(m) * MIN });
    const inTagen = (t) => ({ ...neu, status: "wiederholen", schritt: 0, faellig: jetzt + t * TAG });

    if (k.status === "neu" || k.status === "lernen") {
      const schritt = k.status === "neu" ? 0 : k.schritt;
      const lernend = { ...neu, status: "lernen" };
      if (g === NOCHMAL) return { ...lernend, schritt: 0, faellig: jetzt + LERNSCHRITTE[0] * MIN };
      if (g === SCHWER) {
        const m = schritt === 0 && LERNSCHRITTE.length > 1 ? (LERNSCHRITTE[0] + LERNSCHRITTE[1]) / 2 : LERNSCHRITTE[schritt];
        return { ...lernend, schritt, faellig: jetzt + Math.round(m) * MIN };
      }
      if (g === GUT && schritt + 1 < LERNSCHRITTE.length) {
        return { ...lernend, schritt: schritt + 1, faellig: jetzt + LERNSCHRITTE[schritt + 1] * MIN };
      }
      return inTagen(intervall(s));
    }

    if (k.status === "neulernen") {
      if (g === NOCHMAL) return { ...inMinuten(NEULERNSCHRITTE[0]), schritt: 0 };
      if (g === SCHWER) return inMinuten(NEULERNSCHRITTE[0] * 1.5);
      return inTagen(intervall(s));
    }

    // wiederholen
    if (g === NOCHMAL) {
      return { ...inMinuten(NEULERNSCHRITTE[0]), status: "neulernen", schritt: 0, vergessen: k.vergessen + 1 };
    }
    // Wie Anki: Schwer ≤ Gut < Einfach
    let schwer = intervall(gedaechtnis(k, SCHWER, jetzt).s);
    let gut = intervall(gedaechtnis(k, GUT, jetzt).s);
    let einfach = intervall(gedaechtnis(k, EINFACH, jetzt).s);
    schwer = Math.min(schwer, gut);
    gut = Math.max(gut, schwer + 1);
    einfach = Math.max(einfach, gut + 1);
    return inTagen({ [SCHWER]: schwer, [GUT]: gut, [EINFACH]: einfach }[g]);
  }

  // Für die Knöpfe: wann käme die Karte bei welcher Bewertung wieder?
  function vorschau(k, jetzt) {
    return [NOCHMAL, SCHWER, GUT, EINFACH].map((g) => planen(k, g, jetzt).faellig - jetzt);
  }

  function abstandText(ms) {
    const min = Math.round(ms / MIN);
    if (min < 1) return "< 1 Min.";
    if (min < 60) return `${min} Min.`;
    const std = Math.round(min / 60);
    if (std < 24) return `${std} Std.`;
    const tage = Math.round(ms / TAG);
    if (tage < 30) return tage === 1 ? "1 Tag" : `${tage} Tage`;
    const monate = tage / 30.4;
    if (monate < 12) return `${monate.toFixed(1).replace(".", ",").replace(",0", "")} Mon.`;
    return `${(tage / 365).toFixed(1).replace(".", ",").replace(",0", "")} J.`;
  }

  const api = { planen, vorschau, abstandText, tag, intervall, NEU, MIN, TAG, NOCHMAL, SCHWER, GUT, EINFACH };
  if (typeof module !== "undefined") module.exports = api;
  else root.FSRS = api;
})(this);
