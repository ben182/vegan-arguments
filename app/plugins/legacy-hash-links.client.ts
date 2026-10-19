import { TEXTS } from "#shared/texts";

// Old links used hash routes (#karte/<id>, #ueben). Redirect them to the real addresses.
export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter();

  function redirect() {
    const t = TEXTS[nuxtApp.$i18n.locale.value === "en" ? "en" : "de"];
    const hash = window.location.hash;
    if (hash.startsWith("#karte/")) return router.replace(t.cardPath(hash.slice("#karte/".length)));
    if (hash === "#ueben") return router.replace(t.practicePath);
  }

  window.addEventListener("hashchange", redirect);
  onNuxtReady(redirect);
});
