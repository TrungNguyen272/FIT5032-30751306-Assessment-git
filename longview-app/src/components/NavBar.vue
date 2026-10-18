<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const route = useRoute()
const { currentUser, isLoggedIn, isAdmin, logout } = useAuth()

// On phones the links sit behind a toggle button.
const menuOpen = ref(false)
watch(() => route.path, () => {
  menuOpen.value = false
})

async function handleLogout() {
  await logout()
  router.push('/')
}
</script> 

<template>
  <nav class="navbar navbar-expand-xl navbar-dark bg-dark sticky-top"> 
    <div class="container">
      <router-link class="navbar-brand fw-bold" to="/">LONGVIEW</router-link>
      <button
        class="navbar-toggler"
        type="button"
        aria-controls="mainNav"
        :aria-expanded="menuOpen"
        aria-label="Toggle navigation"
        @click="menuOpen = !menuOpen"
      >
        <span class="navbar-toggler-icon"></span>
      </button> 

      <div id="mainNav" class="collapse navbar-collapse" :class="{ show: menuOpen }"> 
        <ul class="navbar-nav ms-auto mb-2 mb-xl-0 align-items-xl-center"> 
          <li class="nav-item">
            <router-link class="nav-link" to="/">Home</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/courses">Learn</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/programs">Programs</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/contact">Get Involved</router-link>
          </li>

          <li class="nav-item">
            <router-link class="nav-link" to="/about">About</router-link>
          </li>

          <template v-if="isLoggedIn">
            <li class="nav-item">
              <router-link class="nav-link" to="/dashboard">Dashboard</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/community">Community</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/map">Map</router-link>
            </li>
            <li v-if="isAdmin" class="nav-item">
              <router-link class="nav-link" to="/admin">Admin</router-link>
            </li>
            <li class="nav-item ms-xl-2 mt-2 mt-xl-0 d-flex align-items-center gap-2">
              <span class="badge text-bg-light">{{ currentUser?.name }}</span>
              <button class="btn btn-outline-light btn-sm" type="button" @click="handleLogout">
                Log Out
              </button>
            </li>
          </template>

          <template v-else>
            <li class="nav-item ms-xl-2 mt-2 mt-xl-0">
              <router-link class="btn btn-light btn-sm" to="/login">Log In</router-link>
            </li>
          </template>
        </ul>
      </div>
    </div>
  </nav>
</template> 