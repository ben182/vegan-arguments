<script setup lang="ts">
import type { Card, CategoryId } from "#shared/types/cards";
import { uniqueSources } from "#shared/evidence";

// Look up: opens with every source of the deck as a chart, then the searchable, filterable list.
const t = useTexts();
const deck = useDeck();
const evidence = useEvidence();
const cardStatus = useCardStatus();

usePageSeo(() => ({
  path: (tt) => tt.homePath,
  title: t.value.title,
  description: t.value.description,
  ogType: "website",
  ogTitle: t.value.title,
}));

// Kept while navigating, like the filter and search box of the original single-page app
const filter = useState<CategoryId | null>("browse-filter", () => null);
const query = useState("browse-query", () => "");

const results = computed(() => {
  const q = normalizeForSearch(query.value.trim());
  const order = deck.value.categoryIds;
  return deck.value.cards
    .filter((c) =>
      (!filter.value || c.category === filter.value)
      && (!q || normalizeForSearch([c.argument, c.answer, c.figure?.text ?? "", ...(c.points || [])].join(" ")).includes(q)),
    )
    .sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
});

const chartLabel = computed(() => {
  const e = evidence.value;
  return `${t.value.chartLabel(e.sources.length, e.axis.from, e.axis.to)}. ${e.summary(e.sources)}`;
});

const sourceCount = (c: Card) => uniqueSources(c.sources || []).length;
</script>

<template>
  <main id="main" tabindex="-1">
    <section class="hero">
      <div class="hero-text">
        <h1>{{ t.heroTitle(deck.cards.length, evidence.sources.length) }}</h1>
        <p class="hero-sub">{{ t.heroText(evidence.recent) }} {{ evidence.checkedText }}</p>
      </div>
      <figure class="hero-chart">
        <EvidenceBar class="chart-wide" :sources="evidence.sources" :width="760" :r="4.2" large :label="chartLabel" />
        <EvidenceBar class="chart-narrow" :sources="evidence.sources" :width="358" :r="4.2" large :label="chartLabel" />
        <figcaption>
          <span>{{ t.chartCaption }}</span>
          <EvidenceLegend />
        </figcaption>
      </figure>
    </section>

    <section class="finder" :aria-label="t.searchLabel">
      <label class="search-field">
        <svg aria-hidden="true" viewBox="0 0 20 20" width="20" height="20"><circle cx="8.5" cy="8.5" r="5.5" /><path d="m13 13 4.5 4.5" /></svg>
        <input v-model="query" type="search" :placeholder="t.searchPlaceholder" autocomplete="off" :aria-label="t.searchLabel">
      </label>
      <CategoryTabs :label="t.filterLabel" with-all :is-pressed="(c) => (filter || '') === c" @select="(c) => (filter = c || null)" />
    </section>

    <section :aria-label="t.navLookUp">
      <div class="table-head" aria-hidden="true">
        <span>{{ t.columnArgument }}</span><span>{{ t.columnFigure }}</span><span>{{ t.columnEvidence }}</span>
      </div>
      <ol class="rows">
        <li v-for="card in results" :key="card.id" class="row">
          <NuxtLink class="row-link" :to="t.cardPath(card.id)">
            <span class="row-main">
              <span class="row-topic">{{ deck.categoryName(card.category) }}<span v-if="cardStatus(card.id)" class="status">{{ cardStatus(card.id) }}</span></span>
              <span class="row-argument">{{ stripQuotes(card.argument) }}</span>
            </span>
            <span class="row-figure">
              <template v-if="card.figure"><b>{{ card.figure.value }}</b><small>{{ card.figure.text }}</small></template>
              <span v-else class="no-figure">{{ t.noFigure }}</span>
            </span>
            <span class="row-evidence">
              <EvidenceBar v-if="card.sources?.length" :sources="card.sources" :width="300" :r="3.8" decorative />
              <small>{{ t.rowEvidence(sourceCount(card), !!card.concession) }}</small>
            </span>
          </NuxtLink>
        </li>
      </ol>
      <p class="empty" :hidden="results.length > 0"><span>{{ t.emptyText }}</span> <a class="text-button" :href="suggestArgumentLink(query.trim())" target="_blank" rel="noopener">{{ t.emptyLink }}</a>.</p>
    </section>
  </main>
</template>
