// Loads the stored practice progress after hydration, so the server-rendered markup
// (which knows nothing about localStorage) hydrates without mismatches.
export default defineNuxtPlugin(() => {
  const { load } = useProgress();
  onNuxtReady(load);
});
