<script setup>
import { computed, ref } from 'vue'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'
import { useAuth } from '../composables/useAuth'
import { useRatings } from '../composables/useRatings'
import coursesData from '../data/courses.json'
import { useLocalStorage } from '../composables/useLocalStorage'
import { useOnlineStatus } from '../composables/useOnlineStatus'

const { currentUser } = useAuth()
const { isOnline } = useOnlineStatus()
const { getUserRating } = useRatings()
const bookmarkedIds = useLocalStorage('longview:savedCourseIds', [])

const bookmarkedCourses = computed(() =>
    coursesData.filter((c) => bookmarkedIds.value.includes(c.id))
)

const ratedCourses = computed(() =>
    coursesData
        .map((c) => ({ course: c, stars: getUserRating(c.id, currentUser.value?.id) }))
        .filter((r) => r.stars > 0)
)

// BR D.2: compose an email and send it through the sendLearningSummary
// Cloud Function. The recipient is the signed-in user's own address and is
// picked on the server from their login token, so it is shown here but can't
// be edited. The function repeats every check, because browser checks can be bypassed.
const SUBJECT_MIN = 3
const SUBJECT_MAX = 100
const NOTE_MAX = 300

const email = ref({
    subject: 'Your Longview learning summary',
    note: '',
    includeBookmarks: true,
    includeRatings: true,
})

const errors = ref({ subject: null, note: null, selection: null })

const validateSubject = (blur) => {
    const length = email.value.subject.trim().length
    if (length < SUBJECT_MIN) {
        if (blur) errors.value.subject = `Subject must be at least ${SUBJECT_MIN} characters.`
    } else if (length > SUBJECT_MAX) {
        errors.value.subject = `Subject must be ${SUBJECT_MAX} characters or fewer.`
    } else {
        errors.value.subject = null
    }
}

const validateNote = () => {
    errors.value.note =
        email.value.note.length > NOTE_MAX ? `Note must be ${NOTE_MAX} characters or fewer.` : null
}

// PDF content, depending on the two checkboxes.
const bookmarksToSend = computed(() => (email.value.includeBookmarks ? bookmarkedCourses.value : []))
const ratingsToSend = computed(() => (email.value.includeRatings ? ratedCourses.value : []))

const validateSelection = () => {
    errors.value.selection =
        bookmarksToSend.value.length + ratingsToSend.value.length === 0
            ? 'Choose at least one bookmarked or rated course to include.'
            : null
}

const sendStatus = ref('idle') // idle | sending | sent | error
const sendMessage = ref('')

async function sendSummary() {
    validateSubject(true)
    validateNote()
    validateSelection()
    if (errors.value.subject || errors.value.note || errors.value.selection) return

    sendStatus.value = 'sending'
    sendMessage.value = ''
    try {
        const call = httpsCallable(functions, 'sendLearningSummary')
        const result = await call({
            subject: email.value.subject.trim(),
            note: email.value.note.trim(),
            bookmarked: bookmarksToSend.value.map((c) => c.title),
            rated: ratingsToSend.value.map((r) => ({ title: r.course.title, stars: r.stars })),
        })
        sendStatus.value = 'sent'
        sendMessage.value = `Sent to ${result.data.to}. It can take a minute to arrive, so check your spam folder too.`
        email.value.note = ''
    } catch (err) {
        sendStatus.value = 'error'
        //  errors carry a safe, human-readable message written on the server.
        sendMessage.value = err.message || 'Could not send the email.'
    }
}

// BR F.1 GenAI - Learning Coach. The askCoach Cloud Function calls Gemini, so
// the API key never reaches the browser. Only course titles are sent.
const coachStatus = ref('idle') // idle | loading | done | error
const coachText = ref('')
const coachError = ref('')

async function askCoach() {
  coachStatus.value = 'loading'
  coachError.value = ''
  try {
    const ask = httpsCallable(functions, 'askCoach')
    const result = await ask({
      bookmarked: bookmarkedCourses.value.map((c) => c.title),
      rated: ratedCourses.value.map((r) => ({ title: r.course.title, stars: r.stars })),
    })
    coachText.value = result.data.suggestion
    coachStatus.value = 'done'
  } catch (err) {
    coachError.value = (err.message || 'The coach is unavailable right now.').replace(/\s*\[\d+\]\s*$/, '')
    coachStatus.value = 'error'
  }
}

</script>

