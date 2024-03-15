<script setup>
import Navigation from '@/components/Navigation.vue';
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { get_site, remove_authorised_user, add_authorised_user, delete_site, get_phonebooks, get_fields, valid_types, create_field, delete_field } from '@/api/site_mgmt';
import { get_user, get_users } from '@/api/user_mgmt';
import { auth } from '../main';

import ConfirmModal from '@/components/ConfirmModal.vue'

const route = useRoute();
const router = useRouter();
const site = ref({'created_by': {}});
const error = ref({});
const authorised_users = ref([]);
const non_authorised_users = ref([]);
const phonebooks = ref([]);
const fields = ref([]);
let selected_user = '';
let users = [];

const confirmModalState = ref(false)
const confirmModalHeading = ref('')
const confirmModalMessage = ref('')
const confirmModalConfirmButtonText = ref('')
const confirmModalConfirmButtonAction = ref(() => {})
const hideCreateFieldForm = ref(true)

onMounted(async () => {
  const result = await get_site(route.params.id);
  if (result == null) {
    // Redirect to /sites
    router.push({ name: 'sites' });
    return;
  }
  site.value = result;

  // Get phonebooks
  phonebooks.value = await get_phonebooks(site.value.id);

  // Get fields
  fields.value = await get_fields(site.value.id);

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

const authorise_user = async (user_id) => {
  const result = await add_authorised_user(site.value.id, user_id);
  if (result.error != undefined) {
    error.value.title = "Failed to Authorise User"
    error.value.error = result.error;
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
  confirmModalConfirmButtonAction.value = async () => {
    const result = await delete_site(site.value.id);
    confirmModalState.value = false;
    if (result.error != undefined) {
      error.value.title = "Failed to Delete Site"
      switch (result.error) {
        case "site_has_phonebooks":
          error.value.error = "This site has phonebooks, which must be deleted first."
          break;
        default:
          error.value.error = result.error;
          break;
      }
      return;
    }

    // Redirect to sites page
    router.push({ name: 'sites' });
  }
}

const do_create_field = async (name = "", type = "text", required = false) => {
  const result = await create_field(site.value.id, name, type, required);
  if (result.error != undefined) {
    error.value.title = "Failed to Create Field"
    error.value.error = result.error;
    window.scrollTo(0, 0);
    return;
  }

  fields.value.push(result);
  hideCreateFieldForm.value = true;
}

const do_delete_field = async (field_id) => {
  // Show deletion modal
  confirmModalState.value = true;
  confirmModalHeading.value = "Delete Field"
  confirmModalMessage.value = "Are you sure you want to delete this field?"
  confirmModalConfirmButtonText.value = "Delete"
  confirmModalConfirmButtonAction.value = async () => {
    confirmModalState.value = false;
    const result = await delete_field(site.value.id, field_id);
    if (result.error != undefined) {
      error.value.title = "Failed to Delete Field"
      error.value.error = result.error;
      window.scrollTo(0, 0);
      return;
    }

    fields.value = fields.value.filter(field => field.id != field_id);
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

    <!-- Error message in red box -->
    <div v-if="error.error" class="bg-red-100 border-t-4 border-red-500 rounded-b text-red-900 px-4 py-3 shadow-md mt-8" role="alert">
      <div class="flex">
        <div class="py-1">
          <svg class="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M10 3.58l-6.58 6.42a1.5 1.5 0 0 0 2.08 2.16L10 8.16l4.5 4.5a1.5 1.5 0 0 0 2.08-2.16L10 3.58z" />
          </svg>
        </div>
        <div>
          <p class="font-bold">{{ error.title }}</p>
          <p class="text-sm">
            {{ error.error }}
          </p>
        </div>
      </div>
    </div>

    <!-- Full width card for phonebook table -->
    <div class="bg-white shadow overflow-hidden sm:rounded-lg mt-8">
      <div class="px-4 py-5 sm:px-6">
        <h3 class="text-lg font-medium leading-6 text-gray-900">Phonebooks</h3>
        <p class="mt-1 max-w-2xl text-sm text-gray-500">Phonebooks for this site.</p>
        <!-- New button right aligned -->
        <div class="flex justify-end mt-4">
          <router-link :to="{ path: `/site/${site.id}/new-phonebook` }" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">New Phonebook</router-link>
        </div>
      </div>
      <div class="border-t border-gray-200">
        <!-- Blue info box if no sites exist -->
        <div v-if="phonebooks.length == 0" class="bg-amber-50 px-4 py-5 sm:px-6">
            <p class="text-sm text-amber-700">
              <strong>No phonebooks have been created on this site.</strong> Create a new one with the <i>New Phonebook</i> button above.
            </p>
          </div>
        <table v-else class="min-w-full">
          <thead>
            <tr>
              <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="phonebook in phonebooks" :key="phonebook.id">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ phonebook.name }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ new Date(phonebook.created_at).toLocaleString() }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <router-link :to="{ name: 'phonebook', params: { site_id: site.id, phonebook_id: phonebook.id } }" class="text-indigo-600 hover:text-indigo-900">View/Edit</router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Half-width control cards -->
    <div class="grid grid-cols-1 gap-4 mt-8 sm:grid-cols-2">
      <!-- Site Fields Card -->
      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg font-medium leading-6 text-gray-900">Site Phonebook Fields</h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500">Manage the Fields within your Phonebooks.</p>
        </div>
        <div class="border-t border-gray-200">
          <!-- Form to create new field, take name type dropdown and required checkbox -->
          <div class="bg-gray-50 px-4 py-5 gap-3" :hidden="hideCreateFieldForm">
            <dd class="mt-1 text-sm text-gray-900 px-3 space-x-3">
              <input v-model="new_field_name" class="border border-gray-200 rounded-md p-2 focus:outline-none" placeholder="Field Name">
              <select v-model="new_field_type" default="text" class="border border-gray-200 rounded-md p-2 focus:outline-none px-10 focus:ring-2 focus:ring-indigo-600 focus:border-transparent">
                <option disabled value="">Select a type</option>
                <option v-for="field_type in valid_types" :key="field_type" :value="field_type">{{ field_type }}</option>
              </select>
              <input v-model="new_field_required" type="checkbox" class="border border-gray-200 rounded-md p-2 focus:outline-none" id="required">
              <label for="required">Required</label>
              <button @click.prevent="do_create_field(new_field_name, new_field_type, new_field_required)" class="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded">Create</button>
              <button @click.prevent="hideCreateFieldForm = !hideCreateFieldForm" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-3 rounded">Cancel</button>
            </dd>
          </div>
          <!-- Add field button, should show above form -->
          <!-- When clicked button should set hideCreateFieldForm to false -->
          <div v-if="hideCreateFieldForm" class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">Add Field</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:col-span-2">
              <button @click.prevent="hideCreateFieldForm = !hideCreateFieldForm" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-3 rounded">Add Field</button>
            </dd>
          </div>
          <table class="min-w-full">
            <thead>
              <tr>
                <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="field in fields" :key="field.id">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ field.name }}
                    <span v-if="field.created_by_system" class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">System</span>
                    <span v-if="field.required" class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">Required</span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ field.type }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button v-if="!field.created_by_system" @click.prevent="do_delete_field(field.id)" class="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

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
              <dt class="text-sm font-medium text-gray-500">Site Manager</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:col-span-2">{{ site.created_by.name }} ({{ site.created_by.email_address }})</dd>
            </div>
            <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Internal Site ID</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:col-span-2">{{ site.id }}</dd>
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
                <button v-if="phonebooks.length == 0" @click.prevent="confirm_delete_site" class="flex items-center gap-1 bg-red-50 rounded-md px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-700/10">Delete Site</button>
                <dd v-else class="mt-1 text-sm text-gray-900 sm:col-span-2">You must delete all phonebooks before you can remove this site.</dd>
              </dd>
            </div>
          </dl>
        </div>
    </div>
    </div>
  </div>
</template>
