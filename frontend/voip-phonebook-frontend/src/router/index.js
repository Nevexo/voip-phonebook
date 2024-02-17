import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Login from '../views/Login.vue'
import UserManagement from '../views/UserManagement.vue'
import UserEdit from '../views/UserEdit.vue'
import CreateUser from '../views/CreateUser.vue'
import CreateSite from '../views/CreateSite.vue'
import SiteEdit from '../views/Site.vue'
import Sites from '../views/Sites.vue'
import { auth } from '../main'

const is_authenticated_guard = async (to, from) => {
  if (await auth.get_session() != null) {
    return true;
  } else {
    return '/login';
  }
}

const is_root_guard = async (to, from) => {
  return auth.user.root_user;
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      beforeEnter: is_authenticated_guard
    },
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/users',
      name: 'users',
      component: UserManagement,
      beforeEnter: [is_authenticated_guard, is_root_guard]
    },
    {
      path: '/users/create-user',
      name: 'create-user',
      component: CreateUser,
      beforeEnter: [is_authenticated_guard, is_root_guard]
    },
    {
      path: '/user/:id',
      name: 'user',
      params: true,
      component: UserEdit,
      beforeEnter: [is_authenticated_guard, is_root_guard]
    },
    {
      path: '/sites',
      name: 'sites',
      component: Sites,
      beforeEnter: is_authenticated_guard
    },
    {
      path: '/sites/create-site',
      name: 'create-site',
      component: CreateSite,
      beforeEnter: [is_authenticated_guard, is_root_guard]
    },
    {
      path: '/site/:id',
      name: 'site',
      params: true,
      component: SiteEdit,
      beforeEnter: is_authenticated_guard
    }
  ]
})

export default router
