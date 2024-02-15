<script setup>
import Navigation from '@/components/Navigation.vue'
import { auth } from '../main'
</script>

<template>
  <Navigation />

  <main class="container"> 
    <h1 class="text-4xl font-bold mt-8">Hello, {{ auth.user.name }}</h1>
    <p class="mt-4">This</p>
  </main>
  
</template>