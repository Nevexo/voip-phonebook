import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Login from '../views/Login.vue'
import UserManagement from '../views/UserManagement.vue'
import UserEdit from '../views/UserEdit.vue'
import CreateUser from '../views/CreateUser.vue'
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
    }
  ]
})

export default router
