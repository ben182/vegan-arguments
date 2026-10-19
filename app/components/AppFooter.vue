<script setup lang="ts">
const t = useTexts();
</script>

<template>
  <footer class="site-footer">
    <p><span>{{ t.footerText }}</span> <a class="text-button" :href="suggestArgumentLink()" target="_blank" rel="noopener">{{ t.suggestArgument }}</a></p>
  </footer>
</template>
