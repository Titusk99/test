import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import SkillsPage from '../views/SkillsPage.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import About from '../views/About.vue'
import HowItWorks from '../views/HowItWorks.vue'
import Faq from '../views/Faq.vue'
import Contact from '../views/Contact.vue'
import Message from '../views/Message.vue'
import ConversationDetail from '../views/ConversationDetail.vue'
import Profile from '../views/Profile.vue'
import Favorite from '../views/Favorite.vue'
import SkillDetail from '../views/SkillDetail.vue'
import MatchPage from '../views/MatchPage.vue'
import Rgpd from '../views/Rgpd.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/skills',
    name: 'Skills',
    component: SkillsPage,
  },
  {
    path: '/skills/:id',
    name: 'SkillDetail',
    component: SkillDetail,
  },
  {
    path: '/match',
    name: 'Match',
    component: MatchPage,
  },
  {
    path: '/messages',
    name: 'Messages',
    component: Message,
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: Favorite,
  },
  {
    path: '/messages/:id',
    name: 'ConversationDetail',
    component: ConversationDetail,
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
  },
  {
    path: '/about',
    name: 'About',
    component: About,
  },
  {
    path: '/how-it-works',
    name: 'HowItWorks',
    component: HowItWorks,
  },
  {
    path: '/faq',
    name: 'Faq',
    component: Faq,
  },
  {
    path: '/contact',
    name: 'Contact',
    component: Contact,
  },
  {
    path: '/rgpd',
    name: 'Rgpd',
    component: Rgpd,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
