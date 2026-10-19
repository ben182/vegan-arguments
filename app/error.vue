<script setup lang="ts">
import type { NuxtError } from "#app";

// Error page, also prerendered as 404.html. The text is bilingual, like before.
defineProps<{ error: NuxtError }>();

const t = useTexts();

useHead({
  htmlAttrs: { lang: "de" },
  title: `Seite nicht gefunden | ${t.value.brand}`,
  meta: [{ name: "robots", content: "noindex" }],
});
</script>

<template>
  <AppHeader hide-language-switch />
  <main class="card-page">
    <div class="practice-text">
      <h1>Diese Seite gibt es nicht</h1>
      <p>Vielleicht ist der Link veraltet oder hat einen Tippfehler. Alle Argumente findest du auf der Startseite.</p>
      <p lang="en">This page doesn’t exist. You can find all arguments on the start page.</p>
      <div class="button-row">
        <a class="button primary" href="/">Zu allen Argumenten</a><a class="button" href="/en/" lang="en">All arguments in English</a>
      </div>
    </div>
  </main>
</template>
