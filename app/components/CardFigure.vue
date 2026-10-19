<script setup lang="ts">
import type { Card } from "#shared/types/cards";

defineProps<{ card: Card }>();
</script>

<template>
  <p v-if="card.figure" class="figure"><strong>{{ card.figure.value }}</strong><span>{{ card.figure.text }}</span></p>
</template>
