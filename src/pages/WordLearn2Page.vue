<template>
  <q-page
    v-if="ready"
    :class="$q.screen.xs ? '' : 'row justify-center items-center'"
  >
    <q-card flat :bordered="!$q.screen.xs" class="learn2-form">
      <q-card-section>
        <div class="text-h6">Ejercicio v2</div>
        <div class="text-overline">recoger las palabras</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div v-for="card in cards" :key="card.id" class="row">
          <div class="col-6 q-pa-xs">
            <q-btn
              style="width: 100%; font-size: 1.2em"
              :outline="getOutline(card.word1Id, word1Selected)"
              :disable="getDisabled(card.word1Id, word1Selected)"
              :color="getColor(card.word1Id, word1Selected)"
              :label="card.word1"
              @click="() => word1Clicked(card)"
            />
          </div>
          <div class="col-6 q-pa-xs">
            <q-btn
              style="width: 100%; font-size: 1.2em"
              :outline="getOutline(card.word2Id, word2Selected)"
              :disable="getDisabled(card.word2Id, word2Selected)"
              :color="getColor(card.word2Id, word2Selected)"
              :label="card.word2"
              @click="() => word2Clicked(card)"
            />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions>
        <q-btn
          v-if="cards.length == correct.length"
          @click="() => init()"
          label="Siguiente"
          unelevated
          class="btn"
          color="positive"
        />
        <q-btn
          v-else
          @click="() => init()"
          label="Siguiente"
          unelevated
          class="btn"
          color="primary"
        />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<style>
.screen--xs .learn2-form {
  width: 100%;
}

.learn2-form {
  width: 600px;
}

.screen--xs .btn {
  width: 100%;
  margin-top: 8px;
  margin-left: 0px !important;
}
</style>

<script setup lang="ts">
import { useWordsStore } from 'src/stores/words';
import { storeToRefs } from 'pinia';
import { onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();

const wordsStore = useWordsStore();
const { ready } = storeToRefs(wordsStore);

const cards = ref([]);
const correct = ref<string[]>([]);
const incorrect = ref(false);
const word1Selected = ref('');
const word2Selected = ref('');

onMounted(() => {
  if (wordsStore.words.length > 0) {
    init();
  } else {
    const unwatch = watch(
      () => wordsStore.words.length,
      (w) => {
        console.log('watch', w);
        unwatch();
        init();
      }
    );
  }
});

const init = () => {
  const randomWords = wordsStore.randomWords(5, null);
  const res = [];
  for (let i = 0; i < randomWords.length; i++) {
    res.push({
      id: i,
      word1Id: '',
      word1: '',
      word2Id: '',
      word2: '',
    });
  }
  for (const w of randomWords) {
    let word1 = w.word1[0];
    let word2 = w.word2[0];
    while (true) {
      const index = Math.floor(Math.random() * res.length);
      if (res[index].word1 == '') {
        res[index].word1Id = w.id;
        res[index].word1 = word1;
        break;
      }
    }
    while (true) {
      const index = Math.floor(Math.random() * res.length);
      if (res[index].word2 == '') {
        res[index].word2Id = w.id;
        res[index].word2 = word2;
        break;
      }
    }
  }
  cards.value = res;
  correct.value = [];
  incorrect.value = false;
  word1Selected.value = '';
  word2Selected.value = '';
};

const getDisabled = (wordId: string, selectedWordId: string): boolean => {
  if (correct.value.includes(wordId)) {
    return true;
  }
  if (selectedWordId != '' && wordId != selectedWordId) {
    return true;
  }
  return incorrect.value;
};

const getColor = (wordId: string, selectedWordId: string): string => {
  if (correct.value.includes(wordId)) {
    return 'positive';
  }
  if (incorrect.value && wordId === selectedWordId) {
    return 'negative';
  }
  return 'primary';
};

const getOutline = (wordId: string, selectedWordId: string): boolean => {
  if (correct.value.includes(wordId)) {
    return true;
  }
  return wordId != selectedWordId;
};

const validate = () => {
  if (word1Selected.value === '' || word2Selected.value === '') {
    return;
  }
  if (word1Selected.value === word2Selected.value) {
    correct.value = [word1Selected.value, ...correct.value];
    word1Selected.value = '';
    word2Selected.value = '';
  } else {
    incorrect.value = true;
    setTimeout(() => {
      word1Selected.value = '';
      word2Selected.value = '';
      incorrect.value = false;
    }, 2000);
  }
};

const word1Clicked = (card) => {
  if (word1Selected.value == card.word1Id) {
    word1Selected.value = '';
  } else {
    word1Selected.value = card.word1Id;
  }
  validate();
};

const word2Clicked = (card) => {
  if (word2Selected.value == card.word2Id) {
    word2Selected.value = '';
  } else {
    word2Selected.value = card.word2Id;
  }
  validate();
};
</script>
