<script setup>
import Navigation from '@/components/Navigation.vue'
import { ref } from 'vue'
import { auth } from '../main'
import { get_user, update_root_status, delete_user } from '../api/user_mgmt';
import { useRouter, useRoute } from 'vue-router'
import { onMounted } from 'vue';

import ConfirmModal from '@/components/ConfirmModal.vue'

const user = ref({})

const confirmModalState = ref(false)
const confirmModalHeading = ref('')
const confirmModalMessage = ref('')
const confirmModalConfirmButtonText = ref('')
const confirmModalConfirmButtonAction = ref(() => {})

const router = useRouter()

const fetchUser = async (id) => {
  const result = await get_user(id)
  if (!result) {
    // Redirect to user management page if user doesn't exist
    router.push({ name: 'users' })
  }
  user.value = result
}

onMounted(async () => {
  const route = useRoute()
  await fetchUser(route.params.id)
})

const confirmRootPromotion = (state, user_id) => {
  if (state) {
    // Upgrading to root
    confirmModalHeading.value = 'Promote to Root User'
    confirmModalMessage.value = 'Are you sure you want to promote this user to root user?'
    confirmModalConfirmButtonText.value = 'Promote'
    confirmModalConfirmButtonAction.value = async () => { 
      confirmModalState.value = false
      await update_root_status(user_id, true)
      await fetchUser(user_id)
    }
  } else {
    // Demoting from root
    confirmModalHeading.value = 'Demote this User'
    confirmModalMessage.value = 'Are you sure you wish to remove root access from this user?'
    confirmModalConfirmButtonText.value = 'Promote'
    confirmModalConfirmButtonAction.value = async () => { 
      confirmModalState.value = false
      await update_root_status(user_id, false)
      await fetchUser(user_id)
     }
  }
  confirmModalState.value = true
}

const confirmUserDelete = (user_id) => {
  confirmModalState.value = true
  confirmModalHeading.value = 'Delete User'
  confirmModalMessage.value = 'Are you sure you want to delete this user?'
  confirmModalConfirmButtonText.value = 'Delete'
  confirmModalConfirmButtonAction.value = async () => { 
    confirmModalState.value = false
    await delete_user(user_id)
    router.push({ name: 'users' })
   }
}

</script>

<template>
  <Navigation />
  <ConfirmModal
    :show_state="confirmModalState" 
    :heading="confirmModalHeading" 
    :message="confirmModalMessage" 
    :confirm_button_text="confirmModalConfirmButtonText"
    :confirm_button_action="confirmModalConfirmButtonAction"
  />
  <div class="container">
    <!-- Back button -->
    <div class="mt-8">
      <router-link to="/users" class="flex items-center gap-1">
        <i class="fa-solid fa-arrow-left"></i>
        <span>Back to User Management</span>
      </router-link>
    </div>
    <h1 class="text-4xl font-bold mt-8">{{ user.name }}</h1>
    <p class="mt-4">
      <!-- Tailwind badge -->
      <span v-if="user.root_user" class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">Root</span>
      <span class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">UID: {{ user.id }}</span>
    </p>
    <div class="border-b border-gray-200 mt-8"></div>

    <!-- Card based user information -->
    <!-- Card for creation date/last login date -->
    <!-- Card for user description -->
    <!-- Card for root status -->
    <div class="grid grid-cols-1 gap-4 mt-8 sm:grid-cols-2">
      <!-- User information card -->
      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg font-medium leading-6 text-gray-900">User Information</h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500">Details about the user.</p>
        </div>
        <div class="border-t border-gray-200">
          <dl>
            <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Created</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:col-span-2">{{ new Date(user.created_at).toLocaleString() }}</dd>
            </div>
            <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Last Login</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:col-span-2">{{ new Date(user.last_login).toLocaleString() }}</dd>
            </div>
            <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Email Address</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:col-span-2">{{ user.email_address }}</dd>
            </div>
            <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Remark</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:col-span-2">{{ user.remark || "Not specified" }}</dd>
            </div>
            <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">User Management Actions</dt>
              <dd v-if="user.id != auth.user.id" class="mt-1 text-sm text-gray-900 sm:col-span-2">
                <button @click="confirmUserDelete(user.id)" class="flex items-center gap-1 bg-red-50 rounded-md px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-700/10">Delete User</button>
              </dd>
              <dd v-else class="mt-1 text-sm text-gray-900 sm:col-span-2">You cannot delete your own account.</dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- Root Management Card -->
      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg font-medium leading-6 text-gray-900">Administrator Access</h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500">Manage the root management status of this account.</p>
        </div>
        <div class="border-t border-gray-200">
          <!-- Red warning message -->
          <dl>
            <div class="bg-red-50 px-4 py-5 sm:px-6">
              <p class="text-sm text-red-700">Root mode allows a user to access user management, all sites and all phonebooks. Apply only to employees.</p>
            </div>
          </dl>
          <dl>
            <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Current User Level</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:col-span-2">
                <span v-if="user.root_user" class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">Root User</span>
                <span v-else class="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-700/10">Standard User</span>
              </dd>
            </div>
            <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Actions</dt>
              <dd v-if="user.id != auth.user.id" class="mt-1 text-sm text-gray-900 sm:col-span-2">
                <button v-if="!user.root_user" @click="confirmRootPromotion(true, user.id)" class="flex items-center gap-1 bg-indigo-50 rounded-md px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">Promote to Root User</button>
                <button v-else @click="confirmRootPromotion(false, user.id)" class="flex items-center gap-1 bg-gray-50 rounded-md px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-700/10">Revoke Root User Access</button>
              </dd>
              <dd v-else class="mt-1 text-sm text-gray-900 sm:col-span-2">
                <dd class="mt-1 text-sm text-gray-900 sm:col-span-2">You cannot modify the root state of your own account.</dd>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- Password management card -->
      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg font-medium leading-6 text-gray-900">Password Settings</h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500">Update this user's password.</p>
        </div>
        <div class="border-t border-gray-200">
          <div v-if="false" class="bg-green-50 px-4 py-5 sm:px-6">
            <p class="text-sm text-green-700">Password updated.</p>
          </div>

          <div class="bg-white px-4 py-5 sm:px-6">
            <form>
              <div class="grid grid-cols-1 gap-6">
                <div>
                  <label for="password" class="block text-sm font-medium text-gray-700">New Password</label>
                  <input type="password" name="password" id="password" autocomplete="new-password" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-phonebook-primary sm:text-sm sm:leading-6">
                </div>
                <div>
                  <label for="password_confirm" class="block text-sm font-medium text-gray-700">Confirm Password</label>
                  <input type="password" name="password_confirm" id="password_confirm" autocomplete="new-password" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-phonebook-primary sm:text-sm sm:leading-6">
                </div>
                <div>
                  <button type="submit" class="flex w-full justify-center rounded-md bg-phonebook-primary px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-phonebook-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-phonebook-primary">Change Password</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Session management -->
      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg font-medium leading-6 text-gray-900">Session Management</h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500">Manage this user's sessions.</p>
        </div>
        <div class="border-t border-gray-200">
          <!-- Red warning message -->
          <div class="bg-amber-50 px-4 py-5 sm:px-6">
            <p class="text-sm text-amber-700">Session management has not yet been implemented.</p>
          </div>
        </div>
      </div>
    </div>
    
  </div>
</template>
