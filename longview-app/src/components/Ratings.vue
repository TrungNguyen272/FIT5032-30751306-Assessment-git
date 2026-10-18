<script setup>
import { computed } from 'vue'

const props = defineProps({
  average: { type: Number, default: 0 },
  count: { type: Number, default: 0 },
  userRating: { type: Number, default: 0 },
  interactive: { type: Boolean, default: false },
})

const emit = defineEmits(['rate'])

// One sentence for screen readers instead of five separate buttons.
const summary = computed(() =>
  props.average > 0
    ? `Rated ${props.average.toFixed(1)} out of 5 from ${props.count} rating${props.count === 1 ? '' : 's'}`
    : 'No ratings yet',
)

function starClass(starNumber) {
  const value = props.interactive ? props.userRating : Math.round(props.average)
  return starNumber <= value ? 'star-on' : 'star-off'
}
</script>

<template>
  <div class="d-flex align-items-center gap-1">
    <div v-if="interactive" role="group" aria-label="Your rating" class="d-flex gap-1">
      <button
        v-for="star in 5"
        :key="star"
        type="button"
        class="btn btn-sm p-0 border-0 bg-transparent"
        :class="starClass(star)"
        style="cursor: pointer"
        :aria-label="`Rate ${star} star${star === 1 ? '' : 's'}`"
        :aria-pressed="star === userRating"
        @click="emit('rate', star)"
      >
        ★
      </button>
    </div>

    <span v-else role="img" :aria-label="summary" class="d-flex gap-1">
      <span v-for="star in 5" :key="star" :class="starClass(star)" aria-hidden="true">★</span>
    </span>

    <span class="small text-muted ms-1" :aria-hidden="!interactive">
      {{ average > 0 ? average.toFixed(1) : 'No ratings yet' }}
      <span v-if="count > 0">({{ count }})</span>
    </span>
  </div>
</template>

<style scoped>
/* Darker amber and grey color */
.star-on {
  color: #b45309 !important;
}
.star-off {
  color: #6c757d !important;
}
</style>