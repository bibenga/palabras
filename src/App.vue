<template>
  <router-view />
</template>

<script setup lang="ts">
import { onAuthStateChanged, User, getAuth } from 'firebase/auth';
import { onBeforeUnmount, ref, provide } from 'vue';

const fireauth = getAuth();
const user = ref<User | null>(null);

provide('user', user);

const authListenerUnsubscribe = onAuthStateChanged(fireauth, (authUser) => {
  // we should redirect to login page when user pressed a logout button in another tab
  // console.debug('[app]', route.path, authUser);
  console.log(`[App.onAuthStateChanged]: user=${authUser?.uid}`);
  user.value = authUser;
});
onBeforeUnmount(() => {
  // clear up listener
  authListenerUnsubscribe();
});
</script>
