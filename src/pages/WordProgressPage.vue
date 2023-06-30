<template>
  <q-page>
    <div class="q-px-lg q-py-md">
      <div v-if="!pending && tasks.length == 0">You do not worked!</div>
      <q-timeline v-if="!pending && tasks.length > 0" color="secondary">
        <template v-if="tasksByDate.today.length > 0">
          <q-timeline-entry heading tag="h6"> Today </q-timeline-entry>
          <q-timeline-entry
            v-for="task of tasksByDate.today"
            v-bind:key="task.id"
            :title="task.word1.join(', ')"
            :subtitle="formatTimeAgo(task.createdTs.toDate())"
            :icon="task.isDoneFlg ? 'done' : task.isSkipedFlg ? 'remove' : ''"
          />
        </template>

        <template v-if="tasksByDate.yeasterday.length > 0">
          <q-timeline-entry heading tag="h6"> Yeasterday </q-timeline-entry>
          <q-timeline-entry
            v-for="task of tasksByDate.yeasterday"
            v-bind:key="task.id"
            :title="task.word1.join(', ')"
            :subtitle="formatDate(task.createdTs.toDate(), 'H:mm')"
            :icon="task.isDoneFlg ? 'done' : task.isSkipedFlg ? 'remove' : ''"
          />
        </template>

        <template v-if="tasksByDate.previously.length > 0">
          <q-timeline-entry heading tag="h6"> Previously </q-timeline-entry>
          <q-timeline-entry
            v-for="task of tasksByDate.previously"
            v-bind:key="task.id"
            :title="task.word1.join(', ')"
            :subtitle="formatDate(task.createdTs.toDate(), 'D MMMM H:mm')"
            :icon="task.isDoneFlg ? 'done' : task.isSkipedFlg ? 'remove' : ''"
          />
        </template>
      </q-timeline>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import {
  DocumentData,
  and,
  collection,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { computed } from 'vue';
import { useCollection, useCurrentUser, useFirestore } from 'vuefire';
import { formatTimeAgo, formatDate } from '@vueuse/core';

const user = useCurrentUser();

const firestore = useFirestore();
const cTasks = collection(firestore, 'tasks');
const qTasks = query(
  cTasks,
  and(where('userId', '==', user.value?.uid)),
  orderBy('createdTs', 'desc'),
  limit(20)
);
const { data: tasks, pending } = useCollection(qTasks);
const tasksByDate = computed(() => {
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
  const today = [] as DocumentData[];
  const yeasterday = [] as DocumentData[];
  const previously = [] as DocumentData[];
  if (!pending.value && tasks.value) {
    for (const task of tasks.value) {
      const tDate = toDate(task.createdTs.toDate());
      if (now.getTime() - tDate.getTime() == 0) {
        today.push(task);
      } else if (now.getTime() - tDate.getTime() == oneDay) {
        yeasterday.push(task);
      } else {
        previously.push(task);
      }
    }
  }
  return { today, yeasterday, previously };
});
</script>
