<script setup>
const stats = [
  { label: 'Courses Done', value: '1,000+' },
  { label: 'Groups Active', value: '32' },
  { label: 'School Partners', value: '20' },
]
</script>

<template>
  <div class="container py-5" style="max-width: 720px">
    <h1 class="mb-4">Our Story & Mission</h1>
    <p class="text-muted">
      Longview is a Melbourne-based not-for-profit built around a simple idea: most people learn
      about climate change well after the point where they'd actually do something about it. We
      close that gap by bringing local walking and cycling groups, school challenges, and short
      climate courses together in one place.
    </p>

    <div class="row text-center g-3 mt-4">
      <div class="col-4" v-for="stat in stats" :key="stat.label">
        <p class="h4 fw-bold mb-0" style="color: var(--lv-green)">{{ stat.value }}</p>
        <p class="text-muted small mb-0">{{ stat.label }}</p>
      </div>
    </div>
  </div>
</template>
