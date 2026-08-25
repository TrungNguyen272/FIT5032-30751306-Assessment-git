<script setup>
import { reactive, ref } from 'vue'

const form = reactive({
  name: '',
  email: '',
  message: '',
  interest: 'volunteer',
})

const formErrors = reactive({
  name: '',
  email: '',
  message: '',
})

const wasSubmitted = ref(false)

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_MESSAGE_LENGTH = 15

/**
 * Validation 1 for Required field: name, email and message must not be empty.
 * Validation 2 for Format check: email must match a standard email pattern.
 * Validation 3 for Length check: message must be at least MIN_MESSAGE_LENGTH characters.
 */
function validateForm() {
  if (!form.name.trim()) {
    formErrors.name = 'Please tell us your name.'
  } else {
    formErrors.name = ''
  }

  if (!form.email.trim()) {
    formErrors.email = 'An email address is required.'
  } else if (!EMAIL_PATTERN.test(form.email.trim())) {
    formErrors.email = "That email doesn't look right please check the format."
  } else {
    formErrors.email = ''
  }

  if (!form.message.trim()) {
    formErrors.message = 'Let us know how we can help.'
  } else if (form.message.trim().length < MIN_MESSAGE_LENGTH) {
    formErrors.message = `Message needs at least ${MIN_MESSAGE_LENGTH} characters.`
  } else {
    formErrors.message = ''
  }

  return !formErrors.name && !formErrors.email && !formErrors.message
}

function handleSubmit() {
  wasSubmitted.value = false
  if (validateForm()) {
    wasSubmitted.value = true
    form.name = ''
    form.email = ''
    form.message = ''
    form.interest = 'volunteer'
  }
}
</script>

<template>
  <div class="container py-5" style="max-width: 640px">
    <h1 class="mb-3">Get Involved</h1>
    <p class="text-muted mb-4">Tell us how you'd like to help and we'll get back to you.</p>

    <div v-if="wasSubmitted" class="alert alert-success" role="alert">
      Thanks for reaching out. We will be in touch soon.
    </div>

    <form novalidate @submit.prevent="handleSubmit">
      <div class="row">
        <div class="col-6 mb-3">
          <label for="name" class="form-label">Full name</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            class="form-control"
            :class="{ 'is-invalid': formErrors.name }"
          />
          <div v-if="formErrors.name" class="invalid-feedback">{{ formErrors.name }}</div>
        </div>

        <div class="col-6 mb-3">
          <label for="email" class="form-label">Email address</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            class="form-control"
            :class="{ 'is-invalid': formErrors.email }"
          />
          <div v-if="formErrors.email" class="invalid-feedback">{{ formErrors.email }}</div>
        </div>
      </div>

      <div class="mb-3">
        <label for="interest" class="form-label">I'm interested in</label>
        <select id="interest" v-model="form.interest" class="form-select">
          <option value="volunteer">Volunteering</option>
          <option value="donate">Donating</option>
          <option value="partner">School / corporate partnership</option>
        </select>
      </div>

      <div class="mb-3">
        <label for="message" class="form-label">Message</label>
        <textarea
          id="message"
          v-model="form.message"
          rows="4"
          class="form-control"
          :class="{ 'is-invalid': formErrors.message }"
        ></textarea>
        <div v-if="formErrors.message" class="invalid-feedback">{{ formErrors.message }}</div>
      </div>

      <button type="submit" class="btn btn-dark">Send message</button>
    </form>
  </div>
</template>
