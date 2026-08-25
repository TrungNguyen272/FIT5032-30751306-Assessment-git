import { ref, watch } from 'vue'

/**
 * Creates reactive data and saves changes to localStorage.
 *
 * @param {string} storageKey - The localStorage key
 * @param {*} fallback - Value used when nothing has been saved
 * @returns {import('vue').Ref}
 */
export function useLocalStorage(storageKey, fallback) {
  const state = ref(fallback)

  // Load the saved value from localStorage
  const savedValue = localStorage.getItem(storageKey)

  if (savedValue !== null) {
    try {
      state.value = JSON.parse(savedValue)
    } catch (error) {
      console.warn(`Could not read localStorage key "${storageKey}".`, error)
      state.value = fallback
    }
  }

  // Update localStorage whenever the reactive state changes
  watch(
    state,
    (newValue) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(newValue))
      } catch (error) {
        console.warn(`Could not save localStorage key "${storageKey}".`, error)
      }
    },
    { deep: true },
  )

  return state
}
