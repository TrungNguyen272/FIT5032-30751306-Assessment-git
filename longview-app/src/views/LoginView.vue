<script setup>
import { nextTick, reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const route = useRoute()
const { login, loginWithGoogle, resetPassword } = useAuth()

const form = reactive({ email: '', password: '' })
const errors = reactive({ email: '', password: '' })
const errorMessage = ref('')
const infoMessage = ref('')
const isSubmitting = ref(false)

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * required-field check, then format check.
 */
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

function focusFirstError() {
    const firstField = ['email', 'password'].find((field) => errors[field])
    if (firstField) document.getElementById(firstField)?.focus()
}

async function handleSubmit() {
    errorMessage.value = ''
    if (!validate()) {
        nextTick(focusFirstError)
        return
    }

    isSubmitting.value = true
    const result = await login(form)
    isSubmitting.value = false

    if (!result.success) {
        errorMessage.value = result.error
        return
    }

    // Return to wherever the user was headed before being asked to log in,
    // or the dashboard by default.
    router.push(route.query.redirect || '/dashboard')
}

async function handleGoogle() {
    errorMessage.value = ''
    infoMessage.value = ''
    const result = await loginWithGoogle()
    if (!result.success) {
        errorMessage.value = result.error
        return
    }
    router.push(route.query.redirect || '/dashboard')
}

async function handleReset() {
    errorMessage.value = ''
    infoMessage.value = ''
    if (!form.email.trim() || !EMAIL_PATTERN.test(form.email.trim())) {
        errors.email = 'Enter your email above first, then click "Forgot password?".'
        nextTick(() => document.getElementById('email')?.focus())
        return
    }
    errors.email = ''
    const result = await resetPassword(form.email)
    if (!result.success) {
        errorMessage.value = result.error
        return
    }
    // Same wording whether or not the account exists.
    infoMessage.value = 'If an account exists for that email, a reset link is on its way.'
}
</script>

<template>
    <div class="container py-5" style="max-width: 480px">
        <h1 class="mb-4">Welcome Back</h1>

        <div v-if="errorMessage" class="alert alert-danger" role="alert">
            {{ errorMessage }}
        </div>

        <div v-if="infoMessage" class="alert alert-success" role="status">
            {{ infoMessage }}
        </div>

        <form novalidate @submit.prevent="handleSubmit">
            <div class="mb-3">
                <label for="email" class="form-label">Email address</label>
                <input id="email" v-model="form.email" type="email" class="form-control"
                    :class="{ 'is-invalid': errors.email }" :aria-invalid="errors.email ? 'true' : 'false'"
                    :aria-describedby="errors.email ? 'email-error' : null" autocomplete="email" />
                <div v-if="errors.email" id="email-error" class="invalid-feedback">{{ errors.email }}</div>
            </div>

            <div class="mb-3">
                <label for="password" class="form-label">Password</label>
                <input id="password" v-model="form.password" type="password" class="form-control"
                    :class="{ 'is-invalid': errors.password }" :aria-invalid="errors.password ? 'true' : 'false'"
                    :aria-describedby="errors.password ? 'password-error' : null" autocomplete="current-password" />
                <div v-if="errors.password" id="password-error" class="invalid-feedback">{{ errors.password }}</div>
            </div> 

            <button type="submit" class="btn btn-dark w-100" :disabled="isSubmitting">
                {{ isSubmitting ? 'Logging in...' : 'Log In' }}
            </button>

            <div class="text-end mt-2">
                <button type="button" class="btn btn-link btn-sm p-0" @click="handleReset">
                    Forgot password?
                </button>
            </div>
        </form>

        <div class="d-flex align-items-center my-3">
            <hr class="flex-grow-1" />
            <span class="px-2 text-muted small">or</span>
            <hr class="flex-grow-1" />
        </div>

        <button type="button" class="btn btn-outline-dark w-100" @click="handleGoogle">
            <span aria-hidden="true" class="me-1">G</span> Continue with Google
        </button>

        <p class="text-muted small mt-3 text-center">
            Don't have an account? <router-link to="/register">Register here</router-link>
        </p>
    </div>
</template>