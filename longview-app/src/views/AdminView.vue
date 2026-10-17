<script setup>
import { computed, onMounted, ref } from 'vue'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'
import { useRatings } from '../composables/useRatings'
import coursesData from '../data/courses.json'

const { getAverage, getCount } = useRatings()

// Account numbers come from the adminSummary Cloud Function (BR E.1).
// The function re-checks the caller's role on the server, so if
// someone bypassed the router guard they would get "permission-denied".
const stats = ref(null)
const loadError = ref('')
const isLoading = ref(true)

async function loadStats() {
    isLoading.value = true
    loadError.value = ''
    try {
        const fetchSummary = httpsCallable(functions, 'adminSummary')
        const result = await fetchSummary()
        stats.value = result.data
    } catch (err) {
        loadError.value = err.message || 'Could not load account statistics.'
    } finally {
        isLoading.value = false
    }
}

onMounted(loadStats)


const ratingOverview = computed(() =>
    coursesData.map((c) => ({
        title: c.title,
        average: getAverage(c.id),
        count: getCount(c.id),
    }))
)

// One entry per stat card, so the template can loop over them.
const cards = computed(() => [
    { label: 'Total accounts', value: stats.value?.totalAccounts },
    { label: 'Members', value: stats.value?.members },
    { label: 'Admins', value: stats.value?.admins },
    { label: 'Summaries emailed', value: stats.value?.summariesSent },
])
</script>

<template>
    <div class="container py-5" style="max-width: 900px">
        <h1 class="mb-1">Admin Dashboard</h1>
        <p class="text-muted mb-4">
            Visible only to accounts with the Admin role.
        </p>

        <div v-if="loadError" class="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
            <span>{{ loadError }}</span>
            <button type="button" class="btn btn-outline-danger btn-sm" @click="loadStats">Retry</button>
        </div>

        <div class="row g-3 mb-5">
            <div v-for="card in cards" :key="card.label" class="col-6 col-md-3">
                <div class="card text-center p-3 h-100">
                    <p class="display-6 fw-bold mb-0" style="color: var(--lv-green)">
                        <span v-if="isLoading" class="placeholder-glow"><span class="placeholder col-4"></span></span>
                        <template v-else>{{ card.value ?? '—' }}</template>
                    </p>
                    <p class="text-muted small mb-0">{{ card.label }}</p>
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