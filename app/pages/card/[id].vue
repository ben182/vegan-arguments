<script setup lang="ts">
// A card on its own page: what a direct visit, a search engine or a shared link gets.
// Opened from inside the app, the same card shows up in the side panel instead (CardPanel).
definePageMeta({
  i18n: { paths: { de: "/karte/[id]", en: "/card/[id]" } },
});

const t = useTexts();
const deck = useDeck();
const route = useRoute();

const card = computed(() => deck.value.byId[String(route.params.id)]);
if (!card.value) throw createError({ statusCode: 404, statusMessage: "Card not found", fatal: true });

const related = computed(() => deck.value.cards.filter((c) => c.category === card.value?.category && c.id !== card.value?.id));

usePageSeo(() => {
  const c = card.value!;
  return {
    path: (tt) => tt.cardPath(c.id),
    title: `${t.value.pageTitle(stripQuotes(c.argument).replace(/[.!]$/, ""))} | ${t.value.brand}`,
    description: c.answer,
    ogType: "article",
    ogTitle: t.value.quote(stripQuotes(c.argument)),
    withUrl: true,
  };
});
</script>

<template>
  <main v-if="card" class="card-page">
    <article class="card-page-card">
      <CardBody :card="card" heading-tag="h1">
        <template #footer>
          <NuxtLink class="button primary" :to="t.practicePath">{{ t.practiseAnswers }}</NuxtLink>
        </template>
      </CardBody>
    </article>
    <nav v-if="related.length" class="card-page-related" aria-labelledby="related-title" :style="{ '--hue': categoryHue(card.category) }">
      <h2 id="related-title">{{ t.moreOn(deck.categoryName(card.category)) }}</h2>
      <ul>
        <li v-for="c in related" :key="c.id">
          <NuxtLink :to="t.cardPath(c.id)">{{ t.quote(stripQuotes(c.argument)) }}</NuxtLink>
        </li>
      </ul>
      <p><NuxtLink class="text-button" :to="t.homePath">{{ t.allArguments }}</NuxtLink></p>
    </nav>
  </main>
</template>
