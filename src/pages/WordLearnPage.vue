<template>
  <q-page
    v-if="ready"
    :class="$q.screen.xs ? '' : 'row justify-center items-center'"
  >
    <q-card flat :bordered="!$q.screen.xs" class="learn-form">
      <q-card-section>
        <div class="text-h6">Ejercicio</div>
        <div class="text-overline">escribe una traducción</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <p v-if="task != null" style="min-height: 3em">
          <span>
            <span
              style="
                cursor: default;
                font-size: 1.5em;
                text-decoration-line: underline;
                text-decoration-style: dotted;
              "
            >
              {{ task.word1[0] }}
            </span>
            <q-tooltip :hide-delay="5000">
              {{ task.word2.join(', ') }}
            </q-tooltip>
          </span>
        </p>

        <div>
          <q-input
            ref="answerInput"
            v-model.trim="answer"
            style="font-size: 1.5em"
            @keydown.enter.prevent="validateAnswer"
            filled
            autogrow
            autofocus
            :readonly="task == null || answerIsValid"
            :error="answerIsValid !== undefined && !answerIsValid"
          />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions>
        <q-btn
          v-if="task != null && !answerIsValid"
          @click="() => validateAnswer()"
          label="Entregar"
          unelevated
          class="btn"
          color="primary"
        />
        <q-btn
          v-else
          @click="() => nextTask()"
          label="Siguiente"
          unelevated
          class="btn"
          color="positive"
        />
        <q-space v-if="!$q.screen.xs" />
        <q-btn
          v-if="task != null && !answerIsValid"
          @click="() => skipTask()"
          label="Saltar"
          unelevated
          class="btn"
          color="primary"
          outline
        />
        <q-btn
          v-if="task != null && !answerIsValid"
          @click="() => markAsLearned()"
          label="¡Lo sé!"
          unelevated
          class="btn"
          color="primary"
          outline
        />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<style>
.screen--xs .learn-form {
  width: 100%;
}

.learn-form {
  width: 800px;
}

.screen--xs .btn {
  width: 100%;
  margin-top: 8px;
  margin-left: 0px !important;
}
</style>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { ref } from 'vue';
import { useTasksStore } from 'src/stores/tasks';
import { storeToRefs } from 'pinia';

const $q = useQuasar();

const tasksStore = useTasksStore();
const { task, ready } = storeToRefs(tasksStore);

const answerInput = ref();
const answer = ref('');
const answerIsValid = ref<boolean>();

const newTask = async () => {
  const success = await tasksStore.newTask();
  console.debug('newTask', success);
  if (!success) {
    $q.notify({
      type: 'negative',
      message: "Can't create new task",
      timeout: 2000,
    });
  }
  answer.value = '';
  answerIsValid.value = undefined;
  answerInput.value.focus();
};

const skipTask = async () => {
  $q.loading.show();
  try {
    await newTask();
  } finally {
    $q.loading.hide();
  }
};

const markAsLearned = async () => {
  $q.dialog({
    title: 'Confirmation',
    message: 'Are you sure that you know this word?',
    cancel: true,
    focus: 'cancel',
  }).onOk(async () => {
    $q.loading.show();
    try {
      await tasksStore.markAsLearned();
      await newTask();
    } finally {
      $q.loading.hide();
    }
  });
};

const validateAnswer = async () => {
  const valid = await tasksStore.validateAnswer(answer.value);
  answerIsValid.value = valid;
  if (!valid) {
    answerInput.value.focus();
  }
};

const nextTask = async () => {
  $q.loading.show();
  try {
    await newTask();
  } finally {
    $q.loading.hide();
  }
};
</script>
