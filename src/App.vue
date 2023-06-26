<template>
  <router-view />
</template>

<script setup lang="ts">
import { onAuthStateChanged } from 'firebase/auth';
import { useAuth } from './boot/firebase';

const fireauth = useAuth();
onAuthStateChanged(fireauth, (user) => {
  if (user) {
    console.log('[app.auth] logged in', user);
  } else {
    console.log('[app.auth] logged out');
  }
});
</script>
