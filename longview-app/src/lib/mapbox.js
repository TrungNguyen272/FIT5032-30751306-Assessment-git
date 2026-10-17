/**
 *  Mapbox web APIs (BR E.2).
 */

const GEOCODE_URL = 'https://api.mapbox.com/search/geocode/v6/forward'
const DIRECTIONS_URL = 'https://api.mapbox.com/directions/v5/mapbox'

export const TRAVEL_MODES = [
  { id: 'walking', label: 'Walk' },
  { id: 'cycling', label: 'Cycle' },
  { id: 'driving', label: 'Drive' },
]

// Turn an HTTP status into a sentence the user can act on.
function explainHttpError(status) {
  if (status === 401 || status === 403) {
    return 'The Mapbox token was rejected. Check VITE_MAPBOX_TOKEN and its URL restrictions.'
  }
  if (status === 429) return 'Too many map requests, please wait a moment.'
  return `Map service error (${status}).`
}

/**
 * Place search (Mapbox Geocoding v6). Returns
 * [{ id, name, detail, lng, lat }], and when given,
 * biased towards results near `proximity` = [lng, lat].
 */
export async function searchPlaces(query, { token, proximity, signal, fetchImpl = fetch } = {}) {
  const text = query.trim()
  if (text.length < 3) return []

  const params = new URLSearchParams({
    q: text,
    access_token: token,
    country: 'au',
    limit: '5',
    autocomplete: 'true',
  })
  if (proximity) params.set('proximity', `${proximity[0]},${proximity[1]}`)

  const response = await fetchImpl(`${GEOCODE_URL}?${params}`, { signal })
  if (!response.ok) throw new Error(explainHttpError(response.status))

  const data = await response.json()
  return (data.features || []).map((f) => ({
    id: f.properties.mapbox_id || f.id,
    name: f.properties.name,
    detail: f.properties.place_formatted || '',
    lng: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
  }))
}
/**
 * Turn-by-turn route (Directions). `from` and `to` are [lng, lat].
 * Returns { geometry, distance (metres), duration (seconds), steps: [string] }.
 */
export async function getRoute(from, to, mode, { token, signal, fetchImpl = fetch } = {}) {
  const coords = `${from[0]},${from[1]};${to[0]},${to[1]}`
  const params = new URLSearchParams({
    access_token: token,
    geometries: 'geojson',
    overview: 'full',
    steps: 'true',
  })

  const response = await fetchImpl(`${DIRECTIONS_URL}/${mode}/${coords}?${params}`, { signal })
  if (!response.ok) throw new Error(explainHttpError(response.status))

  const data = await response.json()
  const route = data.routes?.[0]
  if (!route) throw new Error('No route found between those two points.')

  return {
    geometry: route.geometry,
    distance: route.distance,
    duration: route.duration,
    steps: route.legs.flatMap((leg) => leg.steps.map((s) => s.maneuver.instruction)),
  }
}

/** Straight-line distance in km. Used to rank the nearest groups. */
export function distanceKm([lng1, lat1], [lng2, lat2]) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)

  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(a))
}

/** Add a distanceKm field and sort nearest-first. Doesn't change the input. */
export function rankByDistance(places, origin) {
  return places
    .map((p) => ({ ...p, distanceKm: distanceKm(origin, [p.lng, p.lat]) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
}

export function formatDistance(meters) {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`
}

export function formatDuration(seconds) {
  const minutes = Math.max(1, Math.round(seconds / 60))
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}
