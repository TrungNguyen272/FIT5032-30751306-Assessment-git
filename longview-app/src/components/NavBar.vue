<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { currentUser, isLoggedIn, isAdmin, logout } = useAuth()

function handleLogout() {
  logout()
  router.push('/')
}
</script>

<template>
  <nav class="navbar navbar-expand navbar-dark bg-dark sticky-top">
    <div class="container">
      <router-link class="navbar-brand fw-bold" to="/">LONGVIEW</router-link>

      <div class="collapse navbar-collapse">
        <ul class="navbar-nav ms-auto mb-2 mb-md-0 align-items-md-center">
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
            <li v-if="isAdmin" class="nav-item">
              <router-link class="nav-link" to="/admin">Admin</router-link>
            </li>
            <li class="nav-item ms-2 d-flex align-items-center gap-2">
              <span class="badge text-bg-light">{{ currentUser?.name }}</span>
              <button class="btn btn-outline-light btn-sm" type="button" @click="handleLogout">
                Log Out
              </button>
            </li>
          </template>

          <template v-else>
            <li class="nav-item ms-2">
              <router-link class="btn btn-light btn-sm" to="/login">Log In</router-link>
            </li>
          </template>
        </ul>
      </div>
    </div>
  </nav>
</template>