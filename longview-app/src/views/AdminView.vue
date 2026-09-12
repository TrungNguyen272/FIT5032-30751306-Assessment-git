<script setup>
import { computed } from 'vue'
import { useAuth, ROLES } from '../composables/useAuth'
import { useRatings } from '../composables/useRatings'
import coursesData from '../data/courses.json'
import { useLocalStorage } from '../composables/useLocalStorage'

const users = useLocalStorage('longview:users', [])
const { getAverage, getCount } = useRatings()

const memberCount = computed(
    () => users.value.filter((u) => u.role === ROLES.MEMBER).length
)
const adminCount = computed(
    () => users.value.filter((u) => u.role === ROLES.ADMIN).length
)

const ratingOverview = computed(() =>
    coursesData.map((c) => ({
        title: c.title,
        average: getAverage(c.id),
        count: getCount(c.id),
    }))
)
</script>

<template>
    <div class="container py-5" style="max-width: 900px">
        <h1 class="mb-1">Admin Dashboard</h1>
        <p class="text-muted mb-4">
            Visible only to accounts with the Admin role.
        </p>

        <div class="row g-3 mb-5">
            <div class="col-4">
                <div class="card text-center p-3">
                    <p class="display-6 fw-bold mb-0" style="color: var(--lv-green)">{{ users.length }}</p>
                    <p class="text-muted small mb-0">Total accounts</p>
                </div>
            </div>
            <div class="col-4">
                <div class="card text-center p-3">
                    <p class="display-6 fw-bold mb-0" style="color: var(--lv-green)">{{ memberCount }}</p>
                    <p class="text-muted small mb-0">Members</p>
                </div>
            </div>
            <div class="col-4">
                <div class="card text-center p-3">
                    <p class="display-6 fw-bold mb-0" style="color: var(--lv-green)">{{ adminCount }}</p>
                    <p class="text-muted small mb-0">Admins</p>
                </div>
            </div>
        </div>

        <h2 class="h5 mb-3">Course Ratings Overview</h2>
        <table class="table">
            <thead>
                <tr>
                    <th>Course</th>
                    <th>Average rating</th>
                    <th>Number of ratings</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="stat in ratingOverview" :key="stat.title">
                    <td>{{ stat.title }}</td>
                    <td>{{ stat.average > 0 ? stat.average.toFixed(1) : '—' }}</td>
                    <td>{{ stat.count }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>