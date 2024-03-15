<script setup>
import Navigation from '@/components/Navigation.vue'
import { auth } from '../main'
import { get_sites } from '../api/site_mgmt';
import { ref, onMounted } from 'vue';

const sites = ref([]);

onMounted(async () => {
  const result = await get_sites();
  if (result == null) {
    return;
  }

  sites.value = result;
});
</script>

<template>
  <Navigation />

  <main class="container"> 
    <h1 class="text-4xl font-bold mt-8">Hello, {{ auth.user.name }}</h1>
    <p class="mt-4">Welcome to Triarom Contacts.</p>
    <div class="border-b border-gray-200 mt-8"></div>
    
    <!-- Card View -->
    <div class="grid grid-cols-1 gap-4 mt-8 sm:grid-cols-2">
      <!-- Welcome Card -->
      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg font-medium leading-6 text-gray-900">Information</h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500">Overview of Triarom Contacts.</p>
        </div>
        <div class="border-t border-gray-200">
          <dl>
            <div class="bg-gray-50 px-4 py-5">
              <p>Welcome to a preview version of Triarom Contacts.</p>
            </div>
            <div class="bg-white px-4 py-5 sm:grid ">
              <p><b>Beta Notice: </b>
                throughout the UI you may see some text that seems random, this is likely an internal system ID,
                and will be removed in a future version of voip-phonebook.
              </p>
            </div>
          </dl>
        </div>
      </div>

      <!-- Jump to site shortcut list -->
      <div class="bg-white shadow overflow-hidden sm:rounded-lg">      
          <div class="px-4 py-5 sm:px-6">
            <h3 class="text-lg font-medium leading-6 text-gray-900">Site Shortcuts</h3>
            <p class="mt-1 max-w-2xl text-sm text-gray-500">For more information, visit the <RouterLink class="text-indigo-600 hover:text-indigo-900" :to="{name: 'sites'}">Site Manager</RouterLink></p>
          </div>

          <div class="border-t border-gray-200">
            <table class="min-w-full">
              <thead>
                <tr>
                  <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="site in sites" :key="site.id">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ site.name }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <RouterLink :to="{name: 'site', params: {id: site.id}}" class="text-indigo-600 hover:text-indigo-900">Open</RouterLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
    </div>
  </main>
  
</template>