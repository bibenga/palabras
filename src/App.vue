<template>
  <router-view v-if="isReady" />
</template>

<script setup lang="ts">
import { onAuthStateChanged } from 'firebase/auth';
import { useAuth } from './boot/firebase';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const { fireauth, isReady } = useAuth();
onAuthStateChanged(fireauth, (user) => {
  if (user == null) {
    if (!route.path.startsWith('/login')) {
      router.push({ path: '/login' });
    }
  }
});
</script>
