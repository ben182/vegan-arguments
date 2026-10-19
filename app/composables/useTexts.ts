import { TEXTS, type Locale, type Texts } from "#shared/texts";

/** Current locale ("de" or "en"), derived from the route by @nuxtjs/i18n. */
export function useLocaleCode(): ComputedRef<Locale> {
  const { locale } = useI18n();
  return computed(() => (locale.value === "en" ? "en" : "de"));
}

/** UI texts of the current locale. */
export function useTexts(): ComputedRef<Texts> {
  const locale = useLocaleCode();
  return computed(() => TEXTS[locale.value]);
}
