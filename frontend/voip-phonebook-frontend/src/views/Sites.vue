<script setup>
import Navigation from '@/components/Navigation.vue';
import { get_sites } from '../api/site_mgmt';
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { auth } from '../main';

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
  <Navigation/>

  <div class="container mx-auto">
    <h1 class="text-3xl font-bold mt-8">Sites</h1>
    <p class="text-gray-500">Manage your sites</p>

    <!-- Right-aligned create site button -->
    <div v-if="auth.user.root_user" class="flex justify-end mt-8">
      <RouterLink to="/sites/create-site" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">Create Site</RouterLink>
    </div> 

    <!-- Horizontal line -->
    <div class="border-b border-gray-200 mt-8"></div>

    <!-- Cards for each site -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
      <div v-for="site in sites" :key="site.id" class="bg-white rounded-lg shadow-md p-4">
        <h2 class="text-xl font-bold">{{ site.name }}</h2>
        <p class="text-gray-500">Created By:  {{ site.created_by.name }}</p>
        <div class="mt-4">
          <RouterLink :to="{name: 'site', params: {id: site.id}}" class="text-indigo-600 hover:text-indigo-900">Edit</RouterLink>
        </div>
      </div>
    </div>  
  </div>

</template>
