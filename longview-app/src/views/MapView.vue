<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import groupsData from '../data/groups.json'
import {
    TRAVEL_MODES,
    searchPlaces,
    getRoute,
    rankByDistance,
    formatDistance,
    formatDuration,
} from '../lib/mapbox'

/**
 * Find a Group (BR E.2 Geo Location)
 *
 * Three map features are implemented:
 *   1. Place search   - type an address or suburb (Mapbox Geocoding) to set your start point
 *   2. Nearest groups - groups re-rank by distance from your start point or GPS
 *   3. Routing        - pick a group for a walk, cycle or drive route with time,
 *                       distance and turn-by-turn steps (Mapbox Directions)
 */
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const MELBOURNE = [144.9631, -37.8136] // [lng, lat]

const mapEl = ref(null)
let map = null
let originMarker = null
const groupMarkers = new Map()
const mapReady = ref(false)


// state 
const origin = ref(null) // { lng, lat, label }
const searchText = ref('')
const suggestions = ref([])
const searchStatus = ref('') // '', 'loading', 'empty', 'error'
const searchError = ref('')
const selectedId = ref(null)
const mode = ref('walking')
const route = ref(null)
const routeStatus = ref('') // '', 'loading', 'error'
const routeError = ref('')
const locating = ref(false)
const locateError = ref('')

const selectedGroup = computed(() => groupsData.find((g) => g.id === selectedId.value) || null)

// Before a start point is set, groups appear in their original order.
// Once it is set, they are sorted nearest first.
const rankedGroups = computed(() =>
    origin.value ? rankByDistance(groupsData, [origin.value.lng, origin.value.lat]) : groupsData
)
// Google's directions link uses "bicycling"
const GOOGLE_MODES = { walking: 'walking', cycling: 'bicycling', driving: 'driving' }

// link so people can navigate in the app. 
const googleMapsUrl = computed(() => {
    if (!origin.value || !selectedGroup.value) return ''
    const params = new URLSearchParams({
        api: '1',
        origin: `${origin.value.lat},${origin.value.lng}`,
        destination: `${selectedGroup.value.lat},${selectedGroup.value.lng}`,
        travelmode: GOOGLE_MODES[mode.value],
    })
    return `https://www.google.com/maps/dir/?${params}`
})

// map setup
function makePin(group) {
    // A button, so keyboard users can reach and trigger it too.
    const pin = document.createElement('button')
    pin.type = 'button'
    pin.className = `lv-pin lv-pin-${group.type.toLowerCase()}`
    pin.setAttribute('aria-label', `${group.name}, ${group.type}`)
    pin.addEventListener('click', () => selectGroup(group.id))
    return pin
}


function makePopup(group) {
    // Built from DOM nodes and textContent,
    // so the text can never inject markup into the page.
    const box = document.createElement('div')
    const title = document.createElement('strong')
    title.textContent = group.name
    const where = document.createElement('div')
    where.textContent = group.where
    const when = document.createElement('div')
    when.className = 'text-muted'
    when.textContent = group.when
    box.append(title, where, when)
    return new mapboxgl.Popup({ offset: 24, closeButton: false }).setDOMContent(box)
}

onMounted(() => {
    // No token -> no map. The template shows a warning
    if (!MAPBOX_TOKEN) return

    mapboxgl.accessToken = MAPBOX_TOKEN
    map = new mapboxgl.Map({
        container: mapEl.value,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: MELBOURNE,
        zoom: 10.3,
    })
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

    map.on('load', () => {
        // An empty line that the routing feature fills in later.
        map.addSource('route', {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } },
        })
        map.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#2f6f4e', 'line-width': 5, 'line-opacity': 0.85 },
        })

        // One pin per group, each with its own popup.
        groupsData.forEach((g) => {
            const marker = new mapboxgl.Marker({ element: makePin(g) })
                .setLngLat([g.lng, g.lat])
                .setPopup(makePopup(g))
                .addTo(map)
            groupMarkers.set(g.id, marker)
        })
        mapReady.value = true
    })

    map.on('error', (e) => {
        // A bad token or blocked style shows up here. 
        if (e?.error?.status === 401 || e?.error?.status === 403) {
            routeError.value = 'The Mapbox token was rejected. Check VITE_MAPBOX_TOKEN and its URL restrictions.'
        }
    })
})

