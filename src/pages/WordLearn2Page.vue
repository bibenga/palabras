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
        <div v-for="(item, index) in rows" :key="index" class="row">
          <div class="col-6 q-pa-xs">
            <q-btn
              :class="{ shake: incorrect && item.word1Id == word1Selected }"
              style="width: 100%; font-size: 1.2em"
              :outline="getOutline(item.word1Id, word1Selected)"
              :disable="getDisabled(item.word1Id, word1Selected)"
              :color="getColor(item.word1Id, word1Selected)"
              :label="item.word1"
              @click="() => word1Clicked(item)"
            />
          </div>
          <div class="col-6 q-pa-xs">
            <q-btn
              style="width: 100%; font-size: 1.2em"
              :class="{ shake: incorrect && item.word2Id == word2Selected }"
              :outline="getOutline(item.word2Id, word2Selected)"
              :disable="getDisabled(item.word2Id, word2Selected)"
              :color="getColor(item.word2Id, word2Selected)"
              :label="item.word2"
              @click="() => word2Clicked(item)"
            />
          </div>
        </div>
      </q-card-section>

      <!-- <q-card-section class="q-pa-none">
        <q-card-section horizontal class="q-pa-none row">
          <q-card-section class="q-pa-none col-6">
            <div v-for="card in cards" :key="card.id" class="q-pa-xs">
              <q-btn
                style="width: 100%; font-size: 1.2em"
                :outline="getOutline(card.word1Id, word1Selected)"
                :disable="getDisabled(card.word1Id, word1Selected)"
                :color="getColor(card.word1Id, word1Selected)"
                :label="card.word1"
                @click="() => word1Clicked(card)"
              />
            </div>
          </q-card-section>

          <q-separator vertical />

          <q-card-section class="q-pa-none col-6">
            <div v-for="card in cards" :key="card.id" class="q-pa-xs">
              <q-btn
                style="width: 100%; font-size: 1.2em"
                :outline="getOutline(card.word2Id, word2Selected)"
                :disable="getDisabled(card.word2Id, word2Selected)"
                :color="getColor(card.word2Id, word2Selected)"
                :label="card.word2"
                @click="() => word2Clicked(card)"
              />
            </div>
          </q-card-section>
        </q-card-section>
      </q-card-section> -->

      <q-separator />

      <q-card-actions>
        <q-btn
          v-if="rows.length == correct.length"
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

.shake {
  animation: shake 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  transform: translate3d(0, 0, 0);
}

@keyframes shake {
  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }

  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }

  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }

  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
}
</style>

<script setup lang="ts">
import { useWordsStore } from 'src/stores/words';
import { storeToRefs } from 'pinia';
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();

const wordsStore = useWordsStore();
const { ready } = storeToRefs(wordsStore);

const rows = ref<object[]>([]);
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
  rows.value = res;
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

let errorTimer = null;
const validate = (): void => {
  if (word1Selected.value === '' || word2Selected.value === '') {
    return;
  }
  if (word1Selected.value === word2Selected.value) {
    correct.value = [word1Selected.value, ...correct.value];
    word1Selected.value = '';
    word2Selected.value = '';
  } else {
    incorrect.value = true;
    errorTimer = setTimeout(() => {
      word1Selected.value = '';
      word2Selected.value = '';
      incorrect.value = false;
      errorTimer = null;
    }, 900);
  }
};
onUnmounted(() => {
  if (!!errorTimer) {
    clearTimeout(errorTimer);
    errorTimer = null;
  }
});

const word1Clicked = (item): void => {
  if (word1Selected.value == item.word1Id) {
    word1Selected.value = '';
  } else {
    word1Selected.value = item.word1Id;
  }
  validate();
};

const word2Clicked = (item): void => {
  if (word2Selected.value == item.word2Id) {
    word2Selected.value = '';
  } else {
    word2Selected.value = item.word2Id;
  }
  validate();
};
</script>
