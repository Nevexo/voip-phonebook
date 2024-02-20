<script setup>
import Navigation from '@/components/Navigation.vue';
import { change_password } from '../api/user_mgmt';
import { auth } from '../main';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const show_form = ref(true);
const error = ref(null);

const update_password = async (password, password_confirmation) => {
  error.value = null;

  if (password !== password_confirmation) {
    error.value = "Passwords do not match";
    return;
  }

  const result = await change_password(auth.user.id, password_confirmation);
  if (result.error != undefined) {
    error.value = "Failed to update password: " + result.error;
    return;
  }

  show_form.value = false;
}
</script>

<template>
  <Navigation/>
  <div class="container">
    <div class="container mx-auto">
      <h1 class="text-3xl font-bold mt-8">Change your Password</h1>

      <!-- Horizontal line -->
      <div class="border-b border-gray-200 mt-8"></div>

      <div class="mt-8">
        <!-- Error message -->
        <div v-if="error" class="bg-red-100 border-t-4 border-red-500 rounded-b text-red-900 px-4 py-3 shadow-md" role="alert">
          <div class="flex">
            <div class="py-1">
              <svg class="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M10 3.5l-7 7-1.5-1.5 8.5-8.5 8.5 8.5-1.5 1.5-7-7z" />
              </svg>
            </div>
            <div>
              <p class="font-bold">Failed to Update Password</p>
              <p class="text-sm">
                {{ error }}
              </p>
            </div>
          </div>
        </div>

        <form v-if="show_form" @submit.prevent="update_password(password, password_confirmation)">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="password">
              New Password
            </label>
            <input v-model="password" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="password" type="password">
          </div>
          <div class="mb-6">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="password_confirmation">
              Confirm New Password
            </label>
            <input v-model="password_confirmation" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="password_confirmation" type="password">
          </div>
          <div class="flex items center justify-between">
            <button class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
              Update Password
            </button>
          </div>
        </form>

        <div v-else class="bg-green-100 border-t-4 border-green-500 rounded-b text-green-900 px-4 py-3 shadow-md" role="alert">
          <div class="flex">
            <div class="py-1">
              <svg class="fill-current h-6 w-6 text-green-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M2.5 3.5l15 15" />
              </svg>
            </div>
            <div>
              <p class="font-bold">Password Updated</p>
              <p class="text-sm">
                Your password has been updated successfully.
              </p>
              <!-- Link to / -->
              <div class="mt-4">
                <router-link to="/" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                  Continue
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div> 
    </div>
  </div>
</template>