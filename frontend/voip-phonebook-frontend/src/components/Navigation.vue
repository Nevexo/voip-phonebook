<script setup>
import { RouterLink } from 'vue-router'
import { auth } from '../main'
import { useRouter } from 'vue-router'

const router = useRouter()

const doLogout = async () => {
  await auth.logout()
  // Redirect to login page
  router.push({ name: 'login', query: { logout: true }})
}
</script>

<template>
  <header class="sticky top-0 bg-slate-800 shadow-lg">
    <nav class="container flex flex-col sm:flex-row items-center gap-4 text-white py-4">

      <RouterLink :to="{name: 'home'}">
        <div class="flex items-center gap-3">
          <i class="fa-solid fa-address-book text-2xl"></i>
          <p class="font-bold text-2xl">Triarom Contacts</p>
          <span class="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">Beta</span>
        </div>
      </RouterLink>


      <div class="flex gap-3 flex-1 justify-end">
        <!-- Root user flag -->
        <span v-if="auth.user.root_user" class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">Root Access</span>
        <!-- Sites Link -->
        <RouterLink :to="{name: 'sites'}" class="flex items-center gap-1">
          <i class="fa-solid fa-building"></i>
          <span>Sites</span>
        </RouterLink>
        <!-- User management link -->
        <RouterLink v-if="auth.user.root_user" :to="{name: 'users'}" class="flex items-center gap-1">
          <i class="fa-solid fa-users"></i>
          <span>Users</span>
        </RouterLink>
        <!-- Change password link -->
        <RouterLink :to="{name: 'update-password'}" class="flex items-center gap-1">
          <i class="fa-solid fa-key"></i>
          <span>Change Password</span>
        </RouterLink>
        <!-- Logout link -->
        <button @click="doLogout" class="flex items-center gap-1">
          <i class="fa-solid fa-sign-out-alt"></i>
          <span>Logout</span>
        </button>
      </div>  
    </nav>
  </header>
</template>