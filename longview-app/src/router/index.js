import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CoursesView from '../views/CoursesView.vue'
import ProgramsView from '../views/ProgramsView.vue'
import ContactView from '../views/ContactView.vue'
import AboutView from '../views/AboutView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/courses', name: 'courses', component: CoursesView },
    { path: '/programs', name: 'programs', component: ProgramsView },
    { path: '/contact', name: 'contact', component: ContactView },
    { path: '/about', name: 'about', component: AboutView },
  ],
})

export default router
