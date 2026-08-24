<script setup></script>

<template>
  <main>
    <router-view />
  </main>

  <footer class="bg-dark text-light py-5 mt-5">
    <div class="container">
      <div class="row g-4">
        <div class="col-md-4">
          <p class="fw-bold mb-2">LONGVIEW</p>
          <p class="small text-white-50">
            A Melbourne-based not-for-profit connecting citizens to climate action, active travel,
            and local communities.
          </p>
        </div>
        <div class="col-6 col-md-2">
          <p class="small fw-bold text-uppercase mb-2">Learn</p>
          <ul class="list-unstyled small">
            <li>
              <router-link class="text-white-50 text-decoration-none" to="/courses"
                >Course Catalogue</router-link
              >
            </li>
            <li>
              <router-link class="text-white-50 text-decoration-none" to="/courses"
                >Climate Basics Hub</router-link
              >
            </li>
          </ul>
        </div>
        <div class="col-6 col-md-2">
          <p class="small fw-bold text-uppercase mb-2">Programs</p>
          <ul class="list-unstyled small">
            <li>
              <router-link class="text-white-50 text-decoration-none" to="/programs"
                >Walking Groups</router-link
              >
            </li>
            <li>
              <router-link class="text-white-50 text-decoration-none" to="/programs"
                >Cycling Groups</router-link
              >
            </li>
          </ul>
        </div>
        <div class="col-6 col-md-2">
          <p class="small fw-bold text-uppercase mb-2">Get Involved</p>
          <ul class="list-unstyled small">
            <li>
              <router-link class="text-white-50 text-decoration-none" to="/contact"
                >Volunteer</router-link
              >
            </li>
            <li>
              <router-link class="text-white-50 text-decoration-none" to="/contact"
                >Donate</router-link
              >
            </li>
          </ul>
        </div>
        <div class="col-6 col-md-2">
          <p class="small fw-bold text-uppercase mb-2">About</p>
          <ul class="list-unstyled small">
            <li>
              <router-link class="text-white-50 text-decoration-none" to="/about"
                >Our Story</router-link
              >
            </li>
            <li>
              <router-link class="text-white-50 text-decoration-none" to="/about"
                >Impact Reports</router-link
              >
            </li>
          </ul>
        </div>
      </div>
      <hr class="border-secondary mt-4 mb-3" />
      <p class="small text-white-50 mb-0 text-center">Longview Inc. &middot; Melbourne, VIC</p>
    </div>
  </footer>
</template>
