<template>
  <q-page v-if="ready">
    <q-table
      ref="tableRef"
      title="Tus palabras para estudiar"
      :grid="$q.screen.xs"
      :rows="wordsFiltered"
      :columns="columns"
      row-key="id"
      selection="multiple"
      v-model:selected="selected"
      virtual-scroll
      v-model:pagination="pagination"
      :rows-per-page-options="[0]"
      :loading="!ready"
      binary-state-sort
      @row-click="(evt, row, index) => rowClicked(row)"
      card-class="no-shadow"
      card-style="border: 1px"
    >
      <!-- <template v-slot:top-right>
        <q-input
          borderless
          dense
          debounce="300"
          v-model="filter"
          placeholder="Search"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template> -->

      <template v-slot:top>
        <q-btn
          @click="() => loadDemoData()"
          v-if="ready && words.length == 0"
          unelevated
          outline
          class="q-ml-sm btn"
          color="primary"
          label="Add demo data"
          icon="add"
        />
        <q-btn
          @click="() => add()"
          v-if="ready && words.length < 1000"
          unelevated
          class="q-ml-sm btn"
          color="primary"
          label="Add"
          icon="add"
        />
        <q-btn
          v-if="selected.length > 0"
          @click="() => del()"
          unelevated
          class="q-ml-sm btn"
          icon="delete"
          color="negative"
          label="Delete selected"
        />
        <q-space v-if="!$q.screen.xs" />
        <q-input
          dense
          debounce="500"
          color="primary"
          v-model="filter"
          :style="$q.screen.xs ? 'width: 100%' : ''"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>

      <template v-slot:body-cell-isLearnedFlg="props">
        <q-td :props="props">
          <q-icon v-if="props.row.isLearnedFlg" name="done" size="1.5em" />
        </q-td>
      </template>

      <template v-slot:item="props">
        <div
          class="q-pa-xs col-xs-12 col-sm-6 col-md-4"
          style="overflow: hidden"
        >
          <q-card flat bordered>
            <q-card-section horizontal class="col-2">
              <q-card-section>
                <q-checkbox v-model="props.selected" :label="props.row.name" />
              </q-card-section>
              <q-card-section
                class="col-8 cursor-pointer q-hoverable"
                @click="rowClicked(props.row)"
              >
                <div class="row">
                  <div class="col-4 text-overline">Word1</div>
                  <div class="col-8 text-overline">
                    {{ props.row.word1.join(', ') }}
                  </div>
                </div>
                <div class="row">
                  <div class="col-4 text-overline">Word2</div>
                  <div class="col-8 text-overline">
                    {{ props.row.word2.join(', ') }}
                  </div>
                </div>
              </q-card-section>
              <q-card-section
                class="col-2 cursor-pointer q-hoverable"
                @click="rowClicked(props.row)"
              >
                <div
                  v-if="props.row.isLearnedFlg"
                  class="text-overline float-right"
                >
                  learned
                </div>
                <q-icon
                  v-if="props.row.isLearnedFlg"
                  name="done"
                  size="1.5em"
                />
              </q-card-section>
            </q-card-section>
          </q-card>
        </div>
      </template>
    </q-table>

    <!-- <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn
        @click="() => add()"
        v-if="!loading && words.length < 100"
        fab
        icon="add"
        color="primary"
      />
    </q-page-sticky> -->
  </q-page>
</template>

<style>
.screen--xs .btn {
  width: 100%;
  margin-top: 8px;
  margin-left: 0px !important;
}
</style>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useWordsStore } from 'src/stores/words';
import { storeToRefs } from 'pinia';
import { Word } from 'src/stores/models';
import deburr from 'lodash/deburr';

const $q = useQuasar();
const router = useRouter();

const wordsStore = useWordsStore();
const { words, ready } = storeToRefs(wordsStore);

const pagination = ref({
  rowsPerPage: 0,
});
const selected = ref([] as Word[]);

const filter = ref('');
const wordsFiltered = computed<Word[]>(() => {
  console.log('filter', filter.value);
  if (filter.value == '') {
    return words.value;
  }

  const convert = (s: string): string => deburr(s.toLowerCase());
  const filterValue = convert(filter.value);
  const match = (items: string[]): boolean => {
    for (const itemRaw of items) {
      const item = convert(itemRaw);
      if (item.indexOf(filterValue) >= 0) {
        return true;
      }
    }
    return false;
  };
  const res = [] as Word[];
  for (const pair of words.value) {
    if (match(pair.word1) || match(pair.word2)) {
      res.push(pair);
    }
  }
  return res;
});

const columns = [
  {
    name: 'word1',
    required: true,
    label: 'Word1',
    align: 'left',
    field: (row) => row.word1,
    format: (val) => val?.join(', '),
  },
  {
    name: 'word2',
    required: true,
    label: 'Word2',
    align: 'left',
    field: (row) => row.word2,
    format: (val) => val?.join(', '),
  },
  {
    name: 'isLearnedFlg',
    required: true,
    label: 'Is Learned',
    align: 'center',
    field: (row) => row.isLearnedFlg,
    format: (val) => (val ? 'yes' : 'no'),
  },
];

const loadDemoData = async () => {
  console.log('fakeAdd');

  $q.loading.show();
  try {
    const loaded = await wordsStore.loadDemoWords();
    $q.notify({
      message: `Was added ${loaded} word pair`,
      timeout: 2000,
    });
  } finally {
    $q.loading.hide();
  }
};

const add = async () => {
  router.push('/word/new');
};

// const edit = (doc) => {
//   console.log('edit', doc.id);
//   router.push(`/word/${doc.id}`);
// };

const rowClicked = async (row) => {
  console.log('rowClicked', row.id);
  router.push(`/word/${row.id}`);
};

const del = async () => {
  const docs = selected.value;
  $q.dialog({
    title: 'Confirmation',
    message: `Do yo want to delete selected ${docs.length} word/words?`,
    cancel: true,
    focus: 'cancel',
  }).onOk(async () => {
    $q.loading.show();
    try {
      await wordsStore.deleteWords(docs.map((d) => d.id));
      selected.value = [];
      $q.notify({
        message: `Deleted ${docs.length} documents`,
        timeout: 2000,
      });
    } finally {
      $q.loading.hide();
    }
  });
};
</script>
