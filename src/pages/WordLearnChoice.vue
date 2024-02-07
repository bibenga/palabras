<template>
  <q-page
    v-if="ready"
    :class="$q.screen.xs ? '' : 'row justify-center items-center'"
  >
    <q-card flat :bordered="!$q.screen.xs" class="learn2-form">
      <q-card-section>
        <div class="text-h6">Exercise 2</div>
        <div class="text-overline">pick up the words</div>
      </q-card-section>

      <q-separator />

      <q-card-section v-if="rows != null">
        <div v-for="item in rows" :key="item.id" class="row">
          <div class="col-6 q-pa-xs">
            <q-btn
              :class="{ shake: incorrect && item.left.wordId == leftSelected }"
              style="width: 100%; font-size: 1.2em"
              :outline="getOutline(item.left.wordId, leftSelected)"
              :disable="getDisabled(item.left.wordId, leftSelected)"
              :color="getColor(item.left.wordId, leftSelected)"
              :label="item.left.word1[0]"
              @click="() => leftClicked(item.left)"
            />
          </div>
          <div class="col-6 q-pa-xs">
            <q-btn
              style="width: 100%; font-size: 1.2em"
              :class="{
                shake: incorrect && item.right.wordId == rightSelected,
              }"
              :outline="getOutline(item.right.wordId, rightSelected)"
              :disable="getDisabled(item.right.wordId, rightSelected)"
              :color="getColor(item.right.wordId, rightSelected)"
              :label="item.right.word2[0]"
              @click="() => rightClicked(item.right)"
            />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions>
        <q-btn
          v-if="task?.isDoneFlg || rows.length == correct.length"
          @click="() => newTask()"
          label="Next"
          icon="navigate_next"
          unelevated
          class="btn"
          color="positive"
        />
        <q-btn
          v-else
          @click="() => newTask()"
          label="Skip"
          icon="autorenew"
          unelevated
          class="btn"
          color="primary"
        />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<style scoped>
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
import { storeToRefs } from 'pinia';
import { onUnmounted, ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useTasksStore } from 'src/stores/tasks';
import { TaskWord } from 'src/stores/models';

const $q = useQuasar();

const tasksStore = useTasksStore();
const { tasks, ready } = storeToRefs(tasksStore);
const task = computed(() => {
  if (tasks.value === null || tasks.value === undefined) {
    return null;
  }
  for (const t of tasks.value) {
    if (t.type === 'choice') {
      if (!t.isSkipedFlg) {
        return t;
      } else {
        return null;
      }
    }
  }
  return null;
});

interface ButtonRow {
  id: string;
  left: TaskWord;
  right: TaskWord;
}

const rows = computed(() => {
  const words = task.value?.words;
  const res: ButtonRow[] = [];
  if (words) {
    const left = [...words].sort(
      (i1, i2) => i1.word1position - i2.word1position,
    );
    const right = [...words].sort(
      (i1, i2) => i1.word2position - i2.word2position,
    );
    for (let i = 0; i < words.length; i++) {
      const l = left[i];
      const r = right[i];
      // console.log('left', i, `${l.word2position} - ${l.word2[0]}`);
      // console.log('right', i, `${r.word2position} - ${r.word2[0]}`);
      res.push({
        id: `${l.wordId}-${r.wordId}`,
        left: l,
        right: r,
      });
    }
  }
  return res;
});

const correct = ref<string[]>([]);
const incorrect = ref(false);
const leftSelected = ref('');
const rightSelected = ref('');
let nextTaskTimer = null;
let errorTimer = null;

const newTask = async () => {
  $q.loading.show();
  try {
    if (!!nextTaskTimer) {
      clearTimeout(nextTaskTimer);
      nextTaskTimer = null;
    }

    if (task.value && !task.value.isDoneFlg && !task.value.isSkipedFlg) {
      await tasksStore.markAsSkiped(task.value);
    }

    const success = await tasksStore.newTask('choice');
    console.debug('newTask', success);
    if (!success) {
      $q.notify({
        type: 'negative',
        message: "Can't create new task",
        timeout: 2000,
      });
    }
    correct.value = [];
    incorrect.value = false;
    leftSelected.value = '';
    rightSelected.value = '';
  } finally {
    $q.loading.hide();
  }
};

const getDisabled = (wordId: string, selectedWordId: string): boolean => {
  if (task.value?.isDoneFlg || correct.value.includes(wordId)) {
    return true;
  }
  if (selectedWordId != '' && wordId != selectedWordId) {
    return true;
  }
  return incorrect.value;
};

const getColor = (wordId: string, selectedWordId: string): string => {
  if (task.value?.isDoneFlg || correct.value.includes(wordId)) {
    return 'positive';
  }
  if (incorrect.value && wordId === selectedWordId) {
    return 'negative';
  }
  return 'primary';
};

const getOutline = (wordId: string, selectedWordId: string): boolean => {
  if (task.value?.isDoneFlg || correct.value.includes(wordId)) {
    return true;
  }
  return wordId != selectedWordId;
};

const validate = async (): Promise<void> => {
  if (leftSelected.value === '' || rightSelected.value === '') {
    return;
  }
  if (leftSelected.value === rightSelected.value) {
    correct.value = [leftSelected.value, ...correct.value];
    leftSelected.value = '';
    rightSelected.value = '';
  } else {
    incorrect.value = true;
    errorTimer = setTimeout(() => {
      leftSelected.value = '';
      rightSelected.value = '';
      incorrect.value = false;
      errorTimer = null;
    }, 900);
  }
  if (task.value?.words.length === correct.value.length) {
    await tasksStore.markAsDone(task.value);
    nextTaskTimer = setTimeout(newTask, 2000);
  }
};

onUnmounted(() => {
  if (!!errorTimer) {
    clearTimeout(errorTimer);
    errorTimer = null;
  }
  if (!!nextTaskTimer) {
    clearTimeout(nextTaskTimer);
    nextTaskTimer = null;
  }
});

const leftClicked = async (left: TaskWord): Promise<void> => {
  if (leftSelected.value == left.wordId) {
    leftSelected.value = '';
  } else {
    leftSelected.value = left.wordId;
  }
  await validate();
};

const rightClicked = async (right: TaskWord): Promise<void> => {
  if (rightSelected.value == right.wordId) {
    rightSelected.value = '';
  } else {
    rightSelected.value = right.wordId;
  }
  await validate();
};
</script>
