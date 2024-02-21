<script setup>
import Navigation from '@/components/Navigation.vue';
import {
  get_phonebook,
  delete_phonebook
} from '@/api/phonebook_mgmt';

import {
  get_site
} from '@/api/site_mgmt';

import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

let site = ref({ 'id': 0, name: '' });
const phonebook = ref({ 'id': 0, name: '' });

const route = useRoute(); 
const router = useRouter();

onMounted(async () => {
  site.value = await get_site(route.params.site_id);
  phonebook.value = await get_phonebook(route.params.site_id, route.params.phonebook_id);
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
  </div>
</template>