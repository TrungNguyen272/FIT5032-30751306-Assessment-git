<script setup>
import NavBar from './components/NavBar.vue'
</script>

<template>
  <NavBar />
  <main>
    <router-view />
  </main>

  <footer class="py-5 mt-5" style="background-color: #e3e9f0; border-top: 3px solid #2b6cb0">
    <div class="container">
      <div class="row g-4">
        <div class="col-3" style="min-width: 0">
          <p class="fw-bold text-dark mb-2" style="letter-spacing: 0.5px">LONGVIEW</p>
          <p class="small text-secondary">
            A Melbourne-based not-for-profit connecting citizens to climate action, active transit,
            and local communities.
          </p>
        </div>

        <div class="col-2" style="min-width: 0">
          <p class="fw-bold text-dark mb-2 text-break">Learn</p>
          <ul class="list-unstyled small">
            <li class="mb-2">
              <router-link class="text-secondary text-decoration-none" to="/courses"
                >Course Catalogue</router-link
              >
            </li>
            <li class="mb-2">
              <router-link class="text-secondary text-decoration-none" to="/courses"
                >Course Detail Page</router-link
              >
            </li>
            <li class="mb-2">
              <router-link class="text-secondary text-decoration-none" to="/courses"
                >Climate Basics Hub</router-link
              >
            </li>
            <li class="mb-2">
              <router-link class="text-secondary text-decoration-none" to="/courses"
                >School Workshops</router-link
              >
            </li>
            <li class="mb-2">
              <router-link class="text-secondary text-decoration-none" to="/courses"
                >Teaching Kits</router-link
              >
            </li>
          </ul>
        </div>

        <div class="col-2" style="min-width: 0">
          <p class="fw-bold text-dark mb-2 text-break">Programs</p>
          <ul class="list-unstyled small">
            <li class="mb-2">
              <router-link class="text-secondary text-decoration-none" to="/programs"
                >Walking Groups</router-link
              >
            </li>
            <li class="mb-2">
              <router-link class="text-secondary text-decoration-none" to="/programs"
                >Cycling Groups</router-link
              >
            </li>
            <li class="mb-2">
              <router-link class="text-secondary text-decoration-none" to="/programs"
                >Find a Group</router-link
              >
            </li>
            <li class="mb-2">
              <router-link class="text-secondary text-decoration-none" to="/programs"
                >Active-Travel Challenge</router-link
              >
            </li>
            <li class="mb-2">
              <router-link class="text-secondary text-decoration-none" to="/programs"
                >Event Calendar</router-link
              >
            </li>
          </ul>
        </div>

        <div class="col-2" style="min-width: 0">
          <p class="fw-bold text-dark mb-2 text-break">Get Involved</p>
          <ul class="list-unstyled small">
            <li class="mb-2">
              <router-link class="text-secondary text-decoration-none" to="/contact"
                >Volunteer</router-link
              >
            </li>
            <li class="mb-2">
              <router-link class="text-secondary text-decoration-none" to="/contact"
                >Donate</router-link
              >
            </li>
            <li class="mb-2">
              <router-link class="text-secondary text-decoration-none" to="/contact"
                >Corporate Partnerships</router-link
              >
            </li>
            <li class="mb-2">
              <router-link class="text-secondary text-decoration-none" to="/contact"
                >School Partnerships</router-link
              >
            </li>
          </ul>
        </div>

        <div class="col-3" style="min-width: 0">
          <p class="fw-bold text-dark mb-2 text-break">About</p>
          <ul class="list-unstyled small">
            <li class="mb-2">
              <router-link class="text-secondary text-decoration-none" to="/about"
                >Our Story &amp; Mission</router-link
              >
            </li>
            <li class="mb-2">
              <router-link class="text-secondary text-decoration-none" to="/about"
                >Team &amp; Partners</router-link
              >
            </li>
            <li class="mb-2">
              <router-link class="text-secondary text-decoration-none" to="/about"
                >Impact Reports</router-link
              >
            </li>
            <li class="mb-2">
              <router-link class="text-secondary text-decoration-none" to="/about"
                >News &amp; Media</router-link
              >
            </li>
            <li class="mb-2">
              <router-link class="text-secondary text-decoration-none" to="/about">FAQ</router-link>
            </li>
            <li class="mb-2">
              <router-link class="text-secondary text-decoration-none" to="/about"
                >Contact Us</router-link
              >
            </li>
          </ul>
        </div>
      </div>
      <hr class="mt-2 mb-3" style="border-color: #c3cfdc" />
      <p class="small text-secondary mb-0 text-center">Longview. Melbourne, VIC</p>
    </div>
  </footer>
</template>
