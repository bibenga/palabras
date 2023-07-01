<template>
  <q-page
    :class="$q.platform.is.mobile ? '' : 'row justify-center items-center'"
  >
    <q-card flat :bordered="!$q.platform.is.mobile" class="learn-form">
      <q-card-section>
        <div class="text-h6">Prueba</div>
      </q-card-section>

      <q-card-section>
        <!-- <q-banner
          v-if="errorMessage"
          class="text-white bg-red q-mb-md rounded-borders"
        >
          {{ errorMessage }}
        </q-banner> -->

        <!-- <div>rank: {{ rankDebug }}</div>
        <div>selected: {{ selectedDebug }}</div>
        <div>{{ task }}</div> -->
        <!-- <p>{{ task2.id }} -> {{ task2 }}</p> -->

        <p v-if="task != null" style="min-height: 3em">
          <span>
            <span
              style="
                cursor: default;
                font-size: 1.5em;
                text-decoration-line: underline;
                text-decoration-style: dotted;
              "
            >
              {{ task.word1[0] }}
            </span>
            <q-tooltip>
              {{ task.word2.join(', ') }}
            </q-tooltip>
          </span>
        </p>

        <div>
          <q-input
            ref="answerControl"
            v-model.trim="answer"
            style="font-size: 1.5em"
            @keydown.enter.prevent="validateAnswer"
            filled
            autogrow
            autofocus
            :readonly="answerIsValid"
            :error="answerIsValid !== undefined && !answerIsValid"
          />
        </div>
      </q-card-section>

      <q-separator v-if="$q.platform.is.desktop" />

      <q-card-actions>
        <q-btn
          v-if="!answerIsValid"
          @click="() => validateAnswer()"
          label="Entregar"
          unelevated
          class="btn"
          color="primary"
        />
        <q-btn
          v-else
          @click="() => validateAnswer()"
          label="Siguiente"
          unelevated
          class="btn"
          color="positive"
        />
        <q-space v-if="!$q.platform.is.mobile" />
        <q-btn
          @click="() => skipTask()"
          label="Saltar"
          unelevated
          class="btn"
          color="secondary"
          outline
        />
        <q-btn
          @click="() => markAsKnowed()"
          label="¡Lo sé!"
          unelevated
          class="btn"
          color="secondary"
          outline
        />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<style>
.mobile .learn-form {
  width: 100%;
}

.desktop .learn-form {
  width: 800px;
}

.mobile .btn {
  width: 100%;
  margin-top: 8px;
  margin-left: 0px !important;
}
</style>

<script setup lang="ts">
import {
  DocumentData,
  Firestore,
  addDoc,
  and,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useQuasar } from 'quasar';
import { inject, onMounted, ref } from 'vue';
import { useCurrentUser } from 'vuefire';
import deburr from 'lodash/deburr';
import isEqual from 'lodash/isEqual';

const $q = useQuasar();

const user = useCurrentUser();
const firestore = inject<Firestore>('firestore');
const tasksCol = collection(firestore, 'tasks');
const wordsCol = collection(firestore, 'words');

const task = ref();
const answerInput = ref();
const answer = ref('');
const answerIsValid = ref<boolean>();
const selectedDebug = ref();

// const { data: lastTask, pending: loading } = useCollection(
//   query(
//     tasksCol,
//     and(
//       where('userId', '==', user.value?.uid),
//       where('isDoneFlg', '==', false),
//       where('isSkipedFlg', '==', false)
//     ),
//     orderBy('createdTs', 'desc'),
//     limit(1)
//   ),
//   {
//     ssrKey: 'currentTask',
//   }
// );
// const task2 = computed(() => {
//   if (!loading.value && lastTask.value.length == 1) {
//     const res = lastTask.value[0];
//     console.log('task2', res, res?.id, res);
//     return res;
//   }
//   console.log('task2');
//   return null;
// });