onBeforeUnmount(() => {
    clearTimeout(searchTimer)
    clearTimeout(locateTimer)
    searchAbort?.abort()
    routeAbort?.abort()
    map?.remove()
    map = null
})
// place search 
let searchTimer = null
let searchAbort = null

function onSearchInput() {
    clearTimeout(searchTimer)
    searchAbort?.abort()
    searchError.value = ''

    if (searchText.value.trim().length < 3) {
        suggestions.value = []
        searchStatus.value = ''
        return
    }

    // Wait for a pause in typing.
    searchTimer = setTimeout(runSearch, 300)
}

async function runSearch() {
    searchAbort = new AbortController()
    searchStatus.value = 'loading'
    try {
        suggestions.value = await searchPlaces(searchText.value, {
            token: MAPBOX_TOKEN,
            proximity: MELBOURNE,
            signal: searchAbort.signal,
        })
        searchStatus.value = suggestions.value.length ? '' : 'empty'
    } catch (err) {
        if (err.name === 'AbortError') return // replaced by newer typing, not an error
        searchStatus.value = 'error'
        searchError.value = err.message
    }
}

function pickSuggestion(place) {
    setOrigin({ lng: place.lng, lat: place.lat, label: place.name })
    searchText.value = place.name
    suggestions.value = []
}

//  feature 2: start point and nearest groups 
function setOrigin(point) {
    origin.value = point
    if (!map) return

    originMarker?.remove()
    originMarker = new mapboxgl.Marker({ color: '#0d6efd' })
        .setLngLat([point.lng, point.lat])
        .addTo(map)
    map.flyTo({ center: [point.lng, point.lat], zoom: 12.5 })
}

let locateTimer = null

function useMyLocation() {
    locateError.value = ''
    if (!('geolocation' in navigator)) {
        locateError.value = 'Your browser does not support location.'
        return
    }
    locating.value = true

    // The browser's  `timeout` option only starts counting once permission has
    // been granted, so an ignored permission prompt would leave the button
    // spinning forever. This timer is the safety net.
    clearTimeout(locateTimer)
    locateTimer = setTimeout(() => {
        if (!locating.value) return
        locating.value = false
        locateError.value =
            'Still waiting for your location. Allow location access in your browser, or search for an address.'
    }, 12000)

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            clearTimeout(locateTimer)
            locating.value = false
            locateError.value = ''
            setOrigin({ lng: pos.coords.longitude, lat: pos.coords.latitude, label: 'My location' })
            searchText.value = ''
        },
        (err) => {
            clearTimeout(locateTimer)
            locating.value = false
            locateError.value =
                err.code === err.PERMISSION_DENIED
                    ? 'Location permission was denied. You can search for an address instead.'
                    : 'Could not work out your location. Try searching for an address.'
        },
        { enableHighAccuracy: false, timeout: 10000 }
    )
}

function clearOrigin() {
    origin.value = null
    originMarker?.remove()
    originMarker = null
    searchText.value = ''
    suggestions.value = []
    clearRoute()
}

// feature 3: routing 
let routeAbort = null

function selectGroup(id) {
    selectedId.value = id
    const group = groupsData.find((g) => g.id === id)
    if (!map || !group) return

    // Close any open popup, then open the one for this group.
    groupMarkers.forEach((m) => m.getPopup().isOpen() && m.togglePopup())
    groupMarkers.get(id)?.togglePopup()
    if (!origin.value) map.flyTo({ center: [group.lng, group.lat], zoom: 13 })
}

