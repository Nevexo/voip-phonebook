<template>
  <div class="flex flex-col min-h-screen font-Roboto">
    <BetaNotice />
    <RouterView />
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import BetaNotice from '@/components/BetaNotice.vue'
import Footer from '@/views/Footer.vue'
</script>