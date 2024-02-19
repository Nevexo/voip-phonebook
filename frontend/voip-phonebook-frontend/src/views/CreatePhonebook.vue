<script setup>
import Navigation from '@/components/Navigation.vue';
import { get_site } from '@/api/site_mgmt';
import { create_phonebook } from '@/api/phonebook_mgmt';

import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const site = ref({});
const route = useRoute();
const router = useRouter();
const error = ref({});

const do_phonebook_create = async (name) => {
  const result = await create_phonebook(route.params.site_id, name);
  if (result.error != undefined) {
    error.value.error = result.error
    return;
  }

  router.push({name: 'phonebook', params: {site_id: route.params.site_id, phonebook_id: result.id}});
}

onMounted(async () => {
  const result = await get_site(route.params.site_id);
  if (result == null) {
    return;
  }

  site.value = result;
});
</script>

<template>
  <Navigation/>
  <div class="container">
    <h1 class="text-3xl font-bold mt-8">Create Phonebook</h1>
    <p class="text-gray-500">Create a new phonebook on {{ site.name }}</p>
    <div class="border-b border-gray-200 mt-8"></div>
    <div class="mt-8">
      <!-- Note in blue box -->
      <div class="bg-blue-100 border-t-4 border-blue-500 rounded-b text-blue-900 px-4 py-3 shadow-md" role="alert">
        <div class="flex">
          <div class="py-1">
            <svg class="fill-current h-6 w-6 text-blue-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M2.5 3.5l15 15" />
            </svg>
          </div>
          <div>
            <p class="font-bold">Note on Creating new Phonebooks</p>
            <p class="text-sm">
              Depending on the configuration of your phone system, this new phonebook may not automatically be available on your devices.
              You'll likely need to <strong>contact your system administrator</strong> to have this phonebook added to your devices.
            </p>
            <br/>
            <p class="text-sm">
              <strong>Permissions Notice: </strong>Anybody authorised to view this site will be able to view the contents of this phonebook.
            </p>
            <br/>
            <p class="text-sm">
              <strong>Fields Notice: </strong>This phonebook shares the same "phonebook fields" as any other on the site. If you need to
              add additional fields, please do this from the site configuration settings.
            </p>
          </div>
        </div>
      </div>
      <!-- Error message in red box -->
      <div v-if="error.error" class="bg-red-100 border-t-4 border-red-500 rounded-b text-red-900 px-4 py-3 shadow-md mt-8" role="alert">
        <div class="flex">
          <div class="py-1">
            <svg class="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M10 3.58l-6.58 6.42a1.5 1.5 0 0 0 2.08 2.16L10 8.16l4.5 4.5a1.5 1.5 0 0 0 2.08-2.16L10 3.58z" />
            </svg>
          </div>
          <div>
            <p class="font-bold">Error</p>
            <p class="text-sm">
              {{ error.error }}
            </p>
          </div>
        </div>
      </div>
      <br/>
      <form>
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="name">
            Name
          </label>
          <input v-model="name" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="name" type="text" placeholder="Name">
        </div>
        <div class="flex items-center justify-between">
          <button @click.prevent="do_phonebook_create(name)" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
            Create Phonebook
          </button>
        </div>
      </form>
    </div>  
  </div>
</template>