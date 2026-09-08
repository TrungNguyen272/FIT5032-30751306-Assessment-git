import { computed } from 'vue'
import { useLocalStorage } from './useLocalStorage'

const users = useLocalStorage('longview:users', [])

const currentUserId = useLocalStorage('longview:currentUserId', null)

export const ROLES = {
  MEMBER: 'member',
  ADMIN: 'admin',
}
