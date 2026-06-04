<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import Sidebar from './components/Sidebar.vue';
import SeoHead from './components/SeoHead.vue';

const route = useRoute();
const isDashboard = computed(() => route.meta.layout === 'dashboard');
</script>

<template>
  <div class="app-layout" :class="{ 'app-layout--dashboard': isDashboard }">
    <SeoHead v-if="!isDashboard" />
    <Sidebar v-if="isDashboard" />
    <router-view></router-view>
  </div>
</template>

<style>
/* Dashboard layout: sidebar + content, full height, no page scroll */
.app-layout--dashboard {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* Public layout: normal page flow with scroll */
.app-layout:not(.app-layout--dashboard) {
  min-height: 100vh;
  width: 100vw;
}
</style>
