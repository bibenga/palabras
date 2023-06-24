<template>
  <q-btn stretch flat :icon="icon" @click="$emit('act')">
    <q-tooltip class="bg-accent">{{ tooltip }}</q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
interface Props {
  tooltip: string;
  icon: string;
}
defineProps<Props>();
</script>
