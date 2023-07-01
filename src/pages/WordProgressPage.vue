<template>
  <q-page>
    <div class="q-px-lg q-py-md">
      <div v-if="!loading && tasks.empty">You do not worked!</div>
      <q-timeline v-if="!loading && !tasks.empty" color="secondary">
        <template v-if="tasks.today.length > 0">
          <q-timeline-entry heading tag="h6"> Today </q-timeline-entry>
          <q-timeline-entry
            v-for="task of tasks.today"
            v-bind:key="task.id"
            :title="task.word1.join(', ')"
            :subtitle="formatTimeAgo(task.createdTs)"
            :icon="task.isDoneFlg ? 'done' : task.isSkipedFlg ? 'remove' : ''"
          />
        </template>

        <template v-if="tasks.yeasterday.length > 0">
          <q-timeline-entry heading tag="h6"> Yeasterday </q-timeline-entry>
          <q-timeline-entry
            v-for="task of tasks.yeasterday"
            v-bind:key="task.id"
            :title="task.word1.join(', ')"
            :subtitle="formatDate(task.createdTs, 'H:mm')"
            :icon="task.isDoneFlg ? 'done' : task.isSkipedFlg ? 'remove' : ''"
          />
        </template>

        <template v-if="tasks.previously.length > 0">
          <q-timeline-entry heading tag="h6"> Previously </q-timeline-entry>
          <q-timeline-entry
            v-for="task of tasks.previously"
            v-bind:key="task.id"
            :title="task.word1.join(', ')"
            :subtitle="formatDate(task.createdTs, 'D MMMM H:mm')"
            :icon="task.isDoneFlg ? 'done' : task.isSkipedFlg ? 'remove' : ''"
          />
        </template>
      </q-timeline>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import {
  and,
  collection,
  limit,
  orderBy,
  query,
  where,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import { inject, onUnmounted, ref } from 'vue';
import { useCurrentUser } from 'vuefire';
import { formatTimeAgo, formatDate } from '@vueuse/core';

const user = useCurrentUser();
const firestore = inject<Firestore>('firestore');
const tasksCol = collection(firestore, 'tasks');
const tasksQuery = query(
  tasksCol,
  and(where('userId', '==', user.value?.uid)),
  orderBy('createdTs', 'desc'),
  limit(20)
);
const loading = ref(true);
const tasks = ref({
  empty: true,
  today: [],
  yeasterday: [],
  previously: [],
});

const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
  const toDate = (d: Date): Date => {
    var c = new Date(d.getTime());
    c.setHours(0);
    c.setMinutes(0);
    c.setSeconds(0);
    c.setMilliseconds(0);
    return c;
  };
  const oneDay = 24 * 60 * 60 * 1000;
  const now = toDate(new Date());
  const today = [];
  const yeasterday = [];
  const previously = [];
  for (const taskDoc of snapshot.docs) {
    const task = {
      createdTs: taskDoc.data().createdTs.toDate(),
      word1: taskDoc.data().word1,
      word2: taskDoc.data().word2,
      isDoneFlg: taskDoc.data().isDoneFlg,
      isSkipedFlg: taskDoc.data().isSkipedFlg,
    };
    const tDate = toDate(task.createdTs);
    if (now.getTime() - tDate.getTime() == 0) {
      today.push(task);
    } else if (now.getTime() - tDate.getTime() == oneDay) {
      yeasterday.push(task);
    } else {
      previously.push(task);
    }
  }
  tasks.value = { empty: snapshot.empty, today, yeasterday, previously };
  loading.value = false;
});
onUnmounted(() => unsubscribe());
</script>
