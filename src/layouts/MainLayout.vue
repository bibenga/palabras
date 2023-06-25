<template v-if="authLoading">
  <q-layout view="hHh Lpr lFf">
    <q-header>
      <q-toolbar>
        <q-toolbar-title :shrink="false">
          <router-link to="/" class="text-white" style="text-decoration: none">
            <q-avatar icon="translate" />
            Aprende palabras
          </router-link>
        </q-toolbar-title>

        <q-btn
          stretch
          flat
          :icon="$q.dark.isActive ? 'dark_mode' : 'light_mode'"
          @click="$q.dark.toggle"
        >
          <q-tooltip class="bg-accent">Dark or ligt mode</q-tooltip>
        </q-btn>

        <template v-if="isAuthenticated">
          <q-tabs class="bg-primary text-white">
            <q-route-tab name="word" icon="view_list" to="/word">
              <q-tooltip class="bg-accent">Add or remove words</q-tooltip>
            </q-route-tab>
          </q-tabs>

          <q-btn stretch flat icon="logout" @click="logout">
            <q-tooltip class="bg-accent">Logout</q-tooltip>
          </q-btn>
        </template>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useAuth } from '@vueuse/firebase';
import { Auth, onAuthStateChanged, signOut } from 'firebase/auth';
import { useQuasar } from 'quasar';
import { inject, ref } from 'vue';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const router = useRouter();
const fireauth = inject<Auth>('fireauth');
const { isAuthenticated, user } = useAuth(fireauth);

// onBeforeRouteUpdate((to, from) => {
//   console.log(`[App.onBeforeRouteUpdate] ${from.fullPath} -> ${to.fullPath}`);
//   return false;
// });
const authLoading = ref(true);
onAuthStateChanged(fireauth, (a) => {
  console.log('onAuthStateChanged', a);
  authLoading.value = true;
});

function logout() {
  $q.dialog({
    title: 'Confirmation',
    message: 'Would you like to logout?',
    cancel: true,
    persistent: true,
    focus: 'cancel',
  }).onOk(() => {
    const userName = user?.value?.displayName || user?.value?.email;
    signOut(fireauth)
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        $q.notify({
          type: 'positive',
          message: `Goodby ${userName}!`,
          timeout: 1000,
        });
        router.push({ path: '/login' });
      });
  });
}
</script>
