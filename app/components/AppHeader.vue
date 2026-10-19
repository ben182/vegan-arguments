<script setup lang="ts">
import { TEXTS } from "#shared/texts";
import { isCardRoute } from "~/plugins/card-panel";

const props = defineProps<{
  /** Section to highlight in the navigation; none on card pages and the error page. */
  active?: "browse" | "practise" | null;
  /** Show the number of due cards next to "Üben" (only inside the app views). */
  showDueCount?: boolean;
  /** Hide the language switch (error page). */
  hideLanguageSwitch?: boolean;
}>();

const t = useTexts();
// Not useRoute(): outside of pages it only updates once a new page has rendered
const route = useRouter().currentRoute;
const { ready } = useProgress();
const { queue } = useReviewQueue();

// Same view in the other language: card -> card, practice -> practice, otherwise start page
const otherLanguageHref = computed(() => {
  const other = TEXTS[t.value.otherLocale === "en" ? "en" : "de"];
  if (isCardRoute(route.value)) return other.cardPath(String(route.value.params.id));
  if (props.active === "practise") return other.practicePath;
  return other.homePath;
});

const dueCount = computed(() => {
  if (!ready.value || !props.showDueCount) return 0;
  const q = queue(Date.now());
  return q.learningSoon.length + q.review.length;
});
</script>

<template>
  <header class="site-header">
    <div class="site-header-inner">
      <NuxtLink class="brand" :to="t.homePath">
        <svg class="brand-mark" viewBox="0 0 28 28" aria-hidden="true"><path d="M3 21h22M7 21v-4M12 21v-8M17 21v-12M22 21v-6" /><circle cx="17" cy="6" r="2.4" /></svg>
        <span>{{ t.brand }}</span>
      </NuxtLink>
      <nav class="view-switch" :aria-label="t.navLabel">
        <NuxtLink :to="t.homePath" :class="{ active: active === 'browse' }" :aria-current="active === 'browse' ? 'page' : undefined">{{ t.navLookUp }}</NuxtLink>
        <NuxtLink :to="t.practicePath" :class="{ active: active === 'practise' }" :aria-current="active === 'practise' ? 'page' : undefined">
          <span>{{ t.navPractise }}</span>
          <span v-if="showDueCount" class="due-count" :hidden="dueCount === 0">{{ dueCount || "" }}</span>
        </NuxtLink>
      </nav>
      <!-- A full page load on purpose: the other language is a separate app with its own cards -->
      <a
        v-if="!hideLanguageSwitch"
        class="language-switch"
        :href="otherLanguageHref"
        :hreflang="t.otherLocale"
        :lang="t.otherLocale"
        :aria-label="t.otherLanguage"
      >{{ t.otherLanguageShort }}</a>
    </div>
  </header>
</template>
