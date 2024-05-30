<script setup>
import Navigation from '@/components/Navigation.vue';
import {
  get_phonebook,
  delete_phonebook,
  get_entries,
  create_entry,
  delete_entry,
  rename_phonebook,
} from '@/api/phonebook_mgmt';

import {
  get_site,
  get_fields
} from '@/api/site_mgmt';

import ConfirmModal from '@/components/ConfirmModal.vue'

import PhonebookEntryEdit from '@/components/PhonebookEntryEdit.vue';

import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

let site = ref({ 'id': 0, name: '' });
const phonebook = ref({ 'id': 0, name: '' });
const fields = ref([]);
const entries = ref([]);
const editing_entries = ref([]);
const new_entry_error = ref('');
const is_renaming = ref(false);

const confirmModalState = ref(false)
const confirmModalHeading = ref('')
const confirmModalMessage = ref('')
const confirmModalConfirmButtonText = ref('')
const confirmModalConfirmButtonAction = ref(() => {})

const route = useRoute(); 
const router = useRouter();

onMounted(async () => {
  site.value = await get_site(route.params.site_id);
  phonebook.value = await get_phonebook(route.params.site_id, route.params.phonebook_id);
  fields.value = await get_fields(route.params.site_id, route.params.phonebook_id);
  entries.value = await get_entries(route.params.site_id, route.params.phonebook_id);
});

const rename = async (new_name) => {
  const r = await rename_phonebook(route.params.site_id, route.params.phonebook_id, new_name);
  if (r.error) {
    alert(r.error);
  } else {
    phonebook.value = await get_phonebook(route.params.site_id, route.params.phonebook_id);
    is_renaming.value = false;
  }
}

const delete_entry_modal = (entry_id) => {
  confirmModalState.value = true;
  confirmModalHeading.value = 'Delete Entry';
  confirmModalMessage.value = 'Are you sure you want to delete this entry?';
  confirmModalConfirmButtonText.value = 'Delete';
  confirmModalConfirmButtonAction.value = async () => {
    const r = await delete_entry(route.params.site_id, route.params.phonebook_id, entry_id);
    if (r.error) {
      confirmModalState.value = false;
      alert(r.error);
    } else {
      confirmModalState.value = false;
      entries.value = await get_entries(route.params.site_id, route.params.phonebook_id);
    }
  }
}

const delete_phonebook_modal = () => {
  confirmModalState.value = true;
  confirmModalHeading.value = 'Delete Phonebook';
  confirmModalMessage.value = 'Are you sure you want to delete this phonebook?';
  confirmModalConfirmButtonText.value = 'Delete';
  confirmModalConfirmButtonAction.value = async () => {
    const r = await delete_phonebook(route.params.site_id, route.params.phonebook_id);
    if (r.error) {
      confirmModalState.value = false;
      alert(r.error);
    } else {
      confirmModalState.value = false;
      router.push(`/site/${route.params.site_id}`);
    }
  }
}

