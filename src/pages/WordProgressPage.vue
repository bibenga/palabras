<template>
  <q-page v-if="ready">
    <div class="q-px-lg q-py-md">
      <q-timeline v-if="tasks != null" color="secondary">
        <template v-if="tasks.today.length > 0">
          <q-timeline-entry heading tag="h6"> Today </q-timeline-entry>
          <q-timeline-entry
            v-for="task of tasks.today"
            v-bind:key="task.id"
            :title="task.word1.join(', ')"
            :subtitle="formatTimeAgo(task.createdTs)"
            color="primary"
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
            color="primary"
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
            color="primary"
            :icon="task.isDoneFlg ? 'done' : task.isSkipedFlg ? 'remove' : ''"
          />
        </template>
      </q-timeline>
      <div v-else>You do not worked!</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { formatTimeAgo, formatDate } from '@vueuse/core';
import { useTasksStore } from 'src/stores/tasks';
import { storeToRefs } from 'pinia';

const tasksStore = useTasksStore();
const { tasks, ready } = storeToRefs(tasksStore);
</script>