async function loadRoute() {
    routeAbort?.abort()
    if (!origin.value || !selectedGroup.value) return clearRoute()

    routeAbort = new AbortController()
    routeStatus.value = 'loading'
    routeError.value = ''
    try {
        route.value = await getRoute(
            [origin.value.lng, origin.value.lat],
            [selectedGroup.value.lng, selectedGroup.value.lat],
            mode.value,
            { token: MAPBOX_TOKEN, signal: routeAbort.signal }
        )
        routeStatus.value = ''
        drawRoute(route.value.geometry)
    } catch (err) {
        if (err.name === 'AbortError') return
        route.value = null
        routeStatus.value = 'error'
        routeError.value = err.message
        drawRoute(null)
    }
}

// Put the route line on the map and zoom to fit it.
function drawRoute(geometry) {
    if (!map || !mapReady.value) return
    const empty = { type: 'LineString', coordinates: [] }
    map.getSource('route').setData({ type: 'Feature', geometry: geometry || empty })

    if (geometry?.coordinates?.length) {
        const bounds = geometry.coordinates.reduce(
            (b, c) => b.extend(c),
            new mapboxgl.LngLatBounds(geometry.coordinates[0], geometry.coordinates[0])
        )
        map.fitBounds(bounds, { padding: 60, duration: 800 })
    }
}

function clearRoute() {
    route.value = null
    routeStatus.value = ''
    drawRoute(null)
}

// Re-route whenever the start point, the destination or the travel mode changes.
watch([origin, selectedId, mode], loadRoute)
</script>

