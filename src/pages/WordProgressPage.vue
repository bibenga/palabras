<template>
  <q-page v-if="ready">
    <div class="q-px-lg q-py-md">
      <q-timeline v-if="tasks != null" color="secondary">
        <TaskTimelineEntries
          :tasks="tasks.today"
          label="Today"
          timeFormat="timeAgo"
        />
        <TaskTimelineEntries
          :tasks="tasks.yeasterday"
          label="Yeasterday"
          timeFormat="time"
        />
        <TaskTimelineEntries
          :tasks="tasks.previously"
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

const tasksStore = useTasksStore();
const { tasks, ready } = storeToRefs(tasksStore);
</script>