const load = async () => {
  const qTasks = query(
    tasksCol,
    and(
      where('userId', '==', user.value?.uid),
      where('isDoneFlg', '==', false),
      where('isSkipedFlg', '==', false)
    ),
    orderBy('createdTs', 'desc'),
    limit(1)
  );
  const sTasks = await getDocs(qTasks);
  let dTask: DocumentData | null;
  if (sTasks.size == 0) {
    // [0.3, 0.5, 0.8]
    // 0.9 => '>=' null => '<=' 1
    // 0.4 => 1 => 1
    const rank = Math.random();
    let qWords = query(
      wordsCol,
      and(
        where('userId', '==', user.value?.uid),
        where('isLearnedFlg', '==', false),
        where('random', '>=', rank)
      ),
      orderBy('random', 'asc'),
      limit(1)
    );
    let sWords = await getDocs(qWords);
    if (sWords.size == 0) {
      qWords = query(
        wordsCol,
        and(
          where('userId', '==', user.value?.uid),
          where('isLearnedFlg', '==', false),
          where('random', '<=', rank)
        ),
        orderBy('random', 'asc'),
        limit(1)
      );
      sWords = await getDocs(qWords);
    }

    if (sWords.size == 1) {
      const sWord = sWords.docs[0];
      console.log(sWord);
      let word1, word2;
      if (Math.random() >= 0.5) {
        word1 = sWord.data().word1;
        word2 = sWord.data().word2;
      } else {
        word1 = sWord.data().word2;
        word2 = sWord.data().word1;
      }
      const newTask = {
        userId: user.value?.uid,
        createdTs: new Date(),
        updatedTs: null,
        wordId: sWord.id,
        word1: word1,
        word2: word2,
        isDoneFlg: false,
        isSkipedFlg: false,
      };
      selectedDebug.value = sWords.docs[0].data().random;
      console.log('add', newTask);
      dTask = await addDoc(tasksCol, newTask);
      task.value = {
        ...newTask,
        id: dTask.id,
      };
      console.log('added', dTask);
    } else {
      dTask = null;
      $q.notify({
        type: 'danger',
        message: 'No hay palabras!',
        timeout: 5000,
      });
    }
  } else {
    console.log(sTasks.docs[0]);
    dTask = sTasks.docs[0];
    task.value = {
      ...dTask.data(),
      id: dTask.id,
    };
  }
  answer.value = '';
  answerIsValid.value = undefined;
};
onMounted(() => {
  load();
});

const skipTask = async () => {
  try {
    await updateDoc(doc(tasksCol, task.value.id), {
      isSkipedFlg: true,
      updatedTs: new Date(),
    });
  } catch (error) {
    console.error(error);
  }
  await load();
};

const markAsKnowed = async () => {
  console.log('markAsKnowed', task.value.id, task.value.wordId);
  try {
    await updateDoc(doc(tasksCol, task.value.id), {
      isSkipedFlg: true,
      updatedTs: new Date(),
    });
  } catch (error) {
    console.error(error);
  }
  try {
    await updateDoc(doc(wordsCol, task.value.wordId), { isLearnedFlg: true });
  } catch (error) {
    console.error(error);
  }
  await load();
};

const validateAnswer = async () => {
  if (answerIsValid.value) {
    await load();
    answerInput.value.focus();
    return;
  }

  const splitRule = /[ \r\n¡!¿?.,:;'\"]+/;
  // const convert = (s: string) => s.toLowerCase().normalize('NFKD').split(splitRule);
  const convert = (s: string) => deburr(s.toLowerCase()).split(splitRule);
  const aAnswer = convert(answer.value);
  let valid = false;
  for (const word2 of task.value.word2) {
    const aWord2 = convert(word2);
    valid = isEqual(aAnswer, aWord2);
    console.debug(aAnswer, '===', aWord2, '->', valid);
    if (valid) {
      break;
    }
  }

  answerIsValid.value = valid;
  if (valid) {
    await updateDoc(doc(tasksCol, task.value.id), {
      isDoneFlg: true,
      updatedTs: new Date(),
    });
  } else {
    answerInput.value.focus();
  }
};
</script>
