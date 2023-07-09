<template>
  <template v-if="tasks.length > 0">
    <q-timeline-entry heading tag="h6">{{ label }}</q-timeline-entry>
    <TaskTimelineEntry
      v-for="task of tasks"
      v-bind:key="task.id"
      :task="task"
      :timeFormat="timeFormat"
    />
  </template>
</template>

<script setup lang="ts">
import TaskTimelineEntry from 'components/TaskTimelineEntry.vue';
import { Task } from 'src/stores/models';

interface Props {
  label: string;
  tasks: Task[];
  timeFormat: 'timeAgo' | 'time' | 'full';
}
defineProps<Props>();
</script>
