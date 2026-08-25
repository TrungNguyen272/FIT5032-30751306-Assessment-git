<script setup>
import { ref } from 'vue'
import programsData from '../data/programs.json'

const programs = ref(programsData)
</script>

<template>
  <div class="container py-5">
    <h1 class="mb-4">Programs</h1>
    <p class="text-muted mb-4">
      Walking groups, cycling groups, the school Active-Travel Challenge, the Find a Group map tool,
      and a shared event calendar.
    </p>
    <div class="row g-3">
      <div class="col-6" v-for="program in programs" :key="program.id">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <h5 class="card-title mb-0">{{ program.name }}</h5>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
