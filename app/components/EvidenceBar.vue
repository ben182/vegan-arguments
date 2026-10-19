<script setup lang="ts">
import { timelineMarkers } from "#shared/evidence";
import type { Source } from "#shared/types/cards";

// The evidence timeline ("Belegleiste"): every source is a mark in its year of publication, stacked
// when years repeat, the shape tells its kind. The axis ends in the yellow "checked" mark.
const props = withDefaults(defineProps<{
  sources: Source[];
  /** Width of the drawing in SVG units (it scales to the container). */
  width?: number;
  /** Radius of a mark. */
  r?: number;
  /** Large variant: a labelled year every five years instead of every ten. */
  large?: boolean;
  /** Text alternative; defaults to a summary of the sources. */
  label?: string;
  /** Hidden from assistive technology, when the same information is written next to it. */
  decorative?: boolean;
}>(), { width: 300, r: 4, large: false, label: "", decorative: false });

const t = useTexts();
const evidence = useEvidence();

const LEFT = 6;
const round = (n: number) => Math.round(n * 10) / 10;
const TOP = 6;

const drawing = computed(() => {
  const axis = evidence.value.axis;
  const right = props.large ? 58 : 54;
  const span = props.width - LEFT - right;
  const x = (year: number) => LEFT + ((year - axis.from) / (axis.to - axis.from)) * span;
  const markers = timelineMarkers(props.sources, axis);
  const maxStack = Math.max(1, ...markers.map((m) => m.level + 1));
  const step = props.r * 2 + 1.5;
  const axisY = round(TOP + maxStack * step + 4);
  const height = axisY + (props.large ? 26 : 22);
  // Ticks as two paths (short every year, long every five years): keeps the prerendered HTML small
  let shortTicks = "";
  let longTicks = "";
  const labels: { year: number; x: number }[] = [];
  for (let year = axis.from; year <= axis.to; year++) {
    const long = year % 5 === 0;
    const tx = round(x(year));
    if (long) longTicks += `M${tx} ${axisY}v6`;
    else shortTicks += `M${tx} ${axisY}v3`;
    if (props.large ? long : year % 10 === 0) labels.push({ year, x: tx });
  }
  return {
    height: round(height),
    axisY: round(axisY),
    checkX: props.width - right + 10,
    stampWidth: right - 14,
    shortTicks,
    longTicks,
    labels,
    marks: markers.map((m) => ({ kind: m.kind, cx: round(x(m.year)), cy: round(axisY - 4 - m.level * step - props.r) })),
  };
});

const ariaLabel = computed(() => props.label || evidence.value.summary(props.sources));
</script>

<template>
  <svg
    class="evidence-bar"
    :class="{ large }"
    :viewBox="`0 0 ${width} ${drawing.height}`"
    :role="decorative ? undefined : 'img'"
    :aria-label="decorative ? undefined : ariaLabel"
    :aria-hidden="decorative ? 'true' : undefined"
  >
    <line class="axis" :x1="LEFT" :x2="drawing.checkX" :y1="drawing.axisY" :y2="drawing.axisY" />
    <path class="tick" :d="drawing.shortTicks" />
    <path class="tick long" :d="drawing.longTicks" />
    <text v-for="tick in drawing.labels" :key="tick.year" class="year" :x="tick.x" :y="drawing.axisY + (large ? 20 : 17)" text-anchor="middle">{{ tick.year }}</text>
    <EvidenceMark v-for="(m, i) in drawing.marks" :key="i" :kind="m.kind" :x="m.cx" :y="m.cy" :r="r" />
    <g class="check-mark">
      <line :x1="drawing.checkX" :x2="drawing.checkX" :y1="TOP - 2" :y2="drawing.axisY + 6" />
      <rect :x="drawing.checkX + 3" :y="drawing.axisY - 18" :width="drawing.stampWidth" height="16" rx="3" />
      <text :x="drawing.checkX + 3 + drawing.stampWidth / 2" :y="drawing.axisY - 6.5" text-anchor="middle">{{ t.checkedMark }}</text>
    </g>
  </svg>
</template>
