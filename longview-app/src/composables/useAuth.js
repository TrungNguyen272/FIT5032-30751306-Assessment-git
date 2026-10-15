import { ref, computed } from 'vue'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { auth, db, functions, isFirebaseConfigured } from '../firebase'

/**
 * useAuth (BR C.1 / C.2, upgraded for BR D.1 External Authentication)
 *
 * Identity now comes from Firebase Authentication (email + password and
 * Google sign-in), so the app never stores or hashes a password itself.
 * That removes the weakest point of the earlier localStorage version.
 *
 * Authorisation (the Member/Admin role) lives in a Firestore document at
 * users/{uid}. The browser can only ever create that document as a
 * "member" - the Firestore rules enforce it - and the only way to become
 * an admin is the `assignRole` Cloud Function, which checks an invite
 * code on the server. So hiding a link or editing client code can't grant
 * admin rights.
 */

export const ROLES = {
  MEMBER: 'member',
  ADMIN: 'admin',
}

// Module-level state so every component shares one login session.
const currentUser = ref(null)
const authError = ref('')

// Used while registering: the Firebase user exists a moment before we've
// set their display name, and the profile doc should carry the real name.
let nameForNewAccount = ''

/** Turn Firebase's error codes into messages a person can act on. */
function friendlyMessage(err) {
  const messages = {
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/invalid-email': 'That email address is not valid.',
    'auth/user-not-found': 'Incorrect email or password.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Please choose a stronger password (at least 8 characters).',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
    'auth/network-request-failed': 'Network problem - check your connection and try again.',
    'auth/popup-closed-by-user': 'The Google sign-in window was closed before finishing.',
    'auth/popup-blocked': 'Your browser blocked the sign-in popup. Allow popups and try again.',
    'auth/user-disabled': 'This account has been disabled.',
  }
  return messages[err?.code] || 'Something went wrong. Please try again.'
}

const NOT_CONFIGURED = {
  success: false,

  error: 'Firebase is not configured yet. Add the VITE_FIREBASE_* values to .env.local.',
}

/**
 * Read the user's role document, creating a "member" profile the first
 * time we see them (this also covers first-time Google sign-ins).
 */
async function loadProfile(firebaseUser) {
  const profileRef = doc(db, 'users', firebaseUser.uid)
  let snapshot = await getDoc(profileRef)

  if (!snapshot.exists()) {
    const displayName =
      nameForNewAccount || firebaseUser.displayName || firebaseUser.email.split('@')[0]

    await setDoc(profileRef, {
      name: displayName,
      email: firebaseUser.email,
      role: ROLES.MEMBER,
      createdAt: serverTimestamp(),
    })
    snapshot = await getDoc(profileRef)
  }

  const profile = snapshot.data()
  currentUser.value = {
    id: firebaseUser.uid,
    name: profile.name,
    email: firebaseUser.email,
    role: profile.role,

    emailVerified: firebaseUser.emailVerified,
  }
}

// Resolves after Firebase has told us who is signed in.
// The router guard awaits this so a page refresh on /dashboard doesn't
// bounce a logged-in user to /login before their session is restored.
const authReady = new Promise((resolve) => {
  if (!isFirebaseConfigured) {
    resolve()
    return
  }

  onAuthStateChanged(auth, async (firebaseUser) => {
    try {
      if (firebaseUser) {
        await loadProfile(firebaseUser)
      } else {
        currentUser.value = null
      }
    } catch (err) {
      console.error('Could not load profile', err)
      authError.value = 'Signed in, but your profile could not be loaded.'
      currentUser.value = null
    } finally {
      resolve()
    }
  })
})

export function useAuth() {
  const isLoggedIn = computed(() => currentUser.value !== null)

  const isAdmin = computed(() => currentUser.value?.role === ROLES.ADMIN)

  async function register({ name, email, password, role, inviteCode }) {
    if (!isFirebaseConfigured) return NOT_CONFIGURED

    try {
      nameForNewAccount = name.trim()
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
      await updateProfile(credential.user, { displayName: nameForNewAccount })
      await loadProfile(credential.user)
      sendEmailVerification(credential.user).catch(() => {})

      // Admin sign-up is checked on the server, never in the browser.
      if (role === ROLES.ADMIN) {
        try {
          const assignRole = httpsCallable(functions, 'assignRole')
          await assignRole({ inviteCode })
          await loadProfile(credential.user)
        } catch (err) {
          return {
            success: true,
            roleError:
              'Your account was created as a Member because the admin invite code was not accepted.',
          }
        }
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: friendlyMessage(err) }
    } finally {
      nameForNewAccount = ''
    }
  }

  async function login({ email, password }) {
    if (!isFirebaseConfigured) return NOT_CONFIGURED
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
      return { success: true }
    } catch (err) {
      return { success: false, error: friendlyMessage(err) }
    }
  }

  async function loginWithGoogle() {
    if (!isFirebaseConfigured) return NOT_CONFIGURED
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
      return { success: true }
    } catch (err) {
      return { success: false, error: friendlyMessage(err) }
    }
  }

  async function resetPassword(email) {
    if (!isFirebaseConfigured) return NOT_CONFIGURED
    try {
      await sendPasswordResetEmail(auth, email.trim())
    } catch (err) {
      // Deliberately swallow "user-not-found" so the form can't be used
      // to discover which emails have accounts.
      if (err.code !== 'auth/user-not-found') {
        return { success: false, error: friendlyMessage(err) }
      }
    }

    return { success: true }
  }

  async function resendVerification() {
    if (!auth?.currentUser) return
    await sendEmailVerification(auth.currentUser)
  }

  async function logout() {
    if (isFirebaseConfigured) await signOut(auth)
    currentUser.value = null
  }

  return {
    currentUser,
    isLoggedIn,
    isAdmin,
    authError,
    authReady,
    register,
    login,
    loginWithGoogle,
    resetPassword,
    resendVerification,
    logout,
  }
}
