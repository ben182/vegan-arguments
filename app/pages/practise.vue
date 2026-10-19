<script setup lang="ts">
import * as fsrs from "#shared/fsrs";
import { countsOf } from "~/composables/usePracticeSession";

// Practise like in Anki: start screen, flashcard with ratings, "done for today".
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
const answer = computed(() => (state.value.answerId ? deck.value.byId[state.value.answerId] : undefined));

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
  <main>
    <section class="view">
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

      <div class="practice-card" :hidden="state.phase !== 'card'">
        <dl class="counters compact"><QueueCounters :counts="state.counts" :current="state.currentKind" /></dl>
        <article class="flashcard" :class="{ revealed: state.revealed }" :style="current ? { '--hue': categoryHue(current.category) } : undefined" @click="onCardClick">
          <div class="fc-front">
            <p class="fc-topic"><span class="dot" aria-hidden="true" /><span>{{ current ? deck.categoryName(current.category) : "" }}</span></p>
            <p class="fc-says">{{ t.someoneSays }}</p>
            <p class="fc-argument">{{ current ? stripQuotes(current.argument) : "" }}</p>
          </div>
          <div class="fc-back">
            <p class="fc-you">{{ t.youAnswer }}</p>
            <p class="fc-answer">{{ answer?.answer }}</p>
            <div><CardFigure v-if="answer" :card="answer" /></div>
            <button class="text-button" @click.stop="manualCardId = state.currentId">{{ t.readFullCard }}</button>
          </div>
        </article>
        <div id="reveal-row" class="button-row centered" :hidden="state.revealed">
          <button id="reveal-button" class="button primary" @click="reveal"><span>{{ t.showAnswer }}</span> <kbd>{{ t.spaceKey }}</kbd></button>
        </div>
        <div class="rating" :hidden="!state.revealed">
          <p class="rating-question">{{ t.rateQuestion }}</p>
          <div class="rating-buttons">
            <button v-for="(r, i) in ratings" :key="r.value" class="rate" :class="r.cls" @click="rate(r.value)">
              <span class="rate-name">{{ r.name }}</span><small>{{ state.intervals[i] }}</small><kbd>{{ r.value }}</kbd>
            </button>
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
