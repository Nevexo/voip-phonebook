<script setup>
import Navigation from '@/components/Navigation.vue';
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { get_site, remove_authorised_user, add_authorised_user, delete_site } from '@/api/site_mgmt';
import { get_user, get_users } from '@/api/user_mgmt';
import { auth } from '../main';

import ConfirmModal from '@/components/ConfirmModal.vue'

const route = useRoute();
const router = useRouter();
const site = ref({'created_by': {}});
const authorised_users = ref([]);
const non_authorised_users = ref([]);
let users = [];

const confirmModalState = ref(false)
const confirmModalHeading = ref('')
const confirmModalMessage = ref('')
const confirmModalConfirmButtonText = ref('')
const confirmModalConfirmButtonAction = ref(() => {})

onMounted(async () => {
  const result = await get_site(route.params.id);
  if (result == null) {
    // Redirect to /sites
    router.push({ name: 'sites' });
    return;
  }

  site.value = result;

  if (auth.user.root_user) {
    // Populate authorised users
    users = await get_users();

    if (users == null) {
      return;
    }

    authorised_users.value = users.filter(user => result.authorised_users.includes(user.id));
    non_authorised_users.value = users.filter(user => !result.authorised_users.includes(user.id));
  }
});

const confirm_remove_authorised = (user_id) => {
  confirmModalState.value = true;
  confirmModalHeading.value = 'Remove Authorised User';
  confirmModalMessage.value = `Are you sure you want to remove ${authorised_users.value.find(user => user.id == user_id).name} (${user_id}) from the authorised users list?`;
  confirmModalConfirmButtonText.value = 'Remove';
  confirmModalConfirmButtonAction.value = () => {
    const result = remove_authorised_user(site.value.id, user_id);
    if (result.error != undefined) {
      // Handle the error with a message
      return;
    }

    authorised_users.value = authorised_users.value.filter(user => user.id != user_id);
    non_authorised_users.value.push(users.find(user => user.id == user_id));
    confirmModalState.value = false;
  }
}

const authorise_user = (user_id) => {
  const result = add_authorised_user(site.value.id, user_id);
  if (result.error != undefined) {
    // Handle the error with a message
    return;
  }

  non_authorised_users.value = non_authorised_users.value.filter(user => user.id != user_id);
  authorised_users.value.push(users.find(user => user.id == user_id));
}

const confirm_delete_site = () => {
  confirmModalState.value = true;
  confirmModalHeading.value = 'Delete Site';
  confirmModalMessage.value = 'Are you sure you want to delete this site?';
  confirmModalConfirmButtonText.value = 'Delete';
  confirmModalConfirmButtonAction.value = () => {
    const result = delete_site(site.value.id);
    if (result.error != undefined) {
      // Handle the error with a message
      return;
    }

    // Redirect to sites page
    router.push({ name: 'sites' });
  }
}
</script>

<template>
  <Navigation/>
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
      <router-link to="/sites" class="flex items-center gap-1">
        <i class="fa-solid fa-arrow-left"></i>
        <span>Back to Site Management</span>
      </router-link>
    </div>
    <h1 class="text-4xl font-bold mt-8">{{ site.name }}</h1>
    <div class="border-b border-gray-200 mt-8"></div>


    <div class="grid grid-cols-1 gap-4 mt-8 sm:grid-cols-2">
      <!-- Site information card -->
      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg font-medium leading-6 text-gray-900">Site Information</h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500">Details about this site.</p>
        </div>
        <div class="border-t border-gray-200">
          <dl>
            <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Name</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:col-span-2">{{ site.name }}</dd>
            </div>
            <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Creation Date</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:col-span-2">{{ new Date(site.created_at).toLocaleString() }}</dd>
            </div>
            <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Site Owner</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:col-span-2">{{ site.created_by.name }} ({{ site.created_by.email_address }})</dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- Authorised Users Card -->
      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg font-medium leading-6 text-gray-900">Authorised Users</h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500">Users who are authorised to manage this site.</p>
        </div>
        <div class="border-t border-gray-200">
            <dl>
              <div v-if="!auth.user.root_user" class="bg-red-100 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dd class="mt-1 text-sm text-gray-900 sm:col-span-2">
                  Please contact an administrator to update the authorised user list.<br/>
                  You will be able to update these in a future version of <a href="https://github.com/nevexo/voip-phonebook">voip-phonebook</a>.
                </dd>
              </div>
            </dl>
            <dl>
              <!-- Table of authorised_users with remove button -->
              <div v-if="auth.user.root_user" class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" v-for="user in authorised_users" :key="user.id">
                <dt class="text-sm font-medium text-gray-500">{{ user.name }}</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:col-span-2">
                  <button @click.prevent="confirm_remove_authorised(user.id)" class="flex items-center gap-1 bg-red-50 rounded-md px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-700/10">Remove</button>
                </dd>
              </div>
            </dl>
            <dl>
              <!-- Dropdown box of non-authorised users to add -->
              <div v-if="auth.user.root_user && non_authorised_users.length > 0" class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">Add Authorised User</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:col-span-2">
                  <select v-model="selected_user" class="border border-gray-200 rounded-md p-2 focus:outline-none px-10 focus:ring-2 focus:ring-indigo-600 focus:border-transparent">
                    <!-- Use first option as default -->
                    <option disabled value="">Select a user</option>
                    <option v-for="user in non_authorised_users" :key="user.id" :value="user.id">{{ user.name }}</option>
                  </select>
                  <button @click.prevent="authorise_user(selected_user)" class="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded">Add</button>
                </dd>
              </div>
            </dl>
        </div>
      </div>

      <!-- Site controls card -->
      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg font-medium leading-6 text-gray-900">Site Controls</h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500">Controls for this site.</p>
        </div>
        <div class="border-t border-gray-200">
          <dl>
            <div v-if="!auth.user.root_user" class="bg-red-100 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dd class="mt-1 text-sm text-gray-900 sm:col-span-2">
                There are currently no controls available to your user.
              </dd>
            </div>
          </dl>
          <dl>
            <div v-if="auth.user.root_user" class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Delete Site</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:col-span-2">
                <button @click.prevent="confirm_delete_site" class="flex items-center gap-1 bg-red-50 rounded-md px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-700/10">Delete Site</button>
              </dd>
            </div>
          </dl>
        </div>
    </div>
    </div>
  </div>
</template>