<template>
  <q-page v-if="ready">
    <div class="q-px-lg q-py-md">
      <q-timeline v-if="tasks.length > 0" color="secondary">
        <TaskTimelineEntries
          :tasks="today"
          label="Today"
          timeFormat="timeAgo"
        />
        <TaskTimelineEntries
          :tasks="yeasterday"
          label="Yeasterday"
          timeFormat="time"
        />
        <TaskTimelineEntries
          :tasks="previously"
          label="Previously"
          timeFormat="full"
        />
      </q-timeline>
      <div v-else>You do not worked!</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import TaskTimelineEntries from 'components/TaskTimelineEntries.vue';
import { useTasksStore } from 'src/stores/tasks';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { Task } from 'src/stores/models';

const tasksStore = useTasksStore();
const { tasks, ready } = storeToRefs(tasksStore);

const oneDay = 24 * 60 * 60 * 1000;
const toDate = (d: Date): Date => {
  const c = new Date(d.getTime());
  c.setHours(0);
  c.setMinutes(0);
  c.setSeconds(0);
  c.setMilliseconds(0);
  return c;
};

const today = computed(() => {
  const now = toDate(new Date());
  const res: Task[] = [];
  for (const t of tasks.value) {
    const tDate = toDate(t.createdTs);
    if (now.getTime() - tDate.getTime() == 0) {
      res.push(t);
    }
  }
  return res;
});
const yeasterday = computed(() => {
  const now = toDate(new Date());
  const res: Task[] = [];
  for (const t of tasks.value) {
    const tDate = toDate(t.createdTs);
    if (now.getTime() - tDate.getTime() == oneDay) {
      res.push(t);
    }
  }
  return res;
});
const previously = computed(() => {
  const now = toDate(new Date());
  const res: Task[] = [];
  for (const t of tasks.value) {
    const tDate = toDate(t.createdTs);
    if (now.getTime() - tDate.getTime() > oneDay) {
      res.push(t);
    }
  }
  return res;
});
</script>
