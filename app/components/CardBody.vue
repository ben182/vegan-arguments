<script setup lang="ts">
import type { Card } from "#shared/types/cards";

// The full card. Used by the card page (/karte/<id>/) and by the card panel.
const props = withDefaults(defineProps<{
  card: Card;
  /** h1 on the card page, h2 in the panel. */
  headingTag?: "h1" | "h2";
  /** Learning status (only shown in the app). */
  status?: string;
}>(), { headingTag: "h2", status: "" });

const t = useTexts();
const deck = useDeck();

const checkedMonth = computed(() =>
  new Date(`${props.card.checked}T12:00:00`).toLocaleDateString(t.value.locale, { month: "long", year: "numeric" }),
);
const hasNotes = computed(() => !!(props.card.counterQuestion || props.card.fallacy || props.card.concession));
</script>

<template>
  <div class="card-body" :style="{ '--hue': categoryHue(card.category) }">
    <header class="cb-header">
      <p class="cb-topic"><span class="dot" aria-hidden="true" />{{ deck.categoryName(card.category) }}<span v-if="status" class="status">{{ status }}</span></p>
      <p class="cb-says">{{ t.someoneSays }}</p>
      <component :is="headingTag" id="card-argument" class="cb-argument">{{ stripQuotes(card.argument) }}</component>
    </header>
    <section class="cb-answer">
      <h3>{{ t.answerTitle }}</h3>
      <p class="answer">{{ card.answer }}</p>
      <CardFigure :card="card" />
    </section>
    <section v-if="card.points?.length" class="cb-section">
      <h3>{{ t.pushBack }}</h3>
      <ul class="points">
        <li v-for="(point, i) in card.points" :key="i">{{ point }}</li>
      </ul>
    </section>
    <div v-if="hasNotes" class="notes">
      <div v-if="card.counterQuestion" class="note counter">
        <h3>{{ t.counterQuestion }}</h3>
        <p>{{ card.counterQuestion }}</p>
      </div>
      <div v-if="card.fallacy" class="note fallacy">
        <h3>{{ t.fallacy }}: {{ card.fallacy.name }}</h3>
        <p>{{ card.fallacy.explanation }}</p>
      </div>
      <div v-if="card.concession" class="note concession">
        <h3>{{ t.concede }}</h3>
        <p>{{ card.concession }}</p>
      </div>
    </div>
    <section v-if="card.sources?.length" class="cb-section">
      <h3>{{ t.sources }}</h3>
      <ol class="sources">
        <li v-for="source in card.sources" :key="source.url">
          <a :href="source.url" target="_blank" rel="noopener">{{ source.title }}</a><span class="source-meta">{{ sourceHost(source.url) }}{{ source.year && !source.title.includes(String(source.year)) ? `, ${source.year}` : "" }}</span>
        </li>
      </ol>
      <p v-if="card.checked" class="checked">{{ t.checked(checkedMonth) }}</p>
    </section>
    <div class="cb-footer">
      <slot name="footer" />
      <a class="text-button" :href="reportErrorLink(card)" target="_blank" rel="noopener">{{ t.reportError }}</a>
    </div>
  </div>
</template>
