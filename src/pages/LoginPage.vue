<template>
  <q-page :class="$q.screen.xs ? '' : 'row justify-center items-center'">
    <q-form @submit.prevent="login" class="login-form">
      <q-card :flat="$q.screen.xs">
        <q-card-section>
          <div class="text-h6">Palabras</div>
          <div class="text-subtitle2">by bibenga</div>
        </q-card-section>

        <q-card-section>
          <q-tabs narrow-indicator>
            <q-route-tab label="Sign in" name="login" to="/login"></q-route-tab>
            <q-route-tab label="Sign up" name="rgister" to="/register"> </q-route-tab>
          </q-tabs>
        </q-card-section>

        <q-card-section>
          <q-banner v-if="errorMessage" class="text-white bg-red q-mb-md rounded-borders">
            {{ errorMessage }}
          </q-banner>

          <q-input
            clearable
            outlined
            v-model.trim="username"
            label="Username *"
            :error="valid === false"
            error-message="Unvalid username or password"
            :rules="[
              (val) => !!val || 'Field is required',
              (val, rules) => rules.email(val) || 'Please enter a valid email address',
            ]"
          />
          <q-input
            clearable
            outlined
            v-model.trim="password"
            type="password"
            label="Password *"
            :error="valid === false"
            error-message="Unvalid username or password"
            :rules="[(val) => !!val || 'Field is required']"
          />
        </q-card-section>

        <q-separator v-if="$q.platform.is.desktop" />

        <q-card-actions>
          <q-btn label="Login" type="submit" class="login-btn" color="primary" icon="login" />

          <q-btn
            label="Google"
            class="login-btn"
            color="primary"
            icon="follow_the_signs"
            @click.prevent="loginWithGoogle"
          />
        </q-card-actions>
      </q-card>
    </q-form>
  </q-page>
</template>

<style scoped>
.screen--xs .login-form {
  width: 100%;
}

.login-form {
  width: 400px;
}

.screen--xs .login-btn {
  width: 100%;
  margin-top: 8px;
  margin-left: 0px !important;
}
</style>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar, QInput } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import {
  GoogleAuthProvider,
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';

const $q = useQuasar();
const router = useRouter();
const route = useRoute();
const fireauth = getAuth();

const errorMessage = ref('');
const username = ref<string>();
const password = ref<string>();
const valid = ref<boolean>();

const redirectAfterLogin = () => {
  const to =
    route.query.redirect && typeof route.query.redirect === 'string'
      ? route.query.redirect
      : '/dashboard';
  console.debug(`redirect to ${to}`);
  router.push(to);
};

const login = () => {
  if (!username.value || !password.value) {
    return;
  }
  $q.loading.show();
  signInWithEmailAndPassword(fireauth, username.value, password.value)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log('user', user);
      redirectAfterLogin();
    })
    .catch((error) => {
      console.log('error', error);
      errorMessage.value = error.message;
    })
    .finally(() => {
      $q.loading.hide();
    });
};

const loginWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  // provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
  // provider.setCustomParameters({
  //   login_hint: 'user@example.com',
  // });
  signInWithPopup(fireauth, provider)
    .then((result) => {
      // This gives you a Google Access Token. You can use it to access the Google API.
      // const credential = GoogleAuthProvider.credentialFromResult(result);
      // const token = credential.accessToken;
      const user = result.user;
      // IdP data available using getAdditionalUserInfo(result)
      // ...

      console.debug('user', user);
      // const userName = user.displayName || user.email;
      // $q.notify({
      //   type: 'positive',
      //   message: `Welcome ${userName}!`,
      //   timeout: 1000,
      // });
      redirectAfterLogin();
    })
    .catch((error) => {
      // const errorCode = error.code;
      const errorMessage = error.message;
      // The email of the user's account used.
      // const email = error.customData.email;
      const credential = GoogleAuthProvider.credentialFromError(error);
      console.error('error', error);
      console.debug('credential', credential);
      errorMessage.value = error.message;
    });
};
</script>
