<template>
  <div v-if="loaded" class="q-pa-md">
    <div>Edit {{ docRef }}</div>
    <div>isNew {{ isNew }}</div>
    <div>
      <q-btn color="primary" @click="() => save()" icon="save" label="Save" />
      <q-btn
        outline
        color="primary"
        @click="() => cancel()"
        icon="cancel"
        label="Cancel"
      />
      <q-btn
        v-if="!isNew"
        @click="() => del()"
        icon="delete"
        color="negative"
        label="Delete"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '@vueuse/firebase';
import { Auth } from 'firebase/auth';
import {
  DocumentData,
  DocumentReference,
  Firestore,
  deleteDoc,
  doc,
  getDoc,
} from 'firebase/firestore';
import { QSpinnerGears, useQuasar } from 'quasar';
import { inject, ref } from 'vue';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const router = useRouter();
const fireauth = inject<Auth>('fireauth');
const firestore = inject<Firestore>('firestore');
const { user } = useAuth(fireauth);

const props = defineProps<{
  id: string;
}>();

const isNew = props.id == 'new';
const loaded = ref(false);
const docRef = ref();

const load = async () => {
  console.log(props.id, isNew);
  if (!isNew) {
    $q.loading.show({
      spinner: QSpinnerGears,
      message: `Logining ${props.id}...`,
    });
    try {
      const docSnap = await getDoc(doc(firestore, 'words', props.id));
      console.log(docSnap.data());
      loaded.value = true;
      docRef.value = docSnap.data();
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: `The document ${props.id} failed to load: ${error}!`,
        timeout: 2000,
      });
      router.push('/word');
    } finally {
      $q.loading.hide();
    }
  } else {
    loaded.value = true;
    docRef.value = {};
  }
};
load();

const save = async () => {
  router.push('/word');
};
const cancel = async () => {
  router.push('/word');
};
const del = async () => {
  $q.dialog({
    title: 'Confirmation',
    message: 'Do yo want delete this word?',
    cancel: true,
    focus: 'cancel',
  }).onOk(async () => {
    console.log('del doc', props.id);
    await deleteDoc(doc(firestore, 'words', props.id));
    $q.notify({
      message: `The document ${props.id} was deleted`,
      timeout: 2000,
    });
    router.push('/word');
  });
};
</script>
