<script setup>
import { auth } from '../main'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('');
const error_help = ref('');
const logged_out_msg = ref(false);

onMounted(async () => {
  // Check if user is already logged in
  const user = await auth.get_session();
  if (user != null) {
    // Redirect to home page
    router.push({ name: 'home' })
    return;
  }
  
  // Display logged out message if query parameter is present
  if (router.currentRoute.value.query.logout) {
    logged_out_msg.value = true;
  }

  // Clear query parameter
  router.push({ query: null })
})


const doLogin = async (email, password) => {
  const result = await auth.login(email, password)
  if (result.error == undefined) {
    // Redirect to home page
    router.push({ name: 'home' })
  }

  if (result.error) {
    switch (result.error) {
      case "user_does_not_exist":
        error.value = "Email address or password is incorrect"
        error_help.value = "Please check your details and try again."
        break;
      case "login_failed":
        error.value = "Login failed"
        error_help.value = "Please check your details and try again."
        break;
      default:
        error.value = "An error occurred"
        error_help.value = "Please try again later."
        break;
    }
  }
}
</script>

<template>
  <div class="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <p class="font-bold text-3xl text-center">
        <i class="fa-solid fa-address-book text-3xl"></i> Triarom Contacts
        <span class="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">Beta</span>
      </p>
      <h2 class="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">Sign in to your account</h2>
    </div>

    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm space-y-6">
      <form class="space-y-6" @submit.prevent="doLogin(email, password)">
        <div>
          <label for="email" class="block text-sm font-medium leading-6 text-gray-900">Email address</label>
          <div class="mt-2">
            <input v-model="email" name="email" type="email" autocomplete="email" required class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-phonebook-primary sm:text-sm sm:leading-6">
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between">
            <label for="password" class="block text-sm font-medium leading-6 text-gray-900">Password</label>
          </div>
          <div class="mt-2">
            <input v-model="password" name="password" type="password" autocomplete="current-password" required class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-phonebook-primary sm:text-sm sm:leading-6">
          </div>
        </div>

        <div>
          <button type="submit" class="flex w-full justify-center rounded-md bg-phonebook-primary px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-phonebook-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-phonebook-primary">Sign in</button>
        </div>
      </form> 

      <!-- Display green rounded box if logged out -->
      <div v-if="logged_out_msg" class="mt-6 bg-green-100 rounded-md p-4">
        <p class="text-black">
          <b>You have been logged out</b>
          <p>You have been successfully logged out of your account.</p>
        </p>
      </div>

      <!-- Display red rounded box if password wrong -->
      <div v-if="error" class="mt-6 bg-red-100 rounded-md p-4">
        <p class="text-black">
          <b>{{ error }}</b>
          <p>{{ error_help }}</p>
        </p>
      </div>

      <!-- Rounded light gray box -->
      <div class="mt-6 bg-gray-200 rounded-md p-4">
        <p class="text-sm text-gray-900">
          <b>Forgotten your Details?</b>
          <p>We don't currently support self-service password resetting.</p>
          <br/>
          <p>Please contact Triarom on <b>015394 44639</b> for assistance.</p>
        </p>
      </div>
      <p class="mt-10 text-center text-sm text-gray-500">
        &copy 2024 Cameron Fleming. All rights reserved.
      </p>
    </div>
  </div>
</template>
