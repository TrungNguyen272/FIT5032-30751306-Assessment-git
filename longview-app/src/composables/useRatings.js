import { useLocalStorage } from './useLocalStorage'

/*
 * useRatings (BR C.3 Rating)
 */

const allRatings = useLocalStorage('longview:ratings', {})

export function useRatings() {
  function rate(itemId, userId, stars) {
    const itemRatings = { ...(allRatings.value[itemId] || {}) }
    itemRatings[userId] = stars
    allRatings.value = { ...allRatings.value, [itemId]: itemRatings }
  }

  function getUserRating(itemId, userId) {
    return allRatings.value[itemId]?.[userId] ?? 0
  }

  function getAverage(itemId) {
    const itemRatings = allRatings.value[itemId]
    if (!itemRatings) return 0
    const stars = Object.values(itemRatings)
    if (stars.length === 0) return 0
    const total = stars.reduce((runningTotal, n) => runningTotal + n, 0)
    return Math.round((total / stars.length) * 10) / 10
  }

  function getCount(itemId) {
    return Object.keys(allRatings.value[itemId] || {}).length
  }

  return { rate, getUserRating, getAverage, getCount }
}
