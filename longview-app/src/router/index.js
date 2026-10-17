import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CoursesView from '../views/CoursesView.vue'
import ProgramsView from '../views/ProgramsView.vue'
import ContactView from '../views/ContactView.vue'
import AboutView from '../views/AboutView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import DashboardView from '../views/DashboardView.vue'
import AdminView from '../views/AdminView.vue'
import { useAuth, ROLES } from '../composables/useAuth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/courses', name: 'courses', component: CoursesView },
    { path: '/programs', name: 'programs', component: ProgramsView },
    { path: '/contact', name: 'contact', component: ContactView },
    { path: '/about', name: 'about', component: AboutView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/register', name: 'register', component: RegisterView },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: '/community',
      name: 'community',
      component: () => import('../views/CommunityView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView,

      meta: { requiresAuth: true, requiredRole: ROLES.ADMIN },
    },
  ],
})

/**
 * BR C.2 (Role-based authentication): this guard runs before
 * every navigation. Routes flagged with `meta.requiresAuth` redirect
 * an anonymous visitor to /login. Routes additionally flagged with
 * `meta.requiredRole` also check the logged-in user's role - a Member hitting
 * /admin directly is redirected home rather than shown the page,
 * enforced in the router, not just hidden from the nav bar.
 */
router.beforeEach(async (to) => {
  const { isLoggedIn, isAdmin, authReady } = useAuth()

  // Wait for Firebase to restore the session (e.g. after a page refresh)
  // before deciding whether this visitor is logged in.
  await authReady

  if (to.meta.requiresAuth && !isLoggedIn.value) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiredRole === ROLES.ADMIN && !isAdmin.value) {
    return { path: '/' }
  }

  return true
})

export default router
