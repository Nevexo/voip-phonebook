<script setup>
import Navigation from '@/components/Navigation.vue';
import { get_site } from '../api/site_mgmt';
import { get_vendor_services, get_entitlement_by_site, create_entitlement } from '@/api/Vendors';
import { get_fields } from '../api/site_mgmt';
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const site = ref({});
const field_mapping = ref({});
const fields = ref([]);
const vendor_services = ref([]);
const entitlements = ref([]);
const error = ref({});
const vendor_service = ref("");

onMounted(async () => {
  const result = await get_site(route.params.site_id);
  if (result == null) {
    return;
  }

  site.value = result;

  const vendor_services_result = await get_vendor_services();
  if (vendor_services_result == null) {
    return;
  }

  vendor_services.value = vendor_services_result;

  const entitlements_result = await get_entitlement_by_site(route.params.site_id);
  if (entitlements_result == null) {
    return;
  }

  entitlements.value = entitlements_result;

  const fields_result = await get_fields(route.params.site_id);
  if (fields_result == null) {
    return;
  }

  fields.value = fields_result;

});

const reset_field_mappings = () => {
  // Reset all field mappings to a blank string, using the current vendor_service
  field_mapping.value = {};

  for (const field of vendor_services.value.find(service => service.id == vendor_service.value).supported_fields) {
    field_mapping.value[field.name] = "";
  }
}

const do_entitlement_create = async () => {
  // Check if all required fields are mapped
  for (const field of vendor_services.value.find(service => service.id == vendor_service.value).supported_fields) {
    if (field.required && field_mapping.value[field.name] == "") {
      error.value.error = `Required field ${field.name} is not mapped`;
      return;
    }
  }

  let mappings = {};
  // Map fields from the vendor service to the site fields
  for (const field of vendor_services.value.find(service => service.id == vendor_service.value).supported_fields) {
    mappings[field.name] = field_mapping.value[field.name];
  }

  const result = await create_entitlement(route.params.site_id, vendor_service.value, mappings);
  if (result.error != undefined) {
    error.value.error = result.error;
    return;
  }

  // Redirect to the site page
  router.push({name: 'site', params: {id: route.params.site_id}});
}

</script>

<template>
  <Navigation/>
  <div class="container">
    <h1 class="text-3xl font-bold mt-8">Create Entitlement</h1>
    <p class="text-gray-500">Create a new service entitlement on {{ site.name }}</p>
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
            <p class="font-bold">Note on Creating Vendor Service Entitlements</p>
            <p class="text-sm">
              Vendor Service Entitlements <strong>allow devices to access your phonebook</strong> - you'll need one for each
              vendor of device used on this site. Once created, the metadata will contain a URL to specify within the device's
              configuration.
            </p>
            <br/>
            <p class="text-sm">
              <strong>Security Notice: </strong>Should the access URLs/Keys become compromised, you can revoke the entitlement
              to remove access to the phonebook. However, all devices on the site using this entitlement will lose access
              to the phonebook.
            </p>
            <br/>
            <p class="text-sm">
              <strong>Provisioning & Propagation Notice: </strong>Some services may take a few minutes to provision, and make
              the phonebook available to devices. You can check the provisioning status of your entitlement on the site page.
              If you believe a service is stuck, please contact your system administrator.
            </p>
            <p class="text-sm">
              <strong>Only one instance of the vendor service may exist per site.</strong>
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
          <label class="block text-gray-700 text-sm font-bold mb-2" for="vendor_service">
            Vendor Service
          </label>
          <!-- Drop down box showing all vendor services that are not currently registered in an entitlement -->
          <select @change="reset_field_mappings" v-model="vendor_service" class="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline">
            <option value="" disabled selected>Select a Vendor Service</option>
            <!-- Show all options, but disable an option if there's an entitlement for this service already -->
            <option v-for="service in vendor_services" :key="service.id" :value="service.id" :disabled="entitlements.some(entitlement => entitlement.vendor_service.id == service.id)">{{ service.friendly_name }}</option>
          </select>
        </div>
        <!-- Field mapping table, list all fields from the site and have a dropdown box for vendor service mapping, only show this section if a service is selected -->
        <div v-if="vendor_service" class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2">
            Service Field Mapping
          </label>
          <!-- Information label -->
          <p class="text-gray-500 text-sm">Map the fields from the site to the fields of the vendor service. This will allow the vendor service to translate the data from the site.</p>
          <!-- Yellow warning triangle message, single line -->
          <div class="bg-yellow-50 border-l-4 border-yellow-500 rounded-b text-yellow-900 px-4 py-3 shadow-md mt-4" role="alert">
            <div class="flex">
              <div class="py-1">
                <svg class="fill-current h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M10 3.58l-6.58 6.42a1.5 1.5 0 0 0 2.08 2.16L10 8.16l4.5 4.5a1.5 1.5 0 0 0 2.08-2.16L10 3.58z" />
                </svg>
              </div>
              <div>
                <p class="font-bold">Field Mapping</p>
                <p class="text-sm">
                  Set any fields that don't have a corresponding field in the vendor service to <strong>Disregard Mapping</strong>. This will prevent the data from being sent to the vendor service.<br>
                  You may also wish to ignore certain fields, and use them simply as information within the phonebook system.<br>
                  <strong>You must map required fields.</strong>
                </p>
              </div>
            </div>
          </div>

          <table class="w-full">
            <thead>
              <tr>
                <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor Field</th>
                <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remark</th>
                <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flags</th>
                <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site Field</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <!-- vendor services fields  -->
              <tr v-for="field in vendor_services.find(service => service.id == vendor_service).supported_fields" :key="field.name">
                <td>{{ field.name }}</td>
                <td>
                  <p v-if="field.remark">{{ field.remark }}</p>
                </td>
                <td>
                  <span v-if="field.required" class="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-700/10">
                    <i class="fa-solid fa-triangle-exclamation pr-1"></i>
                    Required
                  </span>
                </td>
                <td>
                  <select v-model="field_mapping[field.name]" class="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline">
                    <option value="" :disabled="field.required" selected>Disregard Mapping</option>
                    <option v-for="site_field in fields" :key="site_field.name" :value="site_field.id">{{ site_field.name }}</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="vendor_service" class="flex items-center justify-between">
          <button @click.prevent="do_entitlement_create" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
            Register Entitlement
          </button>
        </div>
      </form>
    </div>  
  </div>
</template>