<template>
  <q-page
    :class="$q.platform.is.mobile ? '' : 'row justify-center items-center'"
  >
    <q-form @submit.prevent="login" class="login-form">
      <q-card :flat="$q.platform.is.mobile">
        <q-card-section>
          <div class="text-h6">Inicia sesión</div>
          <div class="text-subtitle2">by bibenga</div>
        </q-card-section>

        <q-card-section>
          <q-tabs narrow-indicator>
            <q-route-tab
              label="Inicia sesión"
              name="login"
              to="/login"
            ></q-route-tab>
            <q-route-tab label="Registrarse" name="rgister" to="/register">
            </q-route-tab>
          </q-tabs>
        </q-card-section>

        <q-card-section>
          <q-banner
            v-if="errorMessage"
            class="text-white bg-red q-mb-md rounded-borders"
          >
            {{ errorMessage }}
          </q-banner>

          <q-input
            ref="usernameRef"
            clearable
            outlined
            v-model.trim="username"
            label="Username *"
            :error="valid === false"
            error-message="Unvalid username or password"
          />
          <q-input
            ref="passwordRef"
            clearable
            outlined
            v-model.trim="password"
            type="password"
            label="Password *"
            :error="valid === false"
            error-message="Unvalid username or password"
          />
        </q-card-section>

        <q-separator v-if="$q.platform.is.desktop" />

        <q-card-actions>
          <q-btn
            label="Login"
            type="submit"
            class="login-btn"
            color="primary"
            icon="mail"
          />

          <q-btn
            label="Google"
            class="login-btn"
            color="primary"
            icon="follow_the_signs"
            @click.prevent="() => loginWithGoogle()"
          />
        </q-card-actions>
      </q-card>
    </q-form>
  </q-page>
</template>

<style>
.mobile .login-form {
  width: 100%;
}

.desktop .login-form {
  width: 400px;
}

.mobile .login-btn {
  width: 100%;
  margin-top: 8px;
  margin-left: 0px !important;
}
</style>

<script setup lang="ts">
import { inject, ref } from 'vue';
import { useQuasar, QInput, QSpinnerGears } from 'quasar';
import { useRouter } from 'vue-router';
import {
  Auth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';

const $q = useQuasar();
const router = useRouter();

const errorMessage = ref('');
const usernameRef = ref<QInput>();
const passwordRef = ref<QInput>();
const username = ref<string>(
  'olala-AE92ED63-7F80-4FD5-B875-5D72A9774510@gmail.com'
);
const password = ref<string>('9B725739-9470-4237-8A75-0B2391BAA4C6');
const valid = ref<boolean>();

const fireauth = inject<Auth>('fireauth');

const login = async () => {
  $q.loading.show({
    spinner: QSpinnerGears,
    message: 'Logining...',
  });

  signInWithEmailAndPassword(fireauth, username.value, password.value)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log('user', user);

      const userName = user.displayName || user.email;
      $q.notify({
        type: 'positive',
        message: `Welcome ${userName}!`,
        timeout: 1000,
      });

      $q.loading.hide();
      router.push('/');
    })
    .catch((error) => {
      console.log('error', error);
      errorMessage.value = error.message;
      $q.loading.hide();
    });
};

const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  // provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
  // provider.setCustomParameters({
  //   login_hint: 'user@example.com',
  // });
  signInWithPopup(fireauth, provider)
    .then((result) => {
      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      // The signed-in user info.
      const user = result.user;
      // IdP data available using getAdditionalUserInfo(result)
      // ...

      console.log('user', user);
      const userName = user.displayName || user.email;
      $q.notify({
        type: 'positive',
        message: `Welcome ${userName}!`,
        timeout: 1000,
      });
      router.push('/');
    })
    .catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      // The email of the user's account used.
      const email = error.customData.email;
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error);
      // ...
      console.log('error', error);
      console.log('credential', credential);
      errorMessage.value = error.message;
    });
};
</script>
