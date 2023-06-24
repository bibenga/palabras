<template>
  <q-layout
    view="hHh Lpr lFf"
    class="window-height window-width row justify-center items-center"
  >
    <q-form @submit.prevent="login" class="q-gutter-md">
      <q-card class="" style="width: 400px">
        <q-card-section>
          <div class="text-h6">Iniciar sesión</div>
          <div class="text-subtitle2">by bibenga</div>
        </q-card-section>

        <q-card-section>
          <q-tabs narrow-indicator>
            <q-route-tab
              label="Iniciar sesión"
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

        <q-separator />

        <q-card-actions>
          <q-btn label="Login" type="submit" color="primary" />
        </q-card-actions>
      </q-card>
    </q-form>
  </q-layout>
</template>

<script setup lang="ts">
import { inject, ref } from 'vue';
import { useQuasar, QInput, QSpinnerGears } from 'quasar';
import { useRouter } from 'vue-router';
import { Auth, signInWithEmailAndPassword } from 'firebase/auth';

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
  console.log(
    `[LoginPage] login: username=${username.value}, password=${password.value}`
  );
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
</script>
