<template>
  <q-page v-if="!pending">
    <div class="q-px-lg q-py-md">
      <q-timeline v-if="tasks" color="secondary">
        <TaskTimelineEntries :tasks="today" label="Today" timeFormat="timeAgo" />
        <TaskTimelineEntries :tasks="yeasterday" label="Yeasterday" timeFormat="time" />
        <TaskTimelineEntries :tasks="previously" label="Previously" timeFormat="full" />
      </q-timeline>
      <div v-else>You do not worked!</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import TaskTimelineEntries from 'components/TaskTimelineEntries.vue';
import { computed } from 'vue';
import { Task } from 'src/stores/models';
import { firestoreDefaultConverter, useCollection, useCurrentUser, useFirestore } from 'vuefire';
import { DocumentData, collection, limit, orderBy, query, where } from 'firebase/firestore';

const firestore = useFirestore()!;
const user = useCurrentUser();
const tasksCol = collection(firestore, 'tasks');
const { data: tasks, pending } = useCollection<Task>(() => {
  if (user.value) {
    return query(
      tasksCol,
      where('userId', '==', user.value.uid),
      orderBy('createdTs', 'desc'),
      limit(100),
    ).withConverter<Task, DocumentData>({
      fromFirestore: (snapshot) => {
        const v = firestoreDefaultConverter.fromFirestore(snapshot)!;
        return {
          id: v.id,
          userId: v.userId,
          createdTs: v.createdTs.toDate(),
          updatedTs: v.updatedTs?.toDate() || v.createdTs.toDate(),

          isDoneFlg: v.isDoneFlg,
          isSkipedFlg: v.isSkipedFlg,
          errorCount: v.errorCount,

          type: v.type,
          words: v.words,
        } as Task;
      },
      toFirestore: firestoreDefaultConverter.toFirestore,
    });
  }
  return null;
});

const oneDay = 24 * 60 * 60 * 1000;
const toDate = (d: Date): Date => {
  const c = new Date(d.getTime());
  c.setHours(0);
  c.setMinutes(0);
  c.setSeconds(0);
  c.setMilliseconds(0);
  return c;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const today = computed(() => {
  if (tasks.value) {
    const now = toDate(new Date());
    return tasks.value.filter((t) => {
      const tDate = toDate(t.createdTs);
      return now.getTime() - tDate.getTime() == 0;
    });
  }
  return null;
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const yeasterday = computed(() => {
  if (tasks.value) {
    const now = toDate(new Date());
    return tasks.value.filter((t) => {
      const tDate = toDate(t.createdTs);
      return now.getTime() - tDate.getTime() == oneDay;
    });
  }
  return null;
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const previously = computed(() => {
  if (tasks.value) {
    const now = toDate(new Date());
    return tasks.value.filter((t) => {
      const tDate = toDate(t.createdTs);
      return now.getTime() - tDate.getTime() > oneDay;
    });
  }
  return null;
});
</script>
