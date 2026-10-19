<script setup lang="ts">
import { webManifestPath } from "#shared/site";
import { isCardRoute } from "~/plugins/card-panel";

const locale = useLocaleCode();
// The router's current route: useRoute() outside of pages only updates once a new page has rendered,
// which does not happen when only the card panel opens
const route = useRouter().currentRoute;
const { background } = useNuxtApp().$cardPanel;

// The cards of this language are needed by every page
await loadDeck(locale.value);

useHead(() => ({
  htmlAttrs: { lang: locale.value },
  link: [{ rel: "manifest", href: webManifestPath(locale.value) }],
}));

// The page that is rendered: the page underneath the card panel, or the current route
const pageRoute = computed(() => background.value ?? route.value);
/** A card visited directly: its own page, without app navigation state or footer. */
const isCardPage = computed(() => isCardRoute(pageRoute.value));
const activeSection = computed(() => {
  if (isCardPage.value) return null;
  return String(pageRoute.value.name ?? "").startsWith("practise") ? "practise" : "browse";
});
</script>

<template>
  <AppHeader :active="activeSection" :show-due-count="!isCardPage" />
  <NuxtPage :route="background ?? undefined" />
  <AppFooter v-if="!isCardPage" />
  <CardPanel />
</template>
