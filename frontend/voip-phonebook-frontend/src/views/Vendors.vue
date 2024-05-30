<script setup>
import Navigation from '@/components/Navigation.vue';
import { get_vendor_services } from '@/api/Vendors';
import { ref, onMounted } from 'vue';

const vendor_services = ref([]);

onMounted(async () => {
  const result = await get_vendor_services();
  if (result == null) {
    return;
  }

  vendor_services.value = result;
});
</script>

<template>
  <Navigation/>

  <div class="container mx-auto">
    <h1 class="text-3xl font-bold mt-8">Vendor Services</h1>
    <p class="text-gray-500">Manage & Monitor Vendor Services</p>

    <!-- Horizontal line -->
    <div class="border-b border-gray-200 mt-8"></div>

    <!-- Notice when no vendors are present -->
    <div v-if="vendor_services.length == 0" class="bg-blue-100 border-t-4 border-blue-500 rounded-b text-blue-900 px-4 py-3 shadow-md" role="alert">
      <div class="flex">
        <div class="py-1">
          <svg class="fill-current h-6 w-6 text-blue-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M2.5 3.5l15 15" />
          </svg>
        </div>
        <div>
          <p class="font-bold">No Vendor Services Registered</p>
          <p class="text-sm">
            There are no vendor services registered with voip-phonebook. Vendor services will appear here once they
            have started at least once, and provision into the system.
          </p>
        </div>
      </div>
    </div>

    <!-- Cards for services -->
    <div class="grid grid-cols-1 mt-8">
      <div v-for="service in vendor_services" :key="service.id" class="bg-white rounded-lg shadow-md p-4 g-4">
        <h2 class="text-xl font-bold">{{ service.friendly_name }}</h2>
        <p class="text-gray-500">{{ service.name }} ({{ service.id }})</p>
        <!-- <span v-if="status != "" class="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20"><i class="fa-solid fa-triangle-exclamation"></i> No Authorised Users</span> -->
        <div class="mt-4">
          <!-- Availability State -->
          <span v-if="service.status == 'available'" class="inline-flex items-center rounded-md bg-green-50 gx-4 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10">AVAILABLE</span>
          <span v-else class="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-700/10">{{ service.status.toUpperCase() }}</span>

          <!-- Informational Flags -->
          <span class="inline-flex items-center rounded-md bg-indigo-50 gx-4 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">{{ service.version }}</span>
          <!-- Table of supported fields, contains naem, required and remark -->
        
        </div>
        <p class="mt-5 text-l font-bold">Service Fields</p>
        <table class="w-full">
          <thead>
            <tr>
              <th class="text-left">Field Name</th>
              <th class="text-left">Flags</th>
              <th class="text-left">Remark</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="field in service.supported_fields" :key="field.name">
              <td>{{ field.name }}</td>
              <td>{{ (field.required) ? "R" : "" }}</td>
              <td>{{ field.remark }}</td>
            </tr>
          </tbody>
        </table>

        <br/>
        <p class="text-gray-500">First Provision: {{ new Date(service.created_at).toLocaleString() }}</p>
        <p class="text-gray-500">Latest Provision: {{ new Date(service.last_provision_time).toLocaleString() }}</p>
        <div v-if="service.status != 'available'" class="mt-4">
          <!-- TODO: impl delete vendor service -->
          <!-- <RouterLink :to="{name: 'site', params: {id: service.id}}" class="text-indigo-600 hover:text-indigo-900">Delete</RouterLink> -->
        </div>
      </div>
    </div>  

  </div>

</template>