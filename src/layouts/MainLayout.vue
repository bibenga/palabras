<template>
  <q-layout view="hHh Lpr lFf">
    <q-header>
      <q-toolbar>
        <q-toolbar-title :shrink="false">
          <router-link to="/" class="text-white" style="text-decoration: none">
            <q-avatar icon="translate" />
            Palabras
          </router-link>
        </q-toolbar-title>

        <q-btn
          stretch
          flat
          :icon="$q.dark.isActive ? 'dark_mode' : 'light_mode'"
          @click="$q.dark.toggle"
        >
          <q-tooltip class="bg-primary">Dark or ligt mode</q-tooltip>
        </q-btn>

        <template v-if="user">
          <q-tabs v-if="!$q.screen.xs" class="bg-primary text-white">
            <q-route-tab name="progress" icon="dashboard" to="/progress">
              <q-tooltip class="bg-primary">Progress</q-tooltip>
            </q-route-tab>
            <q-route-tab
              name="learn-translation"
              icon="school"
              to="/learn/translation"
            >
              <q-tooltip class="bg-primary"
                >Learn words as translation</q-tooltip
              >
            </q-route-tab>
            <q-route-tab name="learn-choice" icon="list_alt" to="/learn/choice">
              <q-tooltip class="bg-primary">Learn words as choice</q-tooltip>
            </q-route-tab>
            <q-route-tab name="word" icon="view_list" to="/word">
              <q-tooltip class="bg-primary">Add or remove words</q-tooltip>
            </q-route-tab>
          </q-tabs>

          <q-btn stretch flat icon="logout" @click="logout">
            <q-tooltip class="bg-primary">Logout</q-tooltip>
          </q-btn>
        </template>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer
      v-if="!isAcceptedCookieConsent || (user != null && $q.screen.xs)"
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
      <q-toolbar v-if="user != null && $q.screen.xs">
        <q-tabs class="bg-primary text-white" switch-indicator align="justify">
          <q-route-tab name="progress" icon="dashboard" to="/progress">
            <q-tooltip class="bg-primary">Progress</q-tooltip>
          </q-route-tab>
          <q-route-tab
            name="learn-translation"
            icon="school"
            to="/learn/translation"
          >
            <q-tooltip class="bg-primary">Learn words as translation</q-tooltip>
          </q-route-tab>
          <q-route-tab name="learn-choice" icon="list_alt" to="/learn/choice">
            <q-tooltip class="bg-primary">Learn words as choice</q-tooltip>
          </q-route-tab>
          <q-route-tab name="word" icon="view_list" to="/word">
            <q-tooltip class="bg-primary">Add or remove words</q-tooltip>
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
        router.push({ path: '/login' });
      });
  });
}

const isAcceptedCookieConsent = ref(
  // $q.localStorage.getItem('AcceptedCookieConsent') === true,
  $q.cookies.get('PalabrasAcceptedCookieConsent') === '1',
);
const setCookieConsent = () => {
  // $q.localStorage.set('AcceptedCookieConsent', true);
  $q.cookies.set('PalabrasAcceptedCookieConsent', '1', {
    expires: 2,
  });
  isAcceptedCookieConsent.value = true;
};
</script>