<template>
    <div class="container py-5">
        <h1 class="mb-1">Find a Group</h1>
        <p class="text-muted mb-4">
            Search for where you're starting from, see which groups are closest, then get directions.
        </p>

        <div v-if="!MAPBOX_TOKEN" class="alert alert-warning" role="alert">
            The map isn't available because no Mapbox token is configured
            (<code>VITE_MAPBOX_TOKEN</code>). The group list below still works.
        </div>

        <div class="row g-4">
            <div class="col-12 col-lg-4 order-2 order-lg-1">
                <!-- Feature 1: place search -->
                <div class="position-relative mb-3">
                    <label for="placeSearch" class="form-label fw-semibold">Where are you starting from?</label>
                    <div class="input-group">
                        <input id="placeSearch" v-model="searchText" type="search" class="form-control"
                            placeholder="Address or suburb" autocomplete="off" :disabled="!MAPBOX_TOKEN" role="combobox"
                            aria-autocomplete="list" :aria-expanded="suggestions.length > 0"
                            aria-controls="placeSuggestions" @input="onSearchInput" />
                        <button type="button" class="btn btn-outline-dark" :disabled="!MAPBOX_TOKEN || locating"
                            title="Use my current location" @click="useMyLocation">
                            {{ locating ? '…' : 'Use GPS' }}
                        </button>
                    </div>

                    <ul v-if="suggestions.length" id="placeSuggestions"
                        class="list-group position-absolute w-100 shadow-sm lv-suggestions" role="listbox">
                        <li v-for="s in suggestions" :key="s.id" role="option">
                            <button type="button" class="list-group-item list-group-item-action"
                                @click="pickSuggestion(s)">
                                <span class="fw-semibold">{{ s.name }}</span>
                                <span class="d-block small text-muted">{{ s.detail }}</span>
                            </button>
                        </li>
                    </ul>

                    <p class="small text-muted mt-1 mb-0" role="status" aria-live="polite">
                        <template v-if="searchStatus === 'loading'">Searching…</template>
                        <template v-else-if="searchStatus === 'empty'">No places found, try a nearby suburb.</template>
                        <span v-else-if="searchStatus === 'error'" class="text-danger">{{ searchError }}</span>
                        <span v-else-if="locateError" class="text-danger">{{ locateError }}</span>
                    </p>

                    <p v-if="origin" class="small mt-2 mb-0">
                        Starting from <strong>{{ origin.label }}</strong>
                        <button type="button" class="btn btn-link btn-sm p-0 ms-2" @click="clearOrigin">Clear</button>
                    </p>
                </div>

                <!-- Feature 3: travel mode -->
                <fieldset class="mb-3">
                    <legend class="form-label fw-semibold fs-6">How are you travelling?</legend>
                    <div class="btn-group w-100" role="group">
                        <template v-for="m in TRAVEL_MODES" :key="m.id">
                            <input :id="`mode-${m.id}`" v-model="mode" type="radio" class="btn-check" :value="m.id" />
                            <label class="btn btn-outline-dark btn-sm" :for="`mode-${m.id}`">{{ m.label }}</label>
                        </template>
                    </div>
                </fieldset>
                <!-- Feature 2: nearest groups -->
                <h2 class="h6">{{ origin ? 'Closest groups' : 'All groups' }}</h2>
                <ul class="list-group mb-3">
                    <li v-for="g in rankedGroups" :key="g.id" class="list-group-item p-0">
                        <button type="button" class="btn text-start w-100 rounded-0 p-2"
                            :class="selectedId === g.id ? 'btn-success' : 'btn-light'"
                            :aria-pressed="selectedId === g.id" @click="selectGroup(g.id)">
                            <span class="d-flex justify-content-between">
                                <span class="fw-semibold">{{ g.name }}</span>
                                <span v-if="g.distanceKm !== undefined" class="small text-nowrap ms-2">
                                    {{ g.distanceKm.toFixed(1) }} km
                                </span>
                            </span>
                            <span class="d-block small">{{ g.type }} · {{ g.when }}</span>
                            <span class="d-block small">{{ g.where }}</span>
                        </button>
                    </li>
                </ul>

                <!-- Route summary and steps -->
                <div role="status" aria-live="polite">
                    <p v-if="routeStatus === 'loading'" class="text-muted small">Finding the best route…</p>
                    <p v-else-if="routeStatus === 'error'" class="text-danger small">{{ routeError }}</p>
                    <p v-else-if="selectedGroup && !origin" class="text-muted small">
                        Set a starting point above to get directions to {{ selectedGroup.name }}.
                    </p>
                </div>

                <div v-if="route" class="card card-body">
                    <h2 class="h6 mb-1">To {{ selectedGroup.name }}</h2>
                    <p class="mb-2">
                        <strong>{{ formatDuration(route.duration) }}</strong>
                        · {{ formatDistance(route.distance) }}
                        · {{TRAVEL_MODES.find((m) => m.id === mode).label.toLowerCase()}}
                    </p>
                    <a :href="googleMapsUrl" target="_blank" rel="noopener noreferrer"
                        class="small d-inline-block mb-2">
                        Open in Google Maps
                    </a>
                    <details>
                        <summary class="small">Text directions ({{ route.steps.length }} steps)</summary>
                        <ol class="small ps-3 mt-2 mb-0">
                            <li v-for="(step, i) in route.steps" :key="i">{{ step }}</li>
                        </ol>
                    </details>
                </div>
            </div>

            <div class="col-12 col-lg-8 order-1 order-lg-2">
                <div ref="mapEl" class="lv-map rounded border" role="region" aria-label="Map of Longview groups">
                </div>
            </div>
        </div>
    </div>
</template>

<style>
/* Not scoped on purpose: the pins are built with document.createElement
   and handed to Mapbox, so Vue's scoped attribute never lands on them. */
.lv-map {
    width: 100%;
    height: 520px;
    background: #e9ecef;
}

@media (max-width: 575.98px) {
    .lv-map {
        height: 340px;
    }
}

.lv-suggestions {
    z-index: 20;
    top: 100%;
}

.lv-pin {
    width: 22px;
    height: 22px;
    padding: 0;
    border: 2px solid #fff;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
    cursor: pointer;
}

.lv-pin:focus-visible {
    outline: 3px solid #212529;
    outline-offset: 2px;
}

.lv-pin-walk {
    background: #2f6f4e;
}

.lv-pin-bike {
    background: #e67e22;
}

.lv-pin-course {
    background: #6f42c1;
}

.lv-pin-school {
    background: #0dcaf0;
}
</style>