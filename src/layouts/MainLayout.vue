<template>
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

        <template v-if="user">
          <q-tabs v-if="!$q.platform.is.mobile" class="bg-primary text-white">
            <q-route-tab name="progress" icon="dashboard" to="/progress">
              <q-tooltip class="bg-accent">Progress</q-tooltip>
            </q-route-tab>
            <q-route-tab name="learn" icon="school" to="/learn">
              <q-tooltip class="bg-accent">Learn words</q-tooltip>
            </q-route-tab>
            <q-route-tab name="word" icon="view_list" to="/word">
              <q-tooltip class="bg-accent">Add or remove words</q-tooltip>
            </q-route-tab>
          </q-tabs>

          <q-btn stretch flat icon="logout" @click="logout">
            <q-tooltip class="bg-accent">Logout</q-tooltip>
          </q-btn>
        </template>
        <template v-else>
          <q-btn stretch flat icon="login" to="/login">
            <q-tooltip class="bg-accent">Login</q-tooltip>
          </q-btn>
        </template>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer
      v-if="!isAcceptedCookieConsent || (user != null && $q.platform.is.mobile)"
      class="fixed-bottom"
    >
      <q-banner
        v-if="!isAcceptedCookieConsent"
        dense
        inline-actions
        class="text-white bg-red"
      >
        This website uses cookies to improve your experience. We'll assume
        you're ok with this, but you can opt-out if you wish.
        <template v-slot:action>
          <q-btn
            flat
            color="white"
            label="Accept"
            @click="() => setCookieConsent()"
          />
        </template>
      </q-banner>
      <q-toolbar v-if="user != null && $q.platform.is.mobile">
        <q-tabs class="bg-primary text-white">
          <q-route-tab name="progress" icon="dashboard" to="/progress">
            <q-tooltip class="bg-accent">Progress</q-tooltip>
          </q-route-tab>
          <q-route-tab name="learn" icon="school" to="/learn">
            <q-tooltip class="bg-accent">Learn words</q-tooltip>
          </q-route-tab>
          <q-route-tab name="word" icon="view_list" to="/word">
            <q-tooltip class="bg-accent">Add or remove words</q-tooltip>
          </q-route-tab>
        </q-tabs>
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { Auth, signOut } from 'firebase/auth';
import { useQuasar } from 'quasar';
import { inject, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCurrentUser } from 'vuefire';

const $q = useQuasar();
const router = useRouter();
const fireauth = inject<Auth>('fireauth');
const user = useCurrentUser();

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
        router.push({ path: '/' });
      });
  });
}

const isAcceptedCookieConsent = ref(
  $q.localStorage.getItem('AcceptedCookieConsent') === true
);
const setCookieConsent = () => {
  $q.localStorage.set('AcceptedCookieConsent', true);
  isAcceptedCookieConsent.value = true;
};
</script>
