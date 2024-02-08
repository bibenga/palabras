<template>
  <q-page v-if="ready">
    <q-table
      title="Tus palabras para estudiar"
      :rows="wordsFiltered"
      :columns="columns"
      class="words-tbl"
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
          @click="() => loadDemoWords('es-ru')"
          v-if="ready && words.length == 0"
          unelevated
          outline
          class="q-ml-sm btn"
          color="primary"
          label="Add ES/RU demo pairs"
          icon="add"
        />
        <q-btn
          @click="() => loadDemoWords('es-en')"
          v-if="ready && words.length == 0"
          unelevated
          outline
          class="q-ml-sm btn"
          color="primary"
          label="Add ES/EN demo pairs"
          icon="add"
        />
        <q-btn
          @click="() => loadDemoWords('en-ru')"
          v-if="ready && words.length == 0"
          unelevated
          outline
          class="q-ml-sm btn"
          color="primary"
          label="Add EN/RU demo pairs"
          icon="add"
        />

        <q-btn
          @click="() => add()"
          v-if="ready && words.length < 1000 && selected.length === 0"
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
          :label="`Delete ${selected.length} selected`"
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

      <!-- <template v-slot:item="props">
        <div
          class="q-pa-xs col-xs-12 col-sm-6 col-md-4"
          style="overflow: hidden"
        >
          <q-card flat bordered>
            <q-card-section horizontal class="col-2">
              <q-card-section class="q-pa-xs">
                <q-checkbox v-model="props.selected" :label="props.row.name" />
              </q-card-section>
              <q-card-section
                class="q-pa-xs col-10 cursor-pointer q-hoverable"
                @click="rowClicked(props.row)"
              >
                <div class="row">
                  <div class="col-11">
                    {{ props.row.word1.join(', ') }} <br />
                    {{ props.row.word2.join(', ') }}
                  </div>
                  <div class="col-1">
                    <q-icon
                      v-if="props.row.isLearnedFlg"
                      name="done"
                      size="1.5em"
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card-section>
          </q-card>
        </div>
      </template> -->
    </q-table>

    <!-- <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn
        @click="() => add()"
        v-if="ready && words.length < 1000"
        fab
        icon="add"
        color="primary"
      />
    </q-page-sticky> -->
  </q-page>
</template>

<style scoped>
.screen--xs .btn {
  width: 100%;
  margin-top: 8px;
  margin-left: 0px !important;
}

.screen--xs .words-tbl {
  height: calc(100vh - 100px);
}

.words-tbl {
  height: calc(100vh - 50px);
}

.words-tbl :deep(table) {
  width: 100%;
  /* table-layout: fixed; */
}

.words-tbl :deep(thead tr th) {
  position: sticky;
  z-index: 1;
}

.words-tbl :deep(thead tr:first-child th) {
  background-color: #ffffff;
  top: 0;
}

.body--dark .words-tbl :deep(thead tr:first-child th) {
  background-color: var(--q-dark);
}

/* padding: top and bottom | left and right */
.words-tbl :deep(td) {
  padding: 7px 7px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  /* color: deeppink; */
}

.words-tbl :deep(th) {
  padding: 7px 7px;
}

.words-tbl :deep(td:nth-child(2)) {
  width: 50%;
  /* background-color: pink; */
}

.words-tbl :deep(td:nth-child(3)) {
  width: 50%;
  /* background-color: blueviolet; */
}

.words-tbl :deep(td:nth-child(4)) {
  width: 0%;
  /* background-color: green; */
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

const pagination = ref({ rowsPerPage: 0 });
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
    // style: 'width: 50%; max-width: 50%;',
  },
  {
    name: 'word2',
    required: true,
    label: 'Word2',
    align: 'left',
    field: (row) => row.word2,
    format: (val) => val?.join(', '),
    // style: 'width: 50%; max-width: 50%;',
  },
  {
    name: 'isLearnedFlg',
    required: true,
    label: 'Learned',
    align: 'center',
    field: (row) => row.isLearnedFlg,
    format: (val) => (val ? 'yes' : 'no'),
    // style: 'width: 0px',
  },
];

const loadDemoWords = async (code: string) => {
  console.log(`loadDemoWords: ${code}`);
  $q.loading.show();
  try {
    const loaded = await wordsStore.loadDemoWords(code);
    $q.notify({
      message: `Was added ${loaded} word pair`,
      timeout: 2000,
    });
  } finally {
    $q.loading.hide();
  }
};

const add = () => {
  router.push('/word/new');
};

// const edit = (doc) => {
//   console.log('edit', doc.id);
//   router.push(`/word/${doc.id}`);
// };

const rowClicked = (row) => {
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
