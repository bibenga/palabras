<template>
  <q-page>
    <div class="q-px-lg q-py-md">
      <!-- <div v-if="!pending">
        <template v-if="tasks2.today">
          <h6>today</h6>
          <div v-for="task of tasks2.today" v-bind:key="task.id">
            <span>{{ task.id }}</span>
          </div>
        </template>

        <template v-if="tasks2.yeasterday">
          <h6>yeasterday</h6>
          <div v-for="task of tasks2.yeasterday" v-bind:key="task.id">
            <span>{{ task.id }}</span>
          </div>
        </template>

        <template v-if="tasks2.previously">
          <h6>previously</h6>
          <div v-for="task of tasks2.previously" v-bind:key="task.id">
            <span>{{ task.id }}</span>
          </div>
        </template>
      </div> -->
      <q-timeline v-if="!pending" color="secondary">
        <!-- <q-timeline-entry heading tag="h5">Learn progress</q-timeline-entry> -->

        <template v-if="tasks2.today">
          <q-timeline-entry heading tag="h6"> Today </q-timeline-entry>

          <q-timeline-entry
            v-for="task of tasks2.today"
            v-bind:key="task.id"
            :title="task.word1.join(', ')"
            :subtitle="formatTimeAgo(task.createdTs.toDate())"
            :icon="task.isDoneFlg ? 'done' : task.isSkipedFlg ? 'remove' : ''"
          />
        </template>

        <template v-if="tasks2.yeasterday">
          <q-timeline-entry heading tag="h6"> Yeasterday </q-timeline-entry>

          <q-timeline-entry
            v-for="task of tasks2.yeasterday"
            v-bind:key="task.id"
            :title="task.word1.join(', ')"
            :subtitle="formatTime(task.createdTs.toDate())"
            :icon="task.isDoneFlg ? 'done' : task.isSkipedFlg ? 'remove' : ''"
          />
        </template>

        <template v-if="tasks2.previously">
          <q-timeline-entry heading tag="h6"> Previously </q-timeline-entry>

          <q-timeline-entry
            v-for="task of tasks2.previously"
            v-bind:key="task.id"
            :title="task.word1.join(', ')"
            :subtitle="formatDatetime(task.createdTs.toDate())"
            :icon="task.isDoneFlg ? 'done' : task.isSkipedFlg ? 'remove' : ''"
          />
        </template>
      </q-timeline>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import {
  Firestore,
  and,
  collection,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { computed, inject } from 'vue';
import { useCollection, useCurrentUser } from 'vuefire';
import { formatTimeAgo } from '@vueuse/core';

const firestore = inject<Firestore>('firestore');
const user = useCurrentUser();

const cTasks = collection(firestore, 'tasks');
const qTasks = query(
  cTasks,
  and(where('userId', '==', user.value?.uid)),
  orderBy('createdTs', 'desc'),
  limit(20)
);
const { data: tasks, pending } = useCollection(qTasks);
const tasks2 = computed(() => {
  const cleanDate = (d: Date): Date => {
    var c = new Date(d.getTime());
    c.setHours(0);
    c.setMinutes(0);
    c.setSeconds(0);
    c.setMilliseconds(0);
    return c;
  };
  const oneDay = 24 * 60 * 60 * 1000;
  const now = cleanDate(new Date());
  const today = [];
  const yeasterday = [];
  const previously = [];
  if (!pending.value) {
    for (const task of tasks.value) {
      const tDate = cleanDate(task.createdTs.toDate());
      // console.log(tDate, tDate.getTime(), now.getTime() - tDate.getTime());
      // const timeAgo = formatTimeAgo(new Date(2021, 0, 1)) // string
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

const formatTime = (d: Date): string => {
  return `${d.getHours()}:${d.getMinutes()}`;
};

const formatDatetime = (d: Date): string => {
  return d.toLocaleString();
};

// const load = async () => {
//   const cTasks = collection(firestore, 'tasks');
//   const qTasks = query(
//     cTasks,
//     and(where('userId', '==', user.value?.uid)),
//     orderBy('createdTs', 'desc'),
//     limit(20)
//   );
//   const sTasks = await getDocs(qTasks);
//   console.debug('loaded', sTasks);
// };
// onMounted(() => {
//   load();
// });
</script>
