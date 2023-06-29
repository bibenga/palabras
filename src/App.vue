<template>
  <router-view />
</template>

<script setup lang="ts">
import { Auth, onAuthStateChanged } from 'firebase/auth';
import { inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const fireauth = inject<Auth>('fireauth');
onAuthStateChanged(fireauth, (authUser) => {
  // we should redirect to login page when user pressed a logout button in another tab
  console.log('[app]', route.path, authUser);
  if (authUser === null && route.meta.requiresAuth) {
    router.push({
      path: '/login',
      query: {
        redirect: route.fullPath,
      },
    });
  }
});
</script>
