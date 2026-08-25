<script setup>
import { ref, computed } from 'vue'
import coursesData from '../data/courses.json'
import CourseCard from '../components/CourseCard.vue'
import { useLocalStorage } from '../composables/useLocalStorage'

// Dynamic data (BR B.2)
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
    const categoryMatches =
      activeCategory.value === 'All' || course.category === activeCategory.value
    const searchMatches = course.title.toLowerCase().includes(query)
    return categoryMatches && searchMatches
  })
})

// Persisted bookmarked courses (BR B.2: Local Storage for Bookmarked Courses)
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
</script>

<template>
  <div class="container py-5">
    <h1 class="mb-4">Course Catalogue</h1>

    <div class="row g-3 mb-4">
      <div class="col-6">
        <label for="search" class="form-label">Search courses</label>
        <input
          id="search"
          v-model="searchQuery"
          type="text"
          class="form-control"
          placeholder="Try 'transport' or 'workshop'"
        />
      </div>
      <div class="col-4">
        <label for="category" class="form-label">Category</label>
        <select id="category" v-model="activeCategory" class="form-select">
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>

      <div class="col-2 d-flex align-items-end">
        <span class="text-muted small"
          >Showing {{ filteredCourses.length }} of {{ courses.length }}</span
        >
      </div>
    </div>

    <p v-if="bookmarkedIds.length" class="text-muted small mb-4">
      You've bookmarked {{ bookmarkedIds.length }} course{{
        bookmarkedIds.length === 1 ? '' : 's'
      }}.
    </p>

    <div class="row">
      <CourseCard
        v-for="course in filteredCourses"
        :key="course.id"
        :course="course"
        :is-saved="isSaved(course.id)"
        @toggle-save="toggleSave"
      />
    </div>

    <p v-if="filteredCourses.length === 0" class="text-muted text-center py-5">
      No courses match "{{ searchQuery }}".
    </p>
  </div>
</template>
