<script setup>
import { ref, computed } from 'vue'
import coursesData from '../data/courses.json'
import CourseCard from '../components/CourseCard.vue'
import { useLocalStorage } from '../composables/useLocalStorage'
import { useAuth } from '../composables/useAuth'
import { useRatings } from '../composables/useRatings'

// Dynamic data source
const courses = ref(coursesData)

// Reactive filter state
const searchQuery = ref('')
const activeCategory = ref('All')

const categories = computed(() => {
  const unique = new Set(courses.value.map((c) => c.category))
  return ['All', ...unique]
})

const filteredCourses = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return courses.value.filter((course) => {
    const categoryMatches = activeCategory.value === 'All' || course.category === activeCategory.value
    const searchMatches = course.title.toLowerCase().includes(query)
    return categoryMatches && searchMatches
  })
})

// Bookmarked courses list 
const bookmarkedIds = useLocalStorage('longview:savedCourseIds', [])

function isSaved(id) {
  return bookmarkedIds.value.includes(id)
}

function toggleSave(id) {
  if (isSaved(id)) {
    bookmarkedIds.value = bookmarkedIds.value.filter((savedId) => savedId !== id)
  } else {
    bookmarkedIds.value = [...bookmarkedIds.value, id]
  }
}

// Only logged-in users can submit a rating, anyone
// can see the aggregated average even logged in or not.
const { isLoggedIn, currentUser } = useAuth()
const { rate, getUserRating, getAverage, getCount } = useRatings()

function handleRate(courseId, stars) {
  if (!isLoggedIn.value) return
  rate(courseId, currentUser.value.id, stars)
}
</script>

<template>
  <div class="container py-5">
    <h1 class="mb-4">Course Catalogue</h1>

    <div class="row g-3 mb-4">
      <div class="col-6">
        <label for="search" class="form-label">Search courses</label>
        <input id="search" v-model="searchQuery" type="text" class="form-control"
          placeholder="Try 'transport' or 'workshop'" />
      </div>
      <div class="col-4">
        <label for="category" class="form-label">Category</label>
        <select id="category" v-model="activeCategory" class="form-select">
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
      <div class="col-2 d-flex align-items-end">
        <span class="text-muted small">Showing {{ filteredCourses.length }} of {{ courses.length }}</span>
      </div>
    </div>

    <p v-if="bookmarkedIds.length" class="text-muted small mb-4">
      {{ bookmarkedIds.length }} course{{ bookmarkedIds.length === 1 ? '' : 's' }} bookmarked — these stay saved even
      after you close the tab.
    </p>

    <p v-if="!isLoggedIn" class="text-muted small mb-4">
      <router-link to="/login">Log in</router-link> to rate courses. Everyone can see the average rating below.
    </p>

    <div class="row">
      <CourseCard v-for="course in filteredCourses" :key="course.id" :course="course" :is-saved="isSaved(course.id)"
        :average="getAverage(course.id)" :count="getCount(course.id)"
        :user-rating="getUserRating(course.id, currentUser?.id)" :can-rate="isLoggedIn" @toggle-save="toggleSave"
        @rate="handleRate" />
    </div>

    <p v-if="filteredCourses.length === 0" class="text-muted text-center py-5">
      No courses match "{{ searchQuery }}".
    </p>
  </div>
</template>