<template>
  <q-page>
    <q-layout v-if="loaded" view="hHh Lpr lFf">
      <q-form @submit.prevent="save" class="q-gutter-md">
        <q-card flat>
          <q-card-section>
            <div v-if="isNew" class="text-h6">Add new word</div>
            <div v-else class="text-h6">Edit {{ id }} word</div>
          </q-card-section>

          <q-card-section>
            <q-select
              label="Word1 *"
              filled
              v-model="word1"
              use-input
              use-chips
              multiple
              hide-dropdown-icon
              input-debounce="0"
              new-value-mode="add-unique"
              :rules="[
                (val) => (!!val && val.length > 0) || 'Field is required',
              ]"
            />

            <q-select
              label="Word2 *"
              filled
              v-model="word2"
              use-input
              use-chips
              multiple
              hide-dropdown-icon
              input-debounce="0"
              new-value-mode="add-unique"
              :rules="[
                (val) => (!!val && val.length > 0) || 'Field is required',
              ]"
            />

            <q-toggle v-model="isLearnedFlg" label="Learned" />
          </q-card-section>

          <q-card-actions>
            <q-btn
              type="submit"
              class="q-ml-sm"
              color="primary"
              icon="save"
              label="Save"
            />
            <q-btn
              @click="() => cancel()"
              outline
              class="q-ml-sm"
              color="primary"
              icon="cancel"
              label="Cancel"
            />
            <q-btn
              @click="() => del()"
              v-if="!isNew"
              class="q-ml-sm"
              color="negative"
              icon="delete"
              label="Delete"
            />
          </q-card-actions>
        </q-card>
      </q-form>
    </q-layout>
  </q-page>
</template>

<script setup lang="ts">
import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { QSpinnerGears, useQuasar } from 'quasar';
import { inject, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCurrentUser } from 'vuefire';

const $q = useQuasar();
const router = useRouter();
const firestore = inject<Firestore>('firestore');
const user = useCurrentUser();

const props = defineProps<{
  id: string;
}>();

const isNew = props.id == 'new';
const loaded = ref(false);
const docRef = ref();

const errorMessage = ref('');
const word1 = ref([]);
const word2 = ref([]);
const isLearnedFlg = ref(false);

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

      word1.value = docRef.value.word1;
      word2.value = docRef.value.word2;
      isLearnedFlg.value = docRef.value.isLearnedFlg;
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
onMounted(() => {
  load();
});

const save = async () => {
  console.log(`new: ${word1.value}; ${word2.value}; ${isLearnedFlg.value}`);

  if (isNew) {
    const word = {
      userId: user.value?.uid,
      createdTs: new Date(),
      word1: word1.value,
      word2: word2.value,
      isLearnedFlg: isLearnedFlg.value,
      random: Math.random(),
    };
    console.log('try add', word);
    const aword = await addDoc(collection(firestore, 'words'), word);
    $q.notify({
      message: `The document ${aword.id} was added`,
      timeout: 2000,
    });
  } else {
    await setDoc(
      doc(firestore, 'words', props.id),
      {
        word1: word1.value,
        word2: word2.value,
        isLearnedFlg: isLearnedFlg.value,
      },
      { merge: true }
    );
    $q.notify({
      message: `The document ${props.id} was updated`,
      timeout: 2000,
    });
  }
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
