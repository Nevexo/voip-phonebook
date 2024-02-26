<script setup>
import Navigation from '@/components/Navigation.vue';
import {
  get_phonebook,
  delete_phonebook,
  get_entries
} from '@/api/phonebook_mgmt';

import {
  get_site,
  get_fields
} from '@/api/site_mgmt';

import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

let site = ref({ 'id': 0, name: '' });
const phonebook = ref({ 'id': 0, name: '' });
const fields = ref([]);
const entries = ref([]);

const route = useRoute(); 
const router = useRouter();

onMounted(async () => {
  site.value = await get_site(route.params.site_id);
  phonebook.value = await get_phonebook(route.params.site_id, route.params.phonebook_id);
  fields.value = await get_fields(route.params.site_id, route.params.phonebook_id);
  entries.value = await get_entries(route.params.site_id, route.params.phonebook_id);
});
</script>

<template>
  <Navigation />
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
    <div class="bg-white shadow overflow-hidden sm:rounded-lg mt-8">
      <div class="px-4 py-5 sm:px-6">
        <h3 class="text-lg font-medium leading-6 text-gray-900">Entries</h3>
        <p class="mt-1 max-w-2xl text-sm text-gray-500">Entries in this Phonebook.</p>
      </div>
      <div class="border-t border-gray-200">
        <table class="min-w-full">
          <thead>
            <tr>
              <th v-for="field of fields" class="px-6 py-3 bg-gray-50 space-x-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {{ field.name }}
                <span v-if="field.required" class="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-700/10">R</span>
                <span v-if="field.created_by_system" class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">S</span>
              </th>
              <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="entry in entries" :key="entry.id" class="hover:bg-gray-50">
              <td v-for="field of fields" class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {{ entry.fields.find(f => f.field.id === field.id)?.value || '' }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <router-link :to="{ name: 'phonebook', params: { site_id: site.id, phonebook_id: phonebook.id } }" class="text-indigo-600 hover:text-indigo-900">Edit</router-link>
              </td>
            </tr>
            <!-- Seperator before add new field -->

            <tr class="bg-gray-50">
              <!-- Create new entry, show input box for each field, based on type -->
              <!-- ["text", "number", "email", "bool"], -->
              <td v-for="field of fields" class="px-6 py-4 whitespace-nowrap">
                <input v-if="field.type === 'text' || field.type === 'number' || field.type === 'email'" :required="field.required" :placeholder="field.name" type="text" class="border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 rounded-md shadow-sm">
                <input v-else-if="field.type === 'bool'" :required="field.required" type="checkbox" class="border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 rounded-md shadow-sm">
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <router-link :to="{ name: 'phonebook', params: { site_id: site.id, phonebook_id: phonebook.id } }" class="text-indigo-600 hover:text-indigo-900">Add</router-link>
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
  </div>
</template>