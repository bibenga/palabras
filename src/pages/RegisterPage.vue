<template>
  <q-page :class="$q.screen.xs ? '' : 'row justify-center items-center'">
    <q-form @submit.prevent="register" class="login-form">
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
            :rules="[(val) => !!val || 'Field is required']"
          />
        </q-card-section>

        <q-separator v-if="$q.platform.is.desktop" />

        <q-card-actions>
          <q-btn
            label="Create account"
            type="submit"
            class="login-btn"
            color="primary"
            icon="login"
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
}
</style>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar, QInput } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';

const $q = useQuasar();
const router = useRouter();
const route = useRoute();
const fireauth = getAuth();

const errorMessage = ref('');
const username = ref<string>();
const password = ref<string>();

const redirectAfterRegister = () => {
  const to =
    route.query.redirect && typeof route.query.redirect === 'string'
      ? route.query.redirect
      : '/dashboard';
  console.debug(`redirect to ${to}`);
  router.push(to);
};

const register = () => {
  if (!username.value || !password.value) {
    return;
  }
  $q.loading.show();
  createUserWithEmailAndPassword(fireauth, username.value, password.value)
    .then(() => {
      redirectAfterRegister();
    })
    .catch((error) => {
      console.log('error', error);
      errorMessage.value = error.message;
    })
    .finally(() => {
      $q.loading.hide();
    });
};
</script>
