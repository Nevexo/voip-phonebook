<script setup>
import Navigation from '@/components/Navigation.vue';
import { create_user } from '../api/user_mgmt';
import { useRouter } from 'vue-router';
import { ref } from 'vue';

const router = useRouter();

const error = ref(false);

const createUser = async (display_name, email, password) => {
  const result = await create_user(display_name, email, password);
  if (result.error == undefined) {
    router.push({ name: 'user', params: { id: result.id }});
  } else {
    error.value = result.error;
  }
};
</script>

<template>
  <Navigation />
  <div class="container">
    <h1 class="text-4xl font-bold mt-8">Create User</h1>
    <p class="mt-4">Create a new user within Triarom Contacts.</p>
    <!-- Horizontal line -->
    <div class="border-b border-gray-200 mt-8"></div>
    <!-- Form for display name, email and password -->
    <div class="mt-8">
      <form @submit.prevent="createUser(display_name, email, password)">
        <div class="grid grid-cols-1 gap-6">
          <div>
            <label for="display_name" class="block text-sm font-medium text-gray-700">Display Name</label>
            <div class="mt-1">
              <input type="text" name="display_name" v-model="display_name" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
            </div>
          </div>
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
            <div class="mt-1">
              <input type="email" name="email" v-model="email" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
            </div>
          </div>
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
            <div class="mt-1">
              <input type="password" name="password" v-model="password" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
            </div>
          </div>
        </div>
        <div class="mt-4">
          <p class="text-sm text-gray-500">Root access can be enabled once the user has been created.</p>
        </div>
        <div class="mt-8">
          <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">Create User</button>
        </div>
      </form>
      <!-- Error message in rounded red box -->
      <div class="mt-4" v-if="error">
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong class="font-bold">Failed to create new user</strong>
          <br/>
          <span class="block sm:inline">Server Message: {{ error }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

