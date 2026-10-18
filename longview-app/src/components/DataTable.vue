<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { filterRows, sortRows, paginate, pageWindow, toCsv } from '../lib/tableLogic'

/**
 * DataTable (BR D.3 Interactive Table Data)
 */
const props = defineProps({
    title: { type: String, required: true },
    columns: { type: Array, required: true },
    rows: { type: Array, required: true },
    pageSize: { type: Number, default: 10 },
    csvName: { type: String, default: 'export' },
})

const globalQuery = ref('')
const columnFilters = reactive({})
const sortKey = ref(null)
const sortDirection = ref(null)
const currentPage = ref(1)

// The dropdown options come straight from the data, so they can never
// drift out of sync with what is in the table.
const selectOptions = computed(() => {
    const options = {}
    props.columns
        .filter((c) => c.filter === 'select')
        .forEach((c) => {
            options[c.key] = [...new Set(props.rows.map((r) => r[c.key]))].sort()
        })
    return options
})

// The table is filter, then sort, then cut out one page.
const filteredRows = computed(() =>
    filterRows(props.rows, props.columns, globalQuery.value, columnFilters)
)
const sortedRows = computed(() =>
    sortRows(filteredRows.value, props.columns, sortKey.value, sortDirection.value)
)
const totalPages = computed(() => Math.max(1, Math.ceil(sortedRows.value.length / props.pageSize)))
const visibleRows = computed(() => paginate(sortedRows.value, currentPage.value, props.pageSize))
const pageButtons = computed(() => pageWindow(currentPage.value, totalPages.value))

// Numbers for the "Showing 1–10 of 200" line.
const firstShown = computed(() =>
    sortedRows.value.length === 0 ? 0 : (currentPage.value - 1) * props.pageSize + 1
)
const lastShown = computed(() => firstShown.value + visibleRows.value.length - (sortedRows.value.length ? 1 : 0))

const hasActiveFilters = computed(
    () => globalQuery.value.trim() !== '' || Object.values(columnFilters).some((v) => v && v.trim() !== '')
)

// Any change to what is shown sends you back to page 1. Otherwise you could
// sit on page 12 of a result set that now only has 2 pages.
watch([globalQuery, columnFilters, sortKey, sortDirection], () => {
    currentPage.value = 1
})
// Clicking a heading cycles the sort: ascending, then descending, then off.
function toggleSort(column) {
    if (column.sortable === false) return
    if (sortKey.value !== column.key) {
        sortKey.value = column.key
        sortDirection.value = 'asc'
    } else if (sortDirection.value === 'asc') {
        sortDirection.value = 'desc'
    } else {
        sortKey.value = null
        sortDirection.value = null
    }
}

// What a screen reader should announce for each column heading.
function ariaSort(column) {
    if (sortKey.value !== column.key) return 'none'
    return sortDirection.value === 'asc' ? 'ascending' : 'descending'
}

// The little arrow shown next to the heading text.
function sortIcon(column) {
    if (sortKey.value !== column.key) return '↕'
    return sortDirection.value === 'asc' ? '▲' : '▼'
}

function goTo(page) {
    if (page >= 1 && page <= totalPages.value) currentPage.value = page
}

function clearFilters() {
    globalQuery.value = ''
    props.columns.forEach((c) => (columnFilters[c.key] = ''))
}

