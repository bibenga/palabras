<template>
  <q-page v-if="!pending">
    <q-form @submit.prevent="save" class="q-gutter-md">
      <q-card flat>
        <q-card-section>
          <div v-if="isNew" class="text-h6">Add new word</div>
          <div v-else class="text-h6">Edit {{ label }} word</div>
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
            :rules="[(val) => (!!val && val.length > 0) || 'Field is required']"
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
            :rules="[(val) => (!!val && val.length > 0) || 'Field is required']"
          />

          <q-toggle v-model="isLearnedFlg" label="Learned" />
        </q-card-section>

        <q-card-actions>
          <q-btn
            type="submit"
            unelevated
            class="q-ml-sm btn"
            color="primary"
            icon="save"
            label="Save"
          />
          <q-btn
            @click="() => cancel()"
            outline
            unelevated
            class="q-ml-sm btn"
            color="primary"
            icon="cancel"
            label="Cancel"
          />
          <q-space v-if="!$q.platform.is.mobile" />
          <q-btn
            @click="() => del()"
            v-if="!isNew"
            unelevated
            class="q-ml-sm btn"
            color="negative"
            icon="delete"
            label="Delete"
          />
        </q-card-actions>
      </q-card>
    </q-form>
  </q-page>
</template>

<style>
.mobile .btn {
  width: 100%;
  margin-top: 8px;
  margin-left: 0px !important;
}
</style>

<script setup lang="ts">
import {
  DocumentData,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { useQuasar } from 'quasar';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCurrentUser, useDocument, useFirestore } from 'vuefire';

const $q = useQuasar();
const router = useRouter();
const user = useCurrentUser();
const firestore = useFirestore();

const props = defineProps<{
  id: string;
}>();

const pending = ref(true);
const label = ref('');
const isNew = props.id == 'new';
const word1 = ref([]);
const word2 = ref([]);
const isLearnedFlg = ref(false);

// if (isNew) {
//   pending.value = false;
// } else {
//   const { data: word, promise } = useDocument(
//     doc(firestore, 'words', props.id)
//   );
//   onMounted(async () => {
//     $q.loading.show();
//     try {
//       const wordDoc: DocumentData | undefined = await promise.value;
//       label.value = wordDoc.word1.join(', ');
//       word1.value = wordDoc.word1;
//       word2.value = wordDoc.word2;
//       isLearnedFlg.value = wordDoc.isLearnedFlg;
//       pending.value = false;
//     } catch (error) {
//       console.error(error);
//     } finally {
//       $q.loading.hide();
//     }
//   });
// }

const load = async () => {
  // console.log(props.id, isNew);
  if (!isNew) {
    $q.loading.show();
    try {
      const docSnap = await getDoc(doc(firestore, 'words', props.id));
      docSnap.ref;
      console.log(docSnap.data());
      const docData = docSnap.data();
      label.value = docData.word1.join(', ');
      word1.value = docData.word1;
      word2.value = docData.word2;
      isLearnedFlg.value = docData.isLearnedFlg;
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: `The document ${props.id} failed to load: ${error}!`,
        timeout: 2000,
      });
      router.push('/word');
    } finally {
      pending.value = false;
      $q.loading.hide();
    }
  } else {
    pending.value = false;
  }
};

onMounted(() => {
  load();
});

const save = async () => {
  // console.log(`new: ${word1.value}; ${word2.value}; ${isLearnedFlg.value}`);

  $q.loading.show();
  try {
    if (isNew) {
      try {
        await addDoc(collection(firestore, 'words'), {
          userId: user.value?.uid,
          createdTs: new Date(),
          word1: word1.value,
          word2: word2.value,
          isLearnedFlg: isLearnedFlg.value,
          random: Math.random(),
        });
      } catch (error) {
        console.error(error);
      }
    } else {
      try {
        await updateDoc(doc(firestore, 'words', props.id), {
          word1: word1.value,
          word2: word2.value,
          isLearnedFlg: isLearnedFlg.value,
        });
      } catch (error) {
        console.error(error);
      }
    }
    router.push('/word');
  } finally {
    $q.loading.hide();
  }
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
    $q.loading.show();
    try {
      console.log('del doc', props.id);
      await deleteDoc(doc(firestore, 'words', props.id));
      $q.notify({
        message: 'The document was deleted',
        timeout: 2000,
      });
      router.push('/word');
    } finally {
      $q.loading.hide();
    }
  });
};
</script>
