<template>
  <router-view v-if="isAuthReady" />
</template>

<script setup lang="ts">
import { onAuthStateChanged } from 'firebase/auth';
import { useAuth } from './boot/firebase';
import { ref } from 'vue';

const fireauth = useAuth();
const isAuthReady = ref(false);
onAuthStateChanged(fireauth, (user) => {
  isAuthReady.value = true;
  if (user) {
    console.log('[app.auth] logged in', user);
  } else {
    console.log('[app.auth] logged out');
  }
});
</script>
