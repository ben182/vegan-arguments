<script setup lang="ts">
// The "checked" date as a calibration sticker, like the ones on lab equipment.
const props = defineProps<{ date: string }>();

const t = useTexts();
const evidence = useEvidence();
const short = computed(() => evidence.value.shortDate(props.date));
</script>

<template>
  <p class="sticker">
    <span class="sticker-title">{{ t.stickerTitle }}</span>
    <time class="sticker-date" :datetime="date">{{ short }}</time>
    <span class="sticker-note">{{ t.stickerNote }}</span>
  </p>
</template>