// Build the CSV from the filtered and sorted rows (all pages, not just the visible one),
// then trigger a browser download.
function downloadCsv() {
    if (sortedRows.value.length === 0) return
    const blob = new Blob(['\ufeff' + toCsv(sortedRows.value, props.columns)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${props.csvName}.csv`
    link.click()
    URL.revokeObjectURL(url)
}

// Gives every input a unique id so its <label for="..."> matches even if
// the page shows two tables at once.
const idBase = `dt-${Math.random().toString(36).slice(2, 8)}`
</script>

<template>
    <section class="card shadow-sm mb-5">
        <div class="card-body">
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <h2 class="h5 mb-0">{{ title }}</h2>
                <div class="d-flex gap-2">
                    <button type="button" class="btn btn-outline-secondary btn-sm"
                        :disabled="!hasActiveFilters && !sortKey"
                        @click="clearFilters(); sortKey = null; sortDirection = null">
                        Reset
                    </button>
                    <button type="button" class="btn btn-outline-dark btn-sm" :disabled="sortedRows.length === 0"
                        @click="downloadCsv">
                        Export CSV
                    </button> 
                </div>
            </div>

            <label :for="`${idBase}-search`" class="form-label visually-hidden">
                Search all columns in {{ title }}
            </label>
            <input :id="`${idBase}-search`" v-model="globalQuery" type="search" class="form-control mb-3"
                placeholder="Search every column…" />

            <div class="table-responsive position-relative">

                <table class="table table-hover table-sm align-middle mb-0">
                    <caption class="visually-hidden">
                        {{ title }}. Click a column heading to sort. Use the boxes under the headings to filter by
                        column.
                    </caption>
                    <thead class="table-light">
                        <tr>
                            <th v-for="col in columns" :key="col.key" scope="col"
                                :aria-sort="col.sortable === false ? undefined : ariaSort(col)">
                                <button v-if="col.sortable !== false" type="button"
                                    class="btn btn-link text-decoration-none text-dark fw-semibold p-0"
                                    @click="toggleSort(col)">
                                    {{ col.label }}
                                    <span class="small text-muted" aria-hidden="true">{{ sortIcon(col) }}</span>
                                </button>
                                <span v-else class="fw-semibold">{{ col.label }}</span>
                            </th>
                        </tr>
                        <tr>
                            <th v-for="col in columns" :key="`${col.key}-filter`" class="fw-normal">
                                <label :for="`${idBase}-${col.key}`" class="visually-hidden">Filter {{ col.label
                                }}</label>
                                <select v-if="col.filter === 'select'" :id="`${idBase}-${col.key}`"
                                    v-model="columnFilters[col.key]" class="form-select form-select-sm">
                                    <option value="">All</option>
                                    <option v-for="opt in selectOptions[col.key]" :key="opt" :value="opt">{{ opt }}
                                    </option>
                                </select>
                                <input v-else :id="`${idBase}-${col.key}`" v-model="columnFilters[col.key]"
                                    type="search" class="form-control form-control-sm"
                                    :placeholder="`Filter ${col.label.toLowerCase()}`" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in visibleRows" :key="row.id">
                            <td v-for="col in columns" :key="col.key">
                                <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                                    {{ row[col.key] }}
                                </slot>
                            </td>
                        </tr>
                        <tr v-if="visibleRows.length === 0">
                            <td :colspan="columns.length" class="text-center text-muted py-4">
                                No rows match your search.
                                <button type="button" class="btn btn-link btn-sm" @click="clearFilters">Clear
                                    filters</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
                <p class="small text-muted mb-0" role="status" aria-live="polite">
                    Showing {{ firstShown }}–{{ lastShown }} of {{ sortedRows.length }}
                    <template v-if="sortedRows.length !== rows.length">(filtered from {{ rows.length }})</template>
                </p>

                <nav :aria-label="`${title} pagination`">
                    <ul class="pagination pagination-sm mb-0">
                        <li class="page-item" :class="{ disabled: currentPage === 1 }">
                            <button type="button" class="page-link" @click="goTo(currentPage - 1)">Previous</button>
                        </li>
                        <li v-for="(p, i) in pageButtons" :key="`${p}-${i}`" class="page-item"
                            :class="{ active: p === currentPage, disabled: p === '…' }">
                            <span v-if="p === '…'" class="page-link">…</span>
                            <button v-else type="button" class="page-link"
                                :aria-current="p === currentPage ? 'page' : undefined" @click="goTo(p)">
                                {{ p }}
                            </button>
                        </li>
                        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                            <button type="button" class="page-link" @click="goTo(currentPage + 1)">Next</button>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    </section>
</template>