<template>
    <div class="container py-5" style="max-width: 720px">
        <h1 class="mb-1">Welcome back, {{ currentUser?.name }}</h1>
        <p class="text-muted mb-4">
            Role: <span class="badge text-bg-secondary">{{ currentUser?.role }}</span>
        </p>
        <form class="card card-body mb-4" novalidate @submit.prevent="sendSummary">
            <h2 class="h6 mb-1">Email me my learning summary</h2>
            <p class="small text-muted mb-3">
                We'll build a PDF of your courses and attach it to an email.
            </p>

            <div class="mb-3">
                <label for="mailTo" class="form-label small fw-semibold mb-1">To</label>
                <input id="mailTo" type="email" class="form-control form-control-sm" :value="currentUser?.email"
                    readonly />
                <div class="form-text">Sent to your account address only.</div>
            </div>

            <div class="mb-3">
                <label for="mailSubject" class="form-label small fw-semibold mb-1">Subject</label>
                <input id="mailSubject" v-model="email.subject" type="text" class="form-control form-control-sm"
                    :class="{ 'is-invalid': errors.subject }" :aria-invalid="errors.subject ? 'true' : 'false'"
                    aria-describedby="mailSubjectError" @blur="validateSubject(true)" @input="validateSubject(false)" />
                <div id="mailSubjectError" class="invalid-feedback">{{ errors.subject }}</div>
            </div>

            <fieldset class="mb-3">
                <legend class="form-label small fw-semibold mb-1">Include in the PDF</legend>
                <div class="form-check">
                    <input id="incBookmarks" v-model="email.includeBookmarks" type="checkbox" class="form-check-input"
                        @change="validateSelection" />
                    <label class="form-check-label small" for="incBookmarks">
                        Bookmarked courses ({{ bookmarkedCourses.length }})
                    </label>
                </div>
                <div class="form-check">
                    <input id="incRatings" v-model="email.includeRatings" type="checkbox" class="form-check-input"
                        @change="validateSelection" />
                    <label class="form-check-label small" for="incRatings">
                        Courses I've rated ({{ ratedCourses.length }})
                    </label>
                </div>
                <p v-if="errors.selection" class="small text-danger mt-1 mb-0" role="alert">
                    {{ errors.selection }}
                </p>
            </fieldset>

            <div class="mb-3">
                <label for="mailNote" class="form-label small fw-semibold mb-1">
                    Add a note <span class="fw-normal text-muted">(optional)</span>
                </label>
                <textarea id="mailNote" v-model="email.note" rows="3" class="form-control form-control-sm"
                    :class="{ 'is-invalid': errors.note }" :aria-invalid="errors.note ? 'true' : 'false'"
                    aria-describedby="mailNoteCount mailNoteError" @input="validateNote"></textarea>
                <div class="d-flex justify-content-between">
                    <div id="mailNoteError" class="invalid-feedback d-block me-3">{{ errors.note }}</div>
                    <div id="mailNoteCount" class="form-text ms-auto text-nowrap"
                        :class="{ 'text-danger': email.note.length > NOTE_MAX }">
                        {{ email.note.length }} / {{ NOTE_MAX }}
                    </div>
                </div>
            </div>

            <p class="small text-muted mb-3">
                Attachment: <strong>longview-learning-summary.pdf</strong>
            </p>

            <div>
                <button type="submit" class="btn btn-dark btn-sm" :disabled="sendStatus === 'sending' || !isOnline">
                    {{ sendStatus === 'sending' ? 'Sending…' : 'Send email' }}
                </button>
                <p v-if="!isOnline" class="small text-muted mt-2 mb-0">You're offline. Reconnect to send your summary.</p>
            </div>

            <p v-if="sendMessage" class="small mt-3 mb-0"
                :class="sendStatus === 'sent' ? 'text-success' : 'text-danger'" role="status">
                {{ sendMessage }}
            </p>
        </form>

      <section class="card card-body mb-4" aria-labelledby="coach-heading">
            <h2 id="coach-heading" class="h5">Learning Coach</h2>
            <p class="small text-muted">
                Get a short AI suggestion for what to learn next, based on the courses you bookmarked and rated.
                Only course titles are sent.
            </p>
            <div>
                <button type="button" class="btn btn-dark btn-sm" :disabled="coachStatus === 'loading' || !isOnline"
                    @click="askCoach">
                    {{ coachStatus === 'loading' ? 'Thinking…' : 'Suggest what to learn next' }}
                </button>
                <p v-if="!isOnline" class="small text-muted mt-2 mb-0">You're offline. Reconnect to ask the coach.</p>
            </div>
            <div aria-live="polite">
                <p v-if="coachStatus === 'done'" class="mt-3 mb-0" style="white-space: pre-line">{{ coachText }}</p>
                <p v-if="coachStatus === 'error'" class="small text-danger mt-3 mb-0" role="alert">{{ coachError }}</p>
            </div>
        </section>

        <h2 class="h5 mt-4 mb-3">Bookmarked Courses</h2>
        <p v-if="bookmarkedCourses.length === 0" class="text-muted">
            You haven't bookmarked any courses yet. Head to
            <router-link to="/courses">Learn</router-link> to find one.
        </p>
        <ul v-else class="list-group mb-4">
            <li v-for="course in bookmarkedCourses" :key="course.id" class="list-group-item">
                {{ course.title }}
            </li>
        </ul>

        <h2 class="h5 mt-4 mb-3">Courses You've Rated</h2>
        <p v-if="ratedCourses.length === 0" class="text-muted">
            You haven't rated any courses yet.
        </p>
        <ul v-else class="list-group">
            <li v-for="entry in ratedCourses" :key="entry.course.id"
                class="list-group-item d-flex justify-content-between">
                {{ entry.course.title }}
                <span>{{ '★'.repeat(entry.stars) }}{{ '☆'.repeat(5 - entry.stars) }}</span>
            </li>
        </ul>
    </div>
</template>