<script setup lang="ts">
import type { Card } from "#shared/types/cards";

defineProps<{ card: Card }>();
</script>

<template>
  <p v-if="card.figure" class="figure"><strong class="figure-value">{{ card.figure.value }}</strong><span class="figure-text">{{ card.figure.text }}</span></p>
</template>
