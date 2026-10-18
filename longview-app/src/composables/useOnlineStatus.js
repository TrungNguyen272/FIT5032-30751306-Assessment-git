import { ref } from 'vue'

// One shared value, so every component sees the same online/offline state.
const isOnline = ref(navigator.onLine) // browser’s current connection state

window.addEventListener('online', () => {
  isOnline.value = true
})
window.addEventListener('offline', () => {
  isOnline.value = false
})

export function useOnlineStatus() {
  return { isOnline }
} 