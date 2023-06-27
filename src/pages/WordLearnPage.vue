<template>
  <q-page class="row justify-center items-center">
    <q-card :flat="$q.platform.is.mobile">
      <q-card-section>
        <div class="text-h6">Prueba</div>
      </q-card-section>

      <q-card-section style="width: 400px">
        <!-- <q-banner
          v-if="errorMessage"
          class="text-white bg-red q-mb-md rounded-borders"
        >
          {{ errorMessage }}
        </q-banner> -->

        <!-- <div>rank: {{ rankDebug }}</div>
        <div>selected: {{ selectedDebug }}</div>
        <div>{{ task }}</div> -->

        <p v-if="task != null" style="min-height: 3em">
          <span>
            <span
              style="
                cursor: default;
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
            @keydown.enter.prevent="validateAnswer"
            filled
            autogrow
            autofocus
          />
        </div>
      </q-card-section>

      <q-separator v-if="$q.platform.is.desktop" />

      <q-card-actions>
        <q-btn
          @click="() => validateAnswer()"
          label="Entregar"
          color="primary"
        />

        <q-btn @click="() => skipTask()" class="q-ml-sm" label="Siguiente" />
        <q-btn @click="() => markAsKnowed()" class="q-ml-sm" label="¡Lo sé!" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { useAuth } from '@vueuse/firebase';
import { Auth } from 'firebase/auth';
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
  setDoc,
  where,
} from 'firebase/firestore';
import { useQuasar } from 'quasar';
import { inject, ref } from 'vue';

const $q = useQuasar();

const fireauth = inject<Auth>('fireauth');
const firestore = inject<Firestore>('firestore');
const { user } = useAuth(fireauth);

const task = ref();
const answerControl = ref();
const answer = ref('');
const rankDebug = ref();
const selectedDebug = ref();
const load = async () => {
  const cTasks = collection(firestore, 'tasks');
  const qTasks = query(
    cTasks,
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
    const cWords = collection(firestore, 'words');

    // [0.3, 0.5, 0.8]
    // 0.9 => '>=' null => '<=' 1
    // 0.4 => 1 => 1
    const rank = Math.random();
    rankDebug.value = rank;
    let qWords = query(
      cWords,
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
        cWords,
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
        wordId: sWord.id,
        word1: word1,
        word2: word2,
        isDoneFlg: false,
        isSkipedFlg: false,
        debug: { random: sWord.data().random, rank: rank },
      };
      selectedDebug.value = sWords.docs[0].data().random;
      console.log('add', newTask);
      dTask = await addDoc(cTasks, newTask);
      task.value = {
        ...newTask,
        id: dTask.id,
      };
      console.log('added', dTask);
      $q.notify({
        type: 'danger',
        message: `Ha añadido una tarea ${dTask.id}`,
        timeout: 5000,
      });
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
    $q.notify({
      type: 'danger',
      message: `Hay una tarea ${sTasks.docs[0].id}`,
      timeout: 5000,
    });
  }
  answer.value = '';
};
load();

const skipTask = async () => {
  console.log('skipTask', task.value.id);
  await setDoc(
    doc(firestore, 'tasks', task.value.id),
    { isSkipedFlg: true },
    { merge: true }
  );
  $q.notify({
    type: 'warning',
    message: `La tarea ${task.value.id} ha omitido`,
    timeout: 5000,
  });
  await load();
};

const markAsKnowed = async () => {
  console.log('markAsKnowed', task.value.id, task.value.wordId);
  await setDoc(
    doc(firestore, 'tasks', task.value.id),
    { isSkipedFlg: true },
    { merge: true }
  );
  await setDoc(
    doc(firestore, 'words', task.value.wordId),
    { isLearnedFlg: true },
    { merge: true }
  );
  await load();
};

const validateAnswer = async () => {
  console.log('validateAnswer', answer.value);
  answerControl.value.focus();
};
</script>
