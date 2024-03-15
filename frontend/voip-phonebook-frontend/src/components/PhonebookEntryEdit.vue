<script setup>
import {
  update_entry
} from '@/api/phonebook_mgmt';

import { ref } from 'vue'

const props = defineProps({
  fields: Array,
  site: Object,
  phonebook: Object,
  entry: Object,
  save_callback: Function,
})

const new_entry_error = ref('');

const get_field_value = (field_id) => {
  // Returns a value for an entry, if the field_it matches, returns a blank string otherwise.
  // Iterate all entry.field values looking for field.id being equal to the field in the loop
  for (let i = 0; i < props.entry.fields.length; i++) {
    if (props.entry.fields[i].field.id === field_id) {
      return props.entry.fields[i].value
    }
  }

  // return ""
}

const submit_entry_update = async (entry_id) => {
  // Find all fields, check if the boxes for that field (id in name attribute) have been entered
  // Define these into a JSON array [{"field_id": "value", "value": "value"}...]
  let entry = [];
  for (const field of props.fields) {
    // Check if the field is a checkbox
    if (field.type === 'bool') {
      let value = document.querySelector(`input[name="${entry_id}-${field.id}"]`).checked;
      entry.push({ field_id: field.id, value: value });
      continue;
    }

    console.log(`${entry_id}-${field.id}`)
    // Not checkbox, get value of text box.
    let value = document.querySelector(`input[name="${entry_id}-${field.id}"]`).value;

    // Add the field to the entry
    entry.push({ field_id: field.id, value: value });

    // If the field is required and the value is empty, return an error
    if (field.required && entry[field.id] === '') {
      new_entry_error.value = `The field ${field.name} is required.`;
      return;
    }
  }

  // Submit the update to the server
  const response = await update_entry(props.site.id, props.phonebook.id, entry_id, entry);
  if (response.error) {
    new_entry_error.value = `${response.message || "N/A"} (${response.error})`;
    return;
  } 

  new_entry_error.value = '';
  props.save_callback(props.entry.id, entry);
}
</script>

<template>
  <!-- Values -->
  <td v-for="field of fields" class="px-6 py-4 whitespace-nowrap">
    <input v-if="field.type === 'text' || field.type === 'number' || field.type === 'email'" :name="`${entry.id}-${field.id}`" :required="field.required" :placeholder="field.name" :value="get_field_value(field.id)" type="text" class="border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 rounded-md shadow-sm">
    <input v-else-if="field.type === 'bool'" :required="field.required" type="checkbox" :name="`${entry.id}-${field.id}`" class="border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 rounded-md shadow-sm">
  </td>

  <!-- Actions -->
  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
    <!-- Call save method -->
    <button @click="submit_entry_update(entry.id)" class="text-indigo-600 hover:text-indigo-900">Save</button>
    <!-- Failure message -->
    <span class="text-red-600" v-if="new_entry_error"><br />{{ new_entry_error }}</span>

    <!-- <router-link :to="{ name: 'phonebook', params: { site_id: site.id, phonebook_id: phonebook.id } }" class="text-indigo-600 hover:text-indigo-900">Save</router-link> -->
  </td>
</template>

<style lang="scss" scoped>

</style>