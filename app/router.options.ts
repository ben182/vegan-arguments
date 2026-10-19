import type { RouterConfig } from "nuxt/schema";

export default {
  scrollBehavior(_to, _from, savedPosition) {
    const nuxtApp = useNuxtApp();
    // Opening or closing the card panel leaves the page underneath where it was
    if (nuxtApp.$cardPanel.wasPanelOnly()) return false;
    // Otherwise scroll once the new page has rendered: back/forward restore the old position
    return new Promise((resolve) => {
      nuxtApp.hooks.hookOnce("page:finish", () => {
        requestAnimationFrame(() => resolve(savedPosition ?? { top: 0 }));
      });
    });
  },
} satisfies RouterConfig;
