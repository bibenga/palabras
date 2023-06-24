<template>
  <q-layout
    view="hHh Lpr lFf"
    class="window-height window-width row justify-center items-center"
  >
    <q-form @submit.prevent="register" class="q-gutter-md">
      <q-card class="" style="width: 400px">
        <q-card-section>
          <div class="text-h6">Registrarse</div>
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
            :rules="[(val) => !!val || 'Field is required']"
          />
          <q-input
            ref="passwordRef"
            clearable
            outlined
            v-model.trim="password"
            type="password"
            label="Password *"
            :rules="[(val) => !!val || 'Field is required']"
          />
          <!-- <q-input
            ref="codeRef"
            clearable
            outlined
            v-model.trim="code"
            label="Code *"
            :rules="[(val) => !!val || 'Field is required']"
          /> -->
        </q-card-section>

        <q-separator />

        <q-card-actions>
          <q-btn label="Register" type="submit" color="primary" />
        </q-card-actions>
      </q-card>
    </q-form>
  </q-layout>
</template>

<script setup lang="ts">
import { inject, ref } from 'vue';
import { useQuasar, QInput, QSpinnerGears } from 'quasar';
import { useRouter } from 'vue-router';
import { Auth, createUserWithEmailAndPassword } from 'firebase/auth';

const $q = useQuasar();
const router = useRouter();

const errorMessage = ref('');
const usernameRef = ref<QInput>();
const passwordRef = ref<QInput>();
// const codeRef = ref<QInput>();
const username = ref<string>(
  'olala-AE92ED63-7F80-4FD5-B875-5D72A9774510@gmail.com'
);
const password = ref<string>('9B725739-9470-4237-8A75-0B2391BAA4C6');
// const code = ref<string>('4729');

const fireauth = inject<Auth>('fireauth');

const register = () => {
  $q.loading.show({
    spinner: QSpinnerGears,
    message: 'Registering...',
  });

  createUserWithEmailAndPassword(fireauth, username.value, password.value)
    .then((userCredential) => {
      const user = userCredential.user;

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
