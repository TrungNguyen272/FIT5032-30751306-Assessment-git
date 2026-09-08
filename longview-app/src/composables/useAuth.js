import { computed } from 'vue'
import { useLocalStorage } from './useLocalStorage'

const users = useLocalStorage('longview:users', [])

const currentUserId = useLocalStorage('longview:currentUserId', null)

export const ROLES = {
  MEMBER: 'member',
  ADMIN: 'admin',
}

async function hashPassword(password) {
  const encoded = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function useAuth() {
  const currentUser = computed(() => users.value.find((u) => u.id === currentUserId.value) || null)

  const isLoggedIn = computed(() => currentUser.value !== null)
  const isAdmin = computed(() => currentUser.value?.role === ROLES.ADMIN)

  async function register({ name, email, password, role }) {
    const cleanEmail = email.trim().toLowerCase()

    if (users.value.some((u) => u.email === cleanEmail)) {
      return { success: false, error: 'An account with this email already exists.' }
    }

    const passwordHash = await hashPassword(password)
    const account = {
      id: Date.now(),
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role,
    }

    users.value = [...users.value, account]
    currentUserId.value = account.id
    return { success: true }
  }

  users.value = [...users.value, account]
  currentUserId.value = account.id
  return { success: true }
}
