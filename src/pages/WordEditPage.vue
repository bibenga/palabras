<template>
  <q-page v-if="!pending">
    <q-form @submit.prevent="save" class="q-gutter-md">
      <q-card flat>
        <q-card-section>
          <div v-if="isNew" class="text-h6">Add new word</div>
          <div v-else class="text-h6">Edit "{{ title }}" word</div>
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
            @click="cancel"
            outline
            unelevated
            class="q-ml-sm btn"
            color="primary"
            icon="cancel"
            label="Cancel"
          />
          <q-space v-if="!$q.screen.xs" />
          <q-btn
            v-if="!isNew"
            @click="del"
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

<style scoped>
.screen--xs .btn {
  width: 100%;
  margin-top: 8px;
  margin-left: 0px !important;
}
</style>

<script setup lang="ts">
import { doc, collection, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useQuasar } from 'quasar';
import { Word } from 'src/stores/models';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { getCurrentUser, useDocument, useFirestore } from 'vuefire';

const props = defineProps<{
  id: string;
}>();

const $q = useQuasar();
const router = useRouter();

const firestore = useFirestore()!;
const wordsCol = collection(firestore, 'words');
const { pending, promise } = useDocument<Word>(() => {
  if (props.id == 'new') {
    return null;
  }
  return doc(wordsCol, props.id);
});

const isNew = props.id == 'new';
const title = ref('');
const word1 = ref([] as string[]);
const word2 = ref([] as string[]);
const isLearnedFlg = ref(false);

promise.value
  .then((word) => {
    if (props.id == 'new') {
      return;
    }
    console.log(`load: word=${word?.id}`);
    if (!word) {
      throw new Error('Invalid ID');
    }
    title.value = word.word1.join(', ');
    word1.value = word.word1;
    word2.value = word.word2;
    isLearnedFlg.value = word.isLearnedFlg;
  })
  .catch((error) => {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: `An error is occurred during load operation: ${error}!`,
      timeout: 2000,
    });
    router.push('/word');
  });

const save = async () => {
  $q.loading.show();
  try {
    if (isNew) {
      const user = (await getCurrentUser())!;
      await addDoc(wordsCol, {
        userId: user.uid || '',
        word1: word1.value,
        word2: word2.value,
        isLearnedFlg: isLearnedFlg.value,
        random: Math.random(),
        createdTs: new Date(),
        updatedTs: new Date(),
      });
    } else {
      await updateDoc(doc(wordsCol, props.id), {
        word1: word1.value,
        word2: word2.value,
        isLearnedFlg: isLearnedFlg.value,
        updatedTs: new Date(),
      });
    }
    router.push('/word');
  } catch (error) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: `An error is occurred during update operation: ${error}!`,
      timeout: 2000,
    });
  } finally {
    $q.loading.hide();
  }
};

const cancel = () => {
  router.push('/word');
};

const del = () => {
  $q.dialog({
    title: 'Confirmation',
    message: 'Do you really want to delete selected pairs?',
    cancel: true,
    focus: 'cancel',
  }).onOk(async () => {
    $q.loading.show();
    try {
      console.log('del doc', props.id);
      await deleteDoc(doc(wordsCol, props.id));
      $q.notify({
        message: 'The document was deleted',
        timeout: 2000,
      });
      router.push('/word');
    } catch (error) {
      console.error(error);
      $q.notify({
        type: 'negative',
        message: `An error is occurred during delete operation: ${error}!`,
        timeout: 2000,
      });
    } finally {
      $q.loading.hide();
    }
  });
};
</script>
