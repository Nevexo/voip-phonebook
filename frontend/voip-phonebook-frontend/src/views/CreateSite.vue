<script setup>
import Navigation from '@/components/Navigation.vue';
import { get_users } from '@/api/user_mgmt';
import { create_site } from '@/api/site_mgmt';
import { ref, onMounted } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

const router = useRouter();

let users_array = [];

const users = ref(users_array)
const authorised_users = ref([])
const error_msg = ref('')

onMounted(async () => {
  const result = await get_users();
  if (result == null) {
    return;
  }

  users_array = result;
  users.value = result;
});

const add_authorised_user = () => {
  const select = document.getElementById('authorised_users');
  const selected_user = users.value.find(user => user.id == select.value);
  authorised_users.value.push(selected_user);

  // Remove the user from the drop down
  users.value = users.value.filter(user => user.id != select.value);
}

const remove_authorised_user = (id) => {
  authorised_users.value = authorised_users.value.filter(user => user.id != id);

  // Add the user back to the drop down
  const user = users_array.find(user => user.id == id);
  users.value.push(user);
}

const do_site_create = async (name, authorised_users) => {
  if (authorised_users.length == 0) {
    error_msg.value = 'You must add at least one authorised user';
    return;
  }

  // Get just IDs of authorised_users
  authorised_users = authorised_users.map(user => user.id);

  const result = await create_site(name, authorised_users);
  if (result.error != undefined) {
    error_msg.value = 'Failed to create site: ' + result.error;
    return;
  }

  // Redirect to sites page
  router.push({ name: 'sites' });
}
</script>

<template>
  <Navigation/>
  <div class="container">
    <h1 class="text-3xl font-bold mt-8">Create Site</h1>
    <p class="text-gray-500">Create a new site</p>
    <!-- Horizontal line -->
    <div class="border-b border-gray-200 mt-8"></div>
    <!-- Form with site name and a drop down box with all users in, allow users to be added to "authorised" users, with a plus button next to the drop-down -->
    <div class="mt-8">
      <form>
        <div class="flex flex-col gap-4 mt-4">
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex flex-col w-full">
              <label for="site_name" class="text-sm font-bold text-gray-700">Site Name</label>
              <input required type="text" v-model="site_name" name="site_name" class="border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent" />
            </div>
          </div>
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex flex-col w-full">
              <label for="site_name" class="text-sm font-bold text-gray-700">Authorised Users</label>
              <p class="text-gray-500 text-sm">Users who are authorised to manage this site, you must add at least one user to create the site.</p>
              <p class="text-gray-500 text-sm"><strong>Root User Notice: </strong>You don't need to add yourself to this list, only add the customer's account(s) - as a root user you'll already gain access.</p>
              <div class="flex gap-2 py-5">
                <!-- Current authorised users with a delete button next to each one -->
                <div v-for="user in authorised_users" class="bg-gray-100 rounded-md p-2 flex items-center gap-2">
                  <span>{{ user.name }}</span>
                  <button @click.prevent="remove_authorised_user(user.id)" class="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded">-</button>
                </div>
              </div>
              <div class="flex gap-2">
                <select id="authorised_users" name="authorised_users" class="border border-gray-200 px-20 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent">
                  <!-- Display users if not already authorised -->
                  <option v-if="users.length > 0" v-for="user in users" :value="user.id">{{ user.name }}</option>
                </select>
                <button v-if="users.length > 0" @click.prevent="add_authorised_user" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">+</button>
              </div>
            </div>
          </div>
          <div v-if="error_msg.length > 0" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong class="font-bold">Error</strong>
            <span class="block sm:inline">{{ error_msg }}</span>
          </div>
          <div class="flex justify-end">
            <button @click.prevent="do_site_create(site_name, authorised_users)" v-if="authorised_users.length > 0" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">Create Site</button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
