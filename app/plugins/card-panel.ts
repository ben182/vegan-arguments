import type { RouteLocationNormalized } from "vue-router";

/** Card pages are /karte/<id>/ and /en/card/<id>/ (route names "card-id___<locale>"). */
export const isCardRoute = (route: Pick<RouteLocationNormalized, "name">) =>
  typeof route.name === "string" && route.name.startsWith("card-id");

/**
 * Card panel ("modal route"): opening a card from a page inside the app keeps that page
 * rendered underneath (the "background route") and shows the card in a side panel, while the
 * URL changes to the card's own address. Visiting a card URL directly renders the card page.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter();
  /** The page shown underneath the panel; null when no card is open in the panel. */
  const background = shallowRef<RouteLocationNormalized | null>(null);
  /** Card opened without changing the URL (from the practice page). */
  const manualCardId = ref<string | null>(null);
  /** Whether the last navigation only opened or closed the panel (then the page keeps its scroll position). */
  let panelOnly = false;

  router.afterEach((to, from, failure) => {
    // The panel only opens on navigations inside the running app: never while rendering on the
    // server (where the initial navigation can come from "/") or for the initial client route.
    if (failure || import.meta.server || nuxtApp.isHydrating) return;
    manualCardId.value = null;
    const toCard = isCardRoute(to);
    const fromCard = isCardRoute(from);
    panelOnly = false;
    if (toCard && !fromCard && from.matched.length > 0) {
      background.value = from;
      panelOnly = true;
    } else if (toCard && background.value) {
      panelOnly = true;
    } else if (!toCard) {
      panelOnly = fromCard && background.value !== null;
      background.value = null;
    }
  });

  return {
    provide: {
      cardPanel: { background, manualCardId, wasPanelOnly: () => panelOnly },
    },
  };
});
