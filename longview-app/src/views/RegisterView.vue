<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth, ROLES } from '../composables/useAuth'

const router = useRouter()
const { register } = useAuth()

const form = reactive({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ROLES.MEMBER,
})

const errors = reactive({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
})

const submitError = ref('')
const isSubmitting = ref(false)

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

function validate() {
    errors.name = form.name ? '' : 'Please enter your name.'
    if (!form.email.trim()) {
        errors.email = 'Please enter your email.'
    } else if (!EMAIL_PATTERN.test(form.email.trim())) {
        errors.email = 'Please enter a valid email address.'
    } else {
        errors.email = ''
    }

    if (!form.password) {
        errors.password = 'Please choose a password.'
    } else if (form.password.length < MIN_PASSWORD_LENGTH) {
        errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
    } else {
        errors.password = ''
    }

    errors.confirmPassword = form.confirmPassword === form.password ? '' : 'Passwords do not match.'
    return !errors.name && !errors.email && !errors.password && !errors.confirmPassword
}

async function handleSubmit() {
    submitError.value = ''
    if (!validate())
        return

    isSubmitting.value = true
    const result = await register(form)
    isSubmitting.value = false

    if (!result.success) {
        submitError.value = result.error
        return
    }
    router.push('/dashboard')
}
</script>

<template>
    <div class="container py-5" style="max-width: 480px">
        <h1 class="mb-4">Join Longview</h1>

        <div v-if="submitError" class="alert alert-danger" role="alert">
            {{ submitError }}
        </div>

        <form novalidate @submit.prevent="handleSubmit">
            <div class="mb-3">
                <label for="name" class="form-label">Full name</label>
                <input id="name" v-model="form.name" type="text" class="form-control"
                    :class="{ 'is-invalid': errors.name }" />
                <div v-if="errors.name" class="invalid-feedback">{{ errors.name }}</div>
            </div>

            <div class="mb-3">
                <label for="email" class="form-label">Email address</label>
                <input id="email" v-model="form.email" type="email" class="form-control"
                    :class="{ 'is-invalid': errors.email }" />
                <div v-if="errors.email" class="invalid-feedback">{{ errors.email }}</div>
            </div>

            <div class="mb-3">
                <label for="password" class="form-label">Password</label>
                <input id="password" v-model="form.password" type="password" class="form-control"
                    :class="{ 'is-invalid': errors.password }" />
                <div v-if="errors.password" class="invalid-feedback">{{ errors.password }}</div>
            </div>

            <div class="mb-3">
                <label for="confirmPassword" class="form-label">Confirm password</label>
                <input id="confirmPassword" v-model="form.confirmPassword" type="password" class="form-control"
                    :class="{ 'is-invalid': errors.confirmPassword }" />
                <div v-if="errors.confirmPassword" class="invalid-feedback">{{ errors.confirmPassword }}</div>
            </div>

            <div class="mb-4">
                <label class="form-label d-block">I'm joining as</label>
                <div class="btn-group w-100" role="group">
                    <input id="roleMember" v-model="form.role" type="radio" class="btn-check" value="member" />
                    <label class="btn btn-outline-dark" for="roleMember">Member</label>

                    <input id="roleAdmin" v-model="form.role" type="radio" class="btn-check" value="admin" />
                    <label class="btn btn-outline-dark" for="roleAdmin">Admin</label>
                </div>
                <p class="form-text">
                    Admins get access to the admin dashboard.
                </p>
            </div>

            <button type="submit" class="btn btn-dark w-100" :disabled="isSubmitting">
                {{ isSubmitting ? 'Creating account ...' : 'Create Account' }}
            </button>
        </form>

        <p class="text-muted small mt-3 text-center">
            Already have an account? <router-link to="/login">Log in</router-link>
        </p>
    </div>
</template>
