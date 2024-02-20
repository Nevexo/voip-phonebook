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

    <!-- Horizontal line -->
    <div class="border-b border-gray-200 mt-8"></div>

    <!-- Right-aligned create site button -->
    <div v-if="auth.user.root_user" class="flex justify-end mt-8">
      <RouterLink to="/sites/create-site" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">Create Site</RouterLink>
    </div> 

    <!-- Notice when no sites available -->
    <div v-if="sites.length == 0" class="bg-blue-100 border-t-4 border-blue-500 rounded-b text-blue-900 px-4 py-3 shadow-md" role="alert">
      <div class="flex">
        <div class="py-1">
          <svg class="fill-current h-6 w-6 text-blue-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M2.5 3.5l15 15" />
          </svg>
        </div>
        <div>
          <p class="font-bold">No Sites Available</p>
          <p class="text-sm">
            Your account has not been authorised to access any sites, please contact your system administrator.
          </p>
          <br/>
          <p v-if="auth.user.root_user" class="text-sm">
            <strong>Root User Notice: </strong> As a root user, you can create new sites using the <i>Create Site</i> button at the top of this page.
          </p>
        </div>
      </div>
    </div>

    <!-- Cards for each site -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
      <div v-for="site in sites" :key="site.id" class="bg-white rounded-lg shadow-md p-4">
        <h2 class="text-xl font-bold">{{ site.name }}</h2>
        <p class="text-gray-500">Created By:  {{ site.created_by.name }}</p>
        <span v-if="site.authorised_users.length == 0" class="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20"><i class="fa-solid fa-triangle-exclamation"></i> No Authorised Users</span>
        <div class="mt-4">
          <RouterLink :to="{name: 'site', params: {id: site.id}}" class="text-indigo-600 hover:text-indigo-900">Edit</RouterLink>
        </div>
      </div>
    </div>  
  </div>

</template>
