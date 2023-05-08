import { createRouter, createWebHistory } from 'vue-router'
import HomePageView from '../views/HomePageView.vue'
import CallPageView from '../views/CallPageView.vue'
import NoMatchView from '../views/NoMatchView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'HomePage',
      component: HomePageView
    },
    {
      path: '/room',
      name: 'CallPage',
      component: CallPageView,
      props: true
    },
    {
      path: '/NoMatch',
      name: 'NoMatch',
      component: NoMatchView
    }
  ]
})

export default router
