<script setup></script>

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
          <li class="nav-item ms-2">
            <button
              class="btn btn-light btn-sm"
              type="button"
              disabled
              title="Login/registration ships in the next milestone (BR C)"
            >
              Log In
            </button>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>
