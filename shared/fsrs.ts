// Review scheduling like in Anki: FSRS-5 with the default weights, learning steps
// and a day rollover at 4 a.m. local time.

const W = [
  0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192,
  1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621,
] as const;
const DECAY = -0.5;
const FACTOR = 19 / 81; // 0.9^(1/DECAY) - 1
const DESIRED_RETENTION = 0.9; // Anki default
export const MINUTE = 60 * 1000;
export const DAY = 24 * 60 * MINUTE;
const LEARNING_STEPS = [1, 10]; // minutes
const RELEARNING_STEPS = [10]; // minutes
const MAX_INTERVAL_DAYS = 36500;

export const AGAIN = 1;
export const HARD = 2;
export const GOOD = 3;
export const EASY = 4;
export type Rating = typeof AGAIN | typeof HARD | typeof GOOD | typeof EASY;
export const RATINGS: readonly Rating[] = [AGAIN, HARD, GOOD, EASY];

export type CardState = "new" | "learning" | "review" | "relearning";

/** Scheduling state of one card. */
export interface Schedule {
  state: CardState;
  /** Index into the (re)learning steps. */
  step: number;
  stability: number;
  difficulty: number;
  /** Timestamp (ms) when the card is due. */
  due: number;
  /** Timestamp (ms) of the last review, null if never reviewed. */
  lastReview: number | null;
  reps: number;
  lapses: number;
}

export const NEW_CARD: Readonly<Schedule> = Object.freeze({
  state: "new", step: 0, stability: 0, difficulty: 0, due: 0, lastReview: null, reps: 0, lapses: 0,
});

const clamp = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x));

/** Anki day number: a day starts at 4 a.m. local time. */
export function dayNumber(ms: number): number {
  const d = new Date(ms - 4 * 60 * MINUTE);
  return Math.floor((d.getTime() - d.getTimezoneOffset() * MINUTE) / DAY);
}

const initialStability = (g: Rating) => W[g - 1]!;
const initialDifficulty = (g: Rating) => clamp(W[4] - Math.exp(W[5] * (g - 1)) + 1, 1, 10);
const retrievability = (days: number, s: number) => Math.pow(1 + (FACTOR * days) / s, DECAY);

/** Interval in days for a given stability. */
export const interval = (s: number) =>
  clamp(Math.round((s / FACTOR) * (Math.pow(DESIRED_RETENTION, 1 / DECAY) - 1)), 1, MAX_INTERVAL_DAYS);

function nextDifficulty(d: number, g: Rating) {
  const d1 = d - W[6] * (g - 3) * ((10 - d) / 9);
  return clamp(W[7] * initialDifficulty(EASY) + (1 - W[7]) * d1, 1, 10);
}

function nextStability(c: Schedule, g: Rating, daysSince: number) {
  if (daysSince < 1) return c.stability * Math.exp(W[17] * (g - 3 + W[18])); // same day
  const r = retrievability(daysSince, c.stability);
  if (g === AGAIN) {
    return Math.min(c.stability, W[11] * Math.pow(c.difficulty, -W[12]) * (Math.pow(c.stability + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r)));
  }
  const factor = g === HARD ? W[15] : g === EASY ? W[16] : 1;
  return c.stability * (1 + Math.exp(W[8]) * (11 - c.difficulty) * Math.pow(c.stability, -W[9]) * (Math.exp(W[10] * (1 - r)) - 1) * factor);
}

/** Memory state (stability, difficulty) after a rating, without scheduling. */
function memory(c: Schedule, g: Rating, now: number) {
  if (c.state === "new") return { stability: initialStability(g), difficulty: initialDifficulty(g) };
  const daysSince = dayNumber(now) - dayNumber(c.lastReview ?? 0);
  return { stability: nextStability(c, g, daysSince), difficulty: nextDifficulty(c.difficulty, g) };
}

/** Schedules a card after it was rated `g` at time `now`. */
export function schedule(previous: Partial<Schedule> | null | undefined, g: Rating, now: number): Schedule {
  const c: Schedule = { ...NEW_CARD, ...previous };
  const { stability, difficulty } = memory(c, g, now);
  const next: Schedule = { ...c, stability, difficulty, lastReview: now, reps: c.reps + 1 };
  const inMinutes = (m: number): Schedule => ({ ...next, due: now + Math.round(m) * MINUTE });
  const inDays = (days: number): Schedule => ({ ...next, state: "review", step: 0, due: now + days * DAY });

  if (c.state === "new" || c.state === "learning") {
    const step = c.state === "new" ? 0 : c.step;
    const learning: Schedule = { ...next, state: "learning" };
    if (g === AGAIN) return { ...learning, step: 0, due: now + LEARNING_STEPS[0]! * MINUTE };
    if (g === HARD) {
      const m = step === 0 && LEARNING_STEPS.length > 1 ? (LEARNING_STEPS[0]! + LEARNING_STEPS[1]!) / 2 : LEARNING_STEPS[step]!;
      return { ...learning, step, due: now + Math.round(m) * MINUTE };
    }
    if (g === GOOD && step + 1 < LEARNING_STEPS.length) {
      return { ...learning, step: step + 1, due: now + LEARNING_STEPS[step + 1]! * MINUTE };
    }
    return inDays(interval(stability));
  }

  if (c.state === "relearning") {
    if (g === AGAIN) return { ...inMinutes(RELEARNING_STEPS[0]!), step: 0 };
    if (g === HARD) return inMinutes(RELEARNING_STEPS[0]! * 1.5);
    return inDays(interval(stability));
  }

  // review
  if (g === AGAIN) {
    return { ...inMinutes(RELEARNING_STEPS[0]!), state: "relearning", step: 0, lapses: c.lapses + 1 };
  }
  // Like Anki: Hard <= Good < Easy
  let hard = interval(memory(c, HARD, now).stability);
  let good = interval(memory(c, GOOD, now).stability);
  let easy = interval(memory(c, EASY, now).stability);
  hard = Math.min(hard, good);
  good = Math.max(good, hard + 1);
  easy = Math.max(easy, good + 1);
  const byRating: Record<number, number> = { [HARD]: hard, [GOOD]: good, [EASY]: easy };
  return inDays(byRating[g]!);
}

/** For the rating buttons: in how many ms would the card come back for each rating? */
export function previewIntervals(c: Partial<Schedule> | null | undefined, now: number): number[] {
  return RATINGS.map((g) => schedule(c, g, now).due - now);
}

const UNITS = {
  de: { min: "Min.", hour: "Std.", day: "Tag", days: "Tage", month: "Mon.", year: "J.", decimal: "," },
  en: { min: "min", hour: "h", day: "day", days: "days", month: "mo", year: "yr", decimal: "." },
};

/** Short interval label for the rating buttons, e.g. "10 Min." or "2.5 mo". */
export function formatInterval(ms: number, locale: string = "de"): string {
  const u = UNITS[locale as keyof typeof UNITS] ?? UNITS.de;
  const num = (x: number) => x.toFixed(1).replace(".", u.decimal).replace(`${u.decimal}0`, "");
  const min = Math.round(ms / MINUTE);
  if (min < 1) return `< 1 ${u.min}`;
  if (min < 60) return `${min} ${u.min}`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `${hours} ${u.hour}`;
  const days = Math.round(ms / DAY);
  if (days < 30) return `${days} ${days === 1 ? u.day : u.days}`;
  const months = days / 30.4;
  if (months < 12) return `${num(months)} ${u.month}`;
  return `${num(days / 365)} ${u.year}`;
}
