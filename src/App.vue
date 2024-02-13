<template>
  <router-view />
</template>

<script setup lang="ts">
import { Auth, onAuthStateChanged } from 'firebase/auth';
import { inject, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const fireauth = inject<Auth>('fireauth');

const authListenerUnsubscribe = onAuthStateChanged(fireauth, (authUser) => {
  // we should redirect to login page when user pressed a logout button in another tab
  // console.debug('[app]', route.path, authUser);
  console.log(`[App.onAuthStateChanged]: user=${authUser?.uid}, route=${route.path}`);
  if (authUser) {
    const loginRoutes = ['/login', '/register'];
    if (loginRoutes.includes(route.path)) {
      router.push({
        path: '/dashboard',
      });
    }
  } else {
    if (route.meta.requiresAuth) {
      router.push({
        path: '/login',
        query: { redirect: route.fullPath },
      });
    }
  }
});
onBeforeUnmount(() => {
  // clear up listener
  authListenerUnsubscribe();
});
</script>
