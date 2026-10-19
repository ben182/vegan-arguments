import { TEXTS, type Texts } from "#shared/texts";

interface PageSeo {
  /** Path of this page in a given language, e.g. (t) => t.practicePath. */
  path: (t: Texts) => string;
  title: string;
  description: string;
  ogType: "website" | "article";
  ogTitle: string;
  /** Card pages also set og:url and a Twitter card, like before. */
  withUrl?: boolean;
}

/** Title, description, Open Graph, canonical and hreflang alternates (de, en, x-default). */
export function usePageSeo(seo: () => PageSeo) {
  const t = useTexts();
  const siteUrl = useRuntimeConfig().public.siteUrl;

  useHead(() => {
    const s = seo();
    return {
      link: [
        { rel: "canonical", href: siteUrl + s.path(t.value) },
        ...(["de", "en"] as const).map((l) => ({ rel: "alternate" as const, hreflang: l, href: siteUrl + s.path(TEXTS[l]) })),
        { rel: "alternate", hreflang: "x-default", href: siteUrl + s.path(TEXTS.de) },
      ],
    };
  });

  useSeoMeta({
    title: () => seo().title,
    description: () => seo().description,
    ogType: () => seo().ogType,
    ogSiteName: () => t.value.brand,
    ogLocale: () => t.value.locale.replace("-", "_"),
    ogUrl: () => (seo().withUrl ? siteUrl + seo().path(t.value) : undefined),
    ogTitle: () => seo().ogTitle,
    ogDescription: () => seo().description,
    twitterCard: () => (seo().withUrl ? "summary" : undefined),
  });
}
