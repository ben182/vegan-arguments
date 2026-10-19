<script setup lang="ts">
import type { Card } from "#shared/types/cards";

// The full card: the answer first, then what you should concede, then the follow-ups; the evidence
// sits in its own column. Used by the card page (/karte/<id>/) and by the card panel.
const props = withDefaults(defineProps<{
  card: Card;
  /** h1 on the card page, h2 in the panel. */
  headingTag?: "h1" | "h2";
  /** Learning status (only shown in the app). */
  status?: string;
  /** Category line above the argument (the card page shows it in the breadcrumb instead). */
  showTopic?: boolean;
}>(), { headingTag: "h2", status: "", showTopic: true });

const t = useTexts();
const deck = useDeck();

const sub = computed(() => (props.headingTag === "h1" ? "h2" : "h3"));
</script>

<template>
  <div class="card-body">
    <header class="cb-header">
      <p v-if="showTopic || status" class="cb-topic">
        <span v-if="showTopic">{{ deck.categoryName(card.category) }}</span><span v-if="status" class="status">{{ status }}</span>
      </p>
      <p class="says">{{ t.someoneSays }}</p>
      <component :is="headingTag" id="card-argument" class="argument">{{ stripQuotes(card.argument) }}</component>
    </header>

    <div class="cb-columns">
      <div class="cb-text">
        <section class="cb-block">
          <component :is="sub">{{ t.answerTitle }}</component>
          <p class="answer-text">{{ card.answer }}</p>
          <SpeakingTime :text="card.answer" />
        </section>

        <CardFigure :card="card" />

        <section v-if="card.concession" class="cb-block concession">
          <component :is="sub">{{ t.concede }}</component>
          <p>{{ card.concession }}</p>
        </section>

        <section v-if="card.points?.length" class="cb-block">
          <component :is="sub">{{ t.pushBack }}</component>
          <ul class="points">
            <li v-for="(point, i) in card.points" :key="i">{{ point }}</li>
          </ul>
        </section>

        <section v-if="card.counterQuestion" class="cb-block counter-question">
          <component :is="sub">{{ t.counterQuestion }}</component>
          <p>{{ card.counterQuestion }}</p>
        </section>

        <section v-if="card.fallacy" class="cb-block fallacy">
          <component :is="sub">{{ t.fallacy }}: {{ card.fallacy.name }}</component>
          <p>{{ card.fallacy.explanation }}</p>
        </section>
      </div>

      <aside v-if="card.sources?.length" class="evidence" :aria-labelledby="`evidence-${card.id}`">
        <div class="evidence-head">
          <component :is="sub" :id="`evidence-${card.id}`">{{ t.evidenceTitle }}</component>
          <CheckedSticker v-if="card.checked" :date="card.checked" />
        </div>
        <EvidenceBar :sources="card.sources" :width="380" :r="5" />
        <SourceList :sources="card.sources" />
      </aside>
    </div>

    <div class="cb-footer">
      <slot name="footer" />
      <a class="text-button" :href="reportErrorLink(card)" target="_blank" rel="noopener">{{ t.reportError }}</a>
    </div>
  </div>
</template>
