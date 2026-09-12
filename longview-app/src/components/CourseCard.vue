<script setup>
import Ratings from './Ratings.vue'

defineProps({
  course: {
    type: Object,
    required: true,
  },
  isSaved: {
    type: Boolean,
    default: false,
  },
  average: { type: Number, default: 0 },
  count: { type: Number, default: 0 },
  userRating: { type: Number, default: 0 },
  canRate: { type: Boolean, default: false },
})

defineEmits(['toggle-save', 'rate'])
</script>

<template>
  <div class="col-6 mb-4">
    <div class="card h-100 shadow-sm">
      <div class="card-body d-flex flex-column">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <span class="badge text-bg-success">{{ course.category }}</span>
          <button class="btn btn-sm" :class="isSaved ? 'btn-warning' : 'btn-outline-secondary'"
            @click="$emit('toggle-save', course.id)" :aria-pressed="isSaved">
            {{ isSaved ? '✓ Bookmarked' : '+ Bookmark' }}
          </button>
        </div>
        <h5 class="card-title">{{ course.title }}</h5>
        <p class="card-text text-muted small mb-2">{{ course.type }}</p>
        <div class="mt-auto">
          <Ratings :average="average" :count="count" :user-rating="userRating" :interactive="canRate"
            @rate="(stars) => $emit('rate', course.id, stars)" />
        </div>
      </div>
    </div>
  </div>
</template>