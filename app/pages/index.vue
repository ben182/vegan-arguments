<script setup lang="ts">
import type { Card, CategoryId } from "#shared/types/cards";

// Look up: all arguments, grouped by category, with search and a category filter.
const t = useTexts();
const deck = useDeck();
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
  return deck.value.cards.filter((c) =>
    (!filter.value || c.category === filter.value)
    && (!q || normalizeForSearch([c.argument, c.answer, ...(c.points || [])].join(" ")).includes(q)),
  );
});

const groups = computed(() =>
  deck.value.categoryIds
    .map((category) => ({ category, cards: results.value.filter((c) => c.category === category) }))
    .filter((g) => g.cards.length),
);

const inventory = computed(() =>
  t.value.inventory(deck.value.cards.length, new Set(deck.value.cards.flatMap((c) => (c.sources || []).map((s) => s.url))).size),
);

const sourceCount = (c: Card) => c.sources?.length || 0;
</script>

<template>
  <main>
    <section class="view">
      <div class="intro">
        <h1>{{ t.introTitle }}</h1>
        <p>{{ t.introText }}</p>
        <p class="inventory">{{ inventory }}</p>
      </div>
      <div class="toolbar">
        <label class="search-field">
          <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2" /><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
          <input v-model="query" type="search" :placeholder="t.searchPlaceholder" autocomplete="off" :aria-label="t.searchLabel">
        </label>
        <CategoryTabs :label="t.filterLabel" with-all :is-pressed="(c) => (filter || '') === c" @select="(c) => (filter = c || null)" />
      </div>
      <div class="list">
        <section v-for="(group, gi) in groups" :key="group.category" class="group" :style="{ '--hue': categoryHue(group.category) }" :aria-labelledby="`g-${group.category}`">
          <h2 :id="`g-${group.category}`" class="group-title"><span class="dot" aria-hidden="true" />{{ deck.categoryName(group.category) }}<span class="count">{{ t.argumentCount(group.cards.length) }}</span></h2>
          <div v-if="gi === 0" class="column-header" aria-hidden="true"><span>{{ t.columnTheySay }}</span><span>{{ t.columnYouAnswer }}</span></div>
          <ul class="rows">
            <li v-for="card in group.cards" :key="card.id">
              <NuxtLink class="row" :to="t.cardPath(card.id)">
                <span class="row-argument">{{ stripQuotes(card.argument) }}</span>
                <span class="row-answer">{{ card.answer }}</span>
                <span class="row-meta"><span v-if="sourceCount(card)" class="source-count">{{ t.sourceCount(sourceCount(card)) }}</span><span v-if="cardStatus(card.id)" class="status">{{ cardStatus(card.id) }}</span></span>
              </NuxtLink>
            </li>
          </ul>
        </section>
      </div>
      <p class="empty" :hidden="results.length > 0"><span>{{ t.emptyText }}</span> <a class="text-button" :href="suggestArgumentLink(query.trim())" target="_blank" rel="noopener">{{ t.emptyLink }}</a>.</p>
    </section>
  </main>
</template>
