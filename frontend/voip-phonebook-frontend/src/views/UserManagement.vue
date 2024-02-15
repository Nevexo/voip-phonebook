<script setup>
import Navigation from '@/components/Navigation.vue'
import { auth } from '../main'
import { get_users } from '../api/user_mgmt';

import { ref } from 'vue'

const users = ref([])

const fetchUsers = async () => {
  const result = await get_users()
  users.value = result
}

fetchUsers()
</script>

<template>
  <Navigation />
  <div class="container">
    <h1 class="text-4xl font-bold mt-8">User Management</h1>
    <p class="mt-4">Create and manager users within Triarom Contacts.</p>
    <!-- Horizontal line -->
    <div class="border-b border-gray-200 mt-8"></div>
    
    <!-- User list table -->
    <div class="mt-8">
      <table class="w-full">
        <thead class="w-full text-sm text-left rtl:text-right text-gray-500">
          <tr class="text-xs text-gray-700 uppercase bg-gray-50">
            <th class="text-left">Name</th>
            <th class="text-left">Email</th>
            <th class="text-left">Last Login</th>
            <th class="text-left">Flags</th>
            <th class="text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr class="bg-white border-b" v-for="user in users">
            <td>{{ user.name }}</td>
            <td>{{ user.email_address }}</td>
            <td>{{ new Date(user.last_login).toLocaleString() }}</td>
            <td>
              <span v-if="user.root_user" class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">Root</span>
            </td>
            <td>
              <RouterLink :to="{name: 'user', params: {id: user.id}}" class="text-indigo-600 hover:text-indigo-900">Edit</RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>