<script setup>
import { ref } from 'vue'
import eventsData from '../data/events.json'

const events = ref(eventsData)

const stats = ref([
  { label: 'Courses Done', value: '1,000+' },
  { label: 'Groups Active', value: '32' },
  { label: 'School Partners', value: '20' },
  { label: 'CO2 Offset', value: '80.2 T' },
])
</script>

<template>
  <section class="bg-light py-5">
    <div class="container py-4">
      <div class="row align-items-center">
        <div class="col-7">
          <h1 class="display-5 fw-bold mb-3">Climate action starts here.</h1>
          <p class="lead text-muted mb-4">
            Longview brings climate courses, walking & cycling groups, and school challenges
            together to close the gap between climate awareness and action.
          </p>
          <router-link to="/courses" class="btn btn-dark btn-lg me-2 mb-2"
            >Explore Courses</router-link
          >
          <router-link to="/programs" class="btn btn-outline-dark btn-lg mb-2"
            >Find a Group</router-link
          >
        </div>
        <div class="col-5">
          <div
            class="bg-white rounded shadow-sm d-flex align-items-center justify-content-center"
            style="height: 220px"
          ></div>
        </div>
      </div>
    </div>
  </section>

  <section class="container">
    <div class="row g-3 py-4 text-center">
      <div class="col-3" v-for="stat in stats" :key="stat.label">
        <p class="display-6 fw-bold mb-0" style="color: var(--lv-green)">{{ stat.value }}</p>
        <p class="text-muted small mb-0">{{ stat.label }}</p>
      </div>
    </div>
  </section>

  <section class="container py-5">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="h4 mb-0">What's On This Week</h2>
      <router-link to="/programs" class="small">View All</router-link>
    </div>
    <div class="row g-4">
      <div class="col-4" v-for="event in events" :key="event.id">
        <div class="card h-100 shadow-sm">
          <div
            class="bg-light d-flex align-items-center justify-content-center"
            style="height: 140px"
          ></div>
          <div class="card-body">
            <span class="badge text-bg-light text-muted border mb-2">{{ event.type }}</span>
            <h6 class="card-title">{{ event.title }}</h6>
            <p class="card-text text-muted small mb-3">{{ event.when }} @ {{ event.where }}</p>
            <router-link to="/courses" class="btn btn-outline-dark btn-sm w-100"
              >View Details</router-link
            >
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="container py-4">
    <div class="row align-items-center g-4">
      <div class="col-7">
        <blockquote
          class="fst-italic border-start border-3 ps-3"
          style="border-color: var(--lv-green) !important"
        >
          "I finished the short climate course on Monday and joined a local walking group by
          Wednesday. It made getting involved feel natural and local."
        </blockquote>
        <p class="text-muted small mb-0">Charlotte, Chadstone Resident</p>
      </div>
      <div class="col-5">
        <p class="text-uppercase text-muted small fw-bold mb-2">Trusted by</p>
        <ul class="list-unstyled small text-muted mb-0">
          <li class="border-bottom py-2">City of Melbourne</li>
          <li class="border-bottom py-2">Sustainability Victoria</li>
          <li class="py-2">Bicycle Network</li>
        </ul>
      </div>
    </div>
  </section>
</template>
