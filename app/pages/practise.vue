<script setup lang="ts">
import * as fsrs from "#shared/fsrs";
import { uniqueSources } from "#shared/evidence";
import { countsOf } from "~/composables/usePracticeSession";

// Practise like in Anki: start screen, flashcard with ratings, "done for today".
// The card reads as a conversation: what they say, then your answer and your counter-question.
definePageMeta({
  i18n: { paths: { de: "/ueben", en: "/practise" } },
});

const t = useTexts();
const deck = useDeck();
const progress = useProgress();
const { queue, nextCard, isSelected, toggleCategory } = useReviewQueue();
const { state, start, reveal, rate, moreNewCards, enterPage } = usePracticeSession();
const { manualCardId } = useNuxtApp().$cardPanel;

usePageSeo(() => ({
  path: (tt) => tt.practicePath,
  title: t.value.title,
  description: t.value.description,
  ogType: "website",
  ogTitle: t.value.title,
}));

enterPage();

// Start screen: counts and button depend on the stored progress, so only once it is loaded
const startCounts = computed(() => (progress.ready.value ? countsOf(queue(Date.now())) : null));
const nothingToDo = computed(() => progress.ready.value && !nextCard(Date.now()));

const current = computed(() => (state.value.currentId ? deck.value.byId[state.value.currentId] : undefined));
const evidence = useEvidence();
const cardStatus = useCardStatus();

const preview = computed(() => {
  const c = current.value;
  return c ? t.value.backPreview({ figure: !!c.figure, sources: uniqueSources(c.sources || []).length, concession: !!c.concession }) : "";
});

const ratings = computed(() => [
  { value: fsrs.AGAIN, name: t.value.again, cls: "again" },
  { value: fsrs.HARD, name: t.value.hard, cls: "hard" },
  { value: fsrs.GOOD, name: t.value.good, cls: "good" },
  { value: fsrs.EASY, name: t.value.easy, cls: "easy" },
] as const);

function resetProgress() {
  if (!confirm(t.value.resetConfirm)) return;
  progress.reset();
}

function onCardClick() {
  if (!state.value.revealed) reveal();
}

// Keyboard like in Anki: Space/Enter reveals, 1–4 rate, Space rates "Good" once revealed
function onKeydown(e: KeyboardEvent) {
  if (state.value.phase !== "card" || manualCardId.value || e.metaKey || e.ctrlKey) return;
  if ((e.key === " " || e.key === "Enter") && !state.value.revealed) {
    e.preventDefault();
    reveal();
  } else if (["1", "2", "3", "4"].includes(e.key)) {
    rate(Number(e.key) as fsrs.Rating);
  } else if (e.key === " " && state.value.revealed) {
    e.preventDefault();
    rate(fsrs.GOOD);
  }
}
onMounted(() => document.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => document.removeEventListener("keydown", onKeydown));
</script>

<template>
  <main id="main" tabindex="-1">
    <section class="practice">
      <div class="practice-text" :hidden="state.phase !== 'start'">
        <h1>{{ t.practiseTitle }}</h1>
        <p>{{ t.practiseText }}</p>
        <h2 class="field-title">{{ t.practiseTopics }}</h2>
        <CategoryTabs :label="t.practiseFilterLabel" :is-pressed="(c) => c !== '' && isSelected(c)" @select="(c) => c && toggleCategory(c)" />
        <dl class="counters"><QueueCounters v-if="startCounts" :counts="startCounts" /></dl>
        <div class="button-row">
          <button class="button primary" :disabled="nothingToDo" @click="start">{{ nothingToDo ? t.nothingToPractise : t.startPractising }}</button>
        </div>
        <details class="explainer">
          <summary>{{ t.explainTitle }}</summary>
          <p>{{ t.explainText }}</p>
          <button class="text-button" @click="resetProgress">{{ t.resetProgress }}</button>
        </details>
      </div>

      <div class="practice-session" :hidden="state.phase !== 'card'">
        <header class="practice-head">
          <h1>{{ t.navPractise }}</h1>
          <dl class="counters compact"><QueueCounters :counts="state.counts" :current="state.currentKind" /></dl>
        </header>

        <article v-if="current" class="practice-card" :class="{ revealed: state.revealed }" @click="onCardClick">
          <div class="turn them">
            <p class="speaker">{{ t.speakerThem }}</p>
            <div>
              <p class="turn-topic">{{ deck.categoryName(current.category) }}<span v-if="cardStatus(current.id)" class="status">{{ cardStatus(current.id) }}</span></p>
              <p class="argument">{{ stripQuotes(current.argument) }}</p>
            </div>
          </div>

          <div v-if="!state.revealed" class="turn you pending">
            <p class="speaker">{{ t.speakerYou }}</p>
            <div>
              <p class="hint">{{ t.frontHint }}</p>
              <p v-if="preview" class="preview">{{ preview }}</p>
            </div>
          </div>

          <div v-else class="practice-back">
            <div class="back-dialog">
              <div class="turn you">
                <p class="speaker">{{ t.speakerYou }}</p>
                <div>
                  <p class="answer-text">{{ current.answer }}</p>
                  <SpeakingTime :text="current.answer" />
                </div>
              </div>
              <div v-if="current.counterQuestion" class="turn ask">
                <p class="speaker">{{ t.speakerAskBack }}</p>
                <p class="counter-text">{{ current.counterQuestion }}</p>
              </div>
              <div v-if="current.concession" class="concession small">
                <h2>{{ t.concedeShort }}</h2>
                <p>{{ current.concession }}</p>
              </div>
            </div>
            <div class="back-evidence">
              <CardFigure :card="current" />
              <template v-if="current.sources?.length">
                <EvidenceBar :sources="current.sources" :width="300" :r="5" />
                <p class="back-sources">{{ t.backSources(uniqueSources(current.sources).length, evidence.longDate(current.checked)) }}</p>
              </template>
              <button class="text-button" @click.stop="manualCardId = state.currentId">{{ t.readFullCard }}</button>
            </div>
          </div>
        </article>

        <div class="practice-actions">
          <button v-if="!state.revealed" class="reveal-button" @click="reveal"><span>{{ t.showAnswer }}</span> <kbd>{{ t.spaceKey }}</kbd></button>
          <div v-else class="rating">
            <p id="rating-question" class="rating-question">{{ t.rateQuestion }}</p>
            <div class="rating-buttons" role="group" aria-labelledby="rating-question">
              <button v-for="(r, i) in ratings" :key="r.value" class="rate" :class="r.cls" @click="rate(r.value)">
                <span class="rate-name">{{ r.name }}</span><span class="rate-interval">{{ state.intervals[i] }}</span><kbd>{{ r.value }}</kbd>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="practice-text done" :hidden="state.phase !== 'done'">
        <p class="done-mark" aria-hidden="true">✓</p>
        <h1>{{ t.doneTitle }}</h1>
        <p>{{ state.doneText }}</p>
        <div class="button-row">
          <button class="button primary" :hidden="!state.showMoreNew" @click="moreNewCards">{{ t.moreNewCards }}</button>
          <NuxtLink :to="t.homePath" class="button">{{ t.backToLookUp }}</NuxtLink>
        </div>
      </div>
    </section>
  </main>
</template>
