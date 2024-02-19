<script setup>
import Navigation from '@/components/Navigation.vue'
import { auth } from '../main'
</script>

<template>
  <Navigation />

  <main class="container"> 
    <h1 class="text-4xl font-bold mt-8">Hello, {{ auth.user.name }}</h1>
    <p class="mt-4">Welcome to Triarom Contacts.</p>
    <div class="border-b border-gray-200 mt-8"></div>
    
    <!-- Card View -->
    <div class="grid grid-cols-1 gap-4 mt-8 sm:grid-cols-2">
      <!-- Site information card -->
      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg font-medium leading-6 text-gray-900">Information</h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500">Overview of Triarom Contacts.</p>
        </div>
        <div class="border-t border-gray-200">
        </div>
      </div>
    </div>
  </main>
  
</template>