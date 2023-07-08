<template>
  <q-timeline-entry
    v-bind:key="task.id"
    :subtitle="timeStr"
    color="primary"
    :icon="iconName"
  >
    <template v-slot:title>
      <span
        style="text-decoration-line: underline; text-decoration-style: dotted"
      >
        {{ task.word1.join(', ') }}
        <q-tooltip :hide-delay="$q.screen.xs ? 5000 : 0">
          {{ task.word2.join(', ') }}
        </q-tooltip>
      </span>
    </template>
  </q-timeline-entry>
</template>

<script setup lang="ts">
import { Task } from 'src/stores/models';
import { formatTimeAgo, formatDate } from '@vueuse/core';
import { computed } from 'vue';

interface Props {
  task: Task;
  timeFormat: 'timeAgo' | 'time' | 'full';
}
const props = defineProps<Props>();

const iconName = computed(() => {
  const task = props.task;
  if (task.isDoneFlg) {
    return 'done';
  }
  if (task.isSkipedFlg) {
    return 'remove';
  }
  return 'question_mark';
});

const timeStr = computed(() => {
  const timeFormat = props.timeFormat;
  const task = props.task;

  if (timeFormat === 'time') {
    return formatDate(task.createdTs, 'H:mm');
  }
  if (timeFormat === 'timeAgo') {
    return formatTimeAgo(task.createdTs);
  }
  return formatDate(task.createdTs, 'D MMMM H:mm');
});
</script>
