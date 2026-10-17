<script setup>
import DataTable from '../components/DataTable.vue'
import volunteers from '../data/volunteers.json'
import trips from '../data/trips.json'

// The column definitions drive everything: heading text, how the column
// sorts, and which filter box appears under the heading.
const volunteerColumns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'city', label: 'City', filter: 'select' },
    { key: 'group', label: 'Group', filter: 'select' },
    { key: 'hours', label: 'Hours', type: 'number' },
    { key: 'joined', label: 'Joined', type: 'date' },
    { key: 'status', label: 'Status', filter: 'select' },
]

const tripColumns = [
    { key: 'school', label: 'School', filter: 'select' },
    { key: 'mode', label: 'Travel mode', filter: 'select' },
    { key: 'students', label: 'Students', type: 'number' },
    { key: 'km', label: 'Distance (km)', type: 'number' },
    { key: 'co2_saved_kg', label: 'CO2 saved (kg)', type: 'number' },
    { key: 'date', label: 'Date', type: 'date' },
]

// Bootstrap badge colour for each volunteer status.
const statusStyle = {
    Active: 'text-bg-success',
    Pending: 'text-bg-warning',
    Inactive: 'text-bg-secondary',
}

</script>

<template>
    <div class="container py-5">
        <h1 class="mb-1">Community Data</h1>
        <p class="text-muted mb-4">
            Sample data for Longview. Search everything at once, filter by any
            column, or click a heading to sort.
        </p>

        <DataTable title="Volunteer directory" :columns="volunteerColumns" :rows="volunteers"
            csv-name="longview-volunteers">
            <template #cell-status="{ value }">
                <span class="badge" :class="statusStyle[value]">{{ value }}</span>
            </template>
        </DataTable>

        <DataTable title="Active-travel school trips" :columns="tripColumns" :rows="trips"
            csv-name="longview-school-trips" />
    </div>
</template>