const new_entry = async () => {
  // Find all fields, check if the boxes for that field (id in name attribute) have been entered
  // Define these into a JSON array [{"field_id": "value", "value": "value"}...]
  let entry = [];
  for (const field of fields.value) {
    // Check if the field is a checkbox
    if (field.type === 'bool') {
      let value = document.querySelector(`input[name="${field.id}"]`).checked;
      entry.push({ field_id: field.id, value: value });
      continue;
    }

    // Not checkbox, get value of text box.
    let value = document.querySelector(`input[name="${field.id}"]`).value;

    // Add the field to the entry
    entry.push({ field_id: field.id, value: value });

    // If the field is required and the value is empty, return an error
    if (field.required && entry[field.id] === '') {
      alert(`The field ${field.name} is required.`);
      return;
    }
  }

  // Create the entry
  const r = await create_entry(route.params.site_id, route.params.phonebook_id, entry);
  if (r.error) {
    new_entry_error.value = r.error;
  } else {
    // Clear the error
    new_entry_error.value = '';
    // Clear the fields
    for (const field of fields.value) {
      if (field.type === 'bool') {
        document.querySelector(`input[name="${field.id}"]`).checked = false;
        continue;
      }
      document.querySelector(`input[name="${field.id}"]`).value = '';
    }
    // Refresh the entries
    entries.value = await get_entries(route.params.site_id, route.params.phonebook_id);
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
    <!-- Link back to site -->
    <div class="mt-8">
      <router-link :to="'/site/' + site.id" class="flex items-center gap-1">
        <i class="fa-solid fa-arrow-left"></i>
        <span>Back to Site ({{ site.name }})</span>
      </router-link>
    </div>
    <h1 class="text-4xl font-bold mt-8">{{ site.name }} / {{ phonebook.name }}</h1>
    <p class="text-gray-500">Manage the <strong>{{ phonebook.name }}</strong> phonebook on <strong>{{ site.name }}</strong></p>
    <div class="border-b border-gray-200 mt-8"></div>

    <!-- Full width card with entries table -->
    <div class="bg-white shadow sm:rounded-lg mt-8">
      <div class="px-4 py-5 sm:px-6">
        <h3 class="text-lg font-medium leading-6 text-gray-900">Entries</h3>
        <p class="mt-1 max-w-2xl text-sm text-gray-500">Entries in this Phonebook.</p>
      </div>
      <div class="border-t border-gray-200">
        <table class="min-w-full">
          <thead>
            <tr>
              <th v-for="field of fields" class="px-6 py-3 bg-gray-50 space-x-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {{ field.name }} <br /> {{ field.id }}
                <span v-if="field.required" class="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-700/10">R</span>
                <span v-if="field.created_by_system" class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">S</span>
              </th>
              <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="entry in entries" :key="entry.id" class="hover:bg-gray-50">
              <!-- Edit this entry if listed in editing_entries -->
              <PhonebookEntryEdit
              v-if="editing_entries.includes(entry.id)"
              :fields="fields"
              :site="site"
              :phonebook="phonebook"
              :entry="entries.find(e => e.id === entry.id)"
              :save_callback="async (entry_id) => {
                // Update the table
                editing_entries = editing_entries.filter(e => e !== entry_id);
                entries = await get_entries(route.params.site_id, route.params.phonebook_id);
              }"
              />

              <!-- Display this entry as text if not. -->
              <td v-for="field of fields" v-else class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {{ entry.fields.find(f => f.field.id === field.id)?.value || '' }}
                </div>
              </td>
              <td v-if="!editing_entries.includes(entry.id)" class="px-6 py-4 text-sm font-medium">
                <!-- Edit link -->
                <button @click="editing_entries.push(entry.id)" class="text-indigo-600 mr-2 hover:text-indigo-900">Edit</button>
                <!-- Delete link -->
                <button @click="delete_entry_modal(entry.id)" class="text-red-600 mr-2 hover:text-red-900">Delete</button>
              </td>
            </tr>
            <!-- Add new entry -->
            <tr class="bg-gray-50">
              <td v-for="field of fields" class="px-6 py-4 whitespace-nowrap">
                <input v-if="field.type === 'text' || field.type === 'number' || field.type === 'email'" :required="field.required" :name="field.id" :placeholder="field.name" type="text" class="border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 rounded-md shadow-sm">
                <input v-else-if="field.type === 'bool'" :required="field.required" type="checkbox" :name="field.id" class="border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 rounded-md shadow-sm">
              </td>

              <!-- Actions -->
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <!-- <router-link :to="{ name: 'phonebook', params: { site_id: site.id, phonebook_id: phonebook.id } }" class="text-indigo-600 hover:text-indigo-900">Add</router-link> -->
                <button @click="new_entry" class="text-indigo-600 hover:text-indigo-900">Add</button>
                <!-- Failure message -->
                <span class="text-red-600" v-if="new_entry_error"><br />{{ new_entry_error }}</span> 
              </td>

            </tr>
          </tbody>
        </table>
        <!-- Card footer -->
        <div class="px-4 py-4 space-x-3 sm:px-6">
          <span class="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-700/10">R</span> - Required Field
          <span class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">S</span> - System Field
        </div>
      </div>
    </div>
    <!-- Full-width card for phonebook management -->
    <div class="bg-white shadow sm:rounded-lg mt-8">
      <div class="px-4 py-5 sm:px-6">
        <h3 class="text-lg font-medium leading-6 text-gray-900">Phonebook Settings</h3>
        <p class="mt-1 max-w-2xl text-sm text-gray-500">Manage this phonebook.</p>
      </div>
      <div class="border-t border-gray-200">
          <dl>
            <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Name</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:col-span-2">
                <input v-if="is_renaming" v-model="phonebook.name" name="phonebookName" type="text" class="border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 rounded-md shadow-sm">
                <span v-else>{{ phonebook.name }}</span>
                <!-- <button @click="rename(phonebookName.value)" class="flex items-center gap-1 bg-indigo-50 rounded-md px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">Rename</button> -->
              </dd>
            </div>
            <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Creation Date</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:col-span-2">{{ new Date(phonebook.created_at).toLocaleString() }}</dd>
            </div>
            <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Internal Phonebook ID</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:col-span-2">{{ phonebook.id }}</dd>
            </div>
            <!-- Delete Phonebook -->
            <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Delete Phonebook</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:col-span-2">
                <button @click.prevent="delete_phonebook_modal" class="flex items-center gap-1 bg-red-50 rounded-md px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-700/10">Delete</button>
              </dd>
            </div>
          </dl>
        </div>
    </div>
  </div>
</template>