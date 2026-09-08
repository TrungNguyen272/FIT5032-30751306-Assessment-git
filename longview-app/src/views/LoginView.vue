<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const route = useRoute()
const { login } = useAuth()

const form = reactive({ email: '', password: '' })
const errors = reactive({ email: '', password: '' })
const errorMessage = ref('')
const isSubmitting = ref(false)

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate() {
    if (!form.email.trim()) {
        errors.email = 'Please enter your email.'
    } else if (!EMAIL_PATTERN.test(form.email.trim())) {
        errors.email = 'Please enter a valid email address.'
    } else {
        errors.email = ''
    }
    errors.password = form.password ? '' : 'Please enter your password.'

    return !errors.email && !errors.password
}
async function handleSubmit() {
    errorMessage.value = ''
    if (!validate())
        return

    isSubmitting.value = true
    const result = await login(form)
    isSubmitting.value = false

    if (!result.success) {
        errorMessage.value = result.error
        return
    }
    router.push(route.query.redirect || '/dashboard')
}
</script>

<template>
    <div class="container py-5" style="max-width: 480px">
        <h1 class="mb-4">Welcome Back</h1>

        <div v-if="errorMessage" class="alert alert-danger" role="alert">
            {{ errorMessage }}
        </div>
        <form novalidate @submit.prevent="handleSubmit">
            <div class="mb-3">
                <label for="email" class="form-label">Email address</label>
                <input id="email" v-model="form.email" type="email" class="form-control"
                    :class="{ 'is-invalid': errors.email }" autocomplete="email" />
                <div v-if="errors.email" class="invalid-feedback">{{ errors.email }}</div>
            </div>
            <div class="mb-3">
                <label for="password" class="form-label">Password</label>
                <input id="password" v-model="form.password" type="password" class="form-control"
                    :class="{ 'is-invalid': errors.password }" autocomplete="current-password" />
                <div v-if="errors.password" class="invalid-feedback">{{ errors.password }}</div>
            </div>
            <button type="submit" class="btn btn-dark w-100" :disabled="isSubmitting">
                {{ isSubmitting ? 'Logging in ...' : 'Log In' }}
            </button>
        </form>

        <p class="text-muted small mt-3 text-center">
            Don't have an account? <router-link to="/register">Register here</router-link>
        </p>
    </div>
</template>