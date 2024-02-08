<template>
  <q-page v-if="ready">
    <q-form @submit.prevent="save" class="q-gutter-md">
      <q-card flat>
        <q-card-section>
          <div v-if="isNew" class="text-h6">Add new word</div>
          <div v-else class="text-h6">Edit {{ title }} word</div>
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
          <q-space v-if="!$q.screen.xs" />
          <q-btn
            v-if="!isNew"
            @click="() => del()"
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
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { useWordsStore } from 'src/stores/words';
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const router = useRouter();

const wordsStore = useWordsStore();
const { ready } = storeToRefs(wordsStore);

const props = defineProps<{
  id: string;
}>();

const title = ref('');
const isNew = props.id == 'new';
const word1 = ref([] as string[]);
const word2 = ref([] as string[]);
const isLearnedFlg = ref(false);

const load = async () => {
  if (!isNew) {
    $q.loading.show();
    try {
      const word = wordsStore.getWord(props.id);
      if (word == null) {
        throw new Error('unknown word');
      }
      title.value = word.word1.join(', ');
      word1.value = word.word1;
      word2.value = word.word2;
      isLearnedFlg.value = word.isLearnedFlg;
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
  }
};

onMounted(() => {
  watch(
    ready,
    (v) => {
      if (v) {
        load();
      }
    },
    { immediate: true },
  );
});

const save = async () => {
  $q.loading.show();
  try {
    if (isNew) {
      try {
        await wordsStore.createWord(word1.value, word2.value, isLearnedFlg.value);
      } catch (error) {
        console.error(error);
      }
    } else {
      try {
        await wordsStore.updateWord(props.id, word1.value, word2.value, isLearnedFlg.value);
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
      wordsStore.deleteWord(props.id);
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
