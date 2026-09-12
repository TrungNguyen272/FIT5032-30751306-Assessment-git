<script setup>
import { computed } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useRatings } from '../composables/useRatings'
import coursesData from '../data/courses.json'
import { useLocalStorage } from '../composables/useLocalStorage'

const { currentUser } = useAuth()
const { getUserRating } = useRatings()
const bookmarkedIds = useLocalStorage('longview:savedCourseIds', [])

const bookmarkedCourses = computed(() =>
    coursesData.filter((c) => bookmarkedIds.value.includes(c.id))
)

const ratedCourses = computed(() =>
    coursesData
        .map((c) => ({ course: c, stars: getUserRating(c.id, currentUser.value?.id) }))
        .filter((r) => r.stars > 0)
)
</script>

<template>
    <div class="container py-5" style="max-width: 720px">
        <h1 class="mb-1">Welcome back, {{ currentUser?.name }}</h1>
        <p class="text-muted mb-4">
            Role: <span class="badge text-bg-secondary">{{ currentUser?.role }}</span>
        </p>

        <h2 class="h5 mt-4 mb-3">Bookmarked Courses</h2>
        <p v-if="bookmarkedCourses.length === 0" class="text-muted">
            You haven't bookmarked any courses yet. Head to
            <router-link to="/courses">Learn</router-link> to find one.
        </p>
        <ul v-else class="list-group mb-4">
            <li v-for="course in bookmarkedCourses" :key="course.id" class="list-group-item">
                {{ course.title }}
            </li>
        </ul>

        <h2 class="h5 mt-4 mb-3">Courses You've Rated</h2>
        <p v-if="ratedCourses.length === 0" class="text-muted">
            You haven't rated any courses yet.
        </p>
        <ul v-else class="list-group">
            <li v-for="entry in ratedCourses" :key="entry.course.id"
                class="list-group-item d-flex justify-content-between">
                {{ entry.course.title }}
                <span>{{ '★'.repeat(entry.stars) }}{{ '☆'.repeat(5 - entry.stars) }}</span>
            </li>
        </ul>
    </div>
</template>