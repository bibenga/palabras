<template>
  <q-page>
    <q-table
      ref="tableRef"
      title="Tus palabras para estudiar"
      :grid="$q.platform.is.mobile"
      :rows="words"
      :columns="columns"
      row-key="id"
      selection="multiple"
      v-model:selected="selected"
      virtual-scroll
      v-model:pagination="pagination"
      :rows-per-page-options="[0]"
      :loading="loading"
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
          v-if="!loading && words.length == 0"
          unelevated
          outline
          class="q-ml-sm btn"
          color="primary"
          label="Add demo data"
          icon="add"
        />
        <q-btn
          @click="() => add()"
          v-if="!loading && words.length < 100"
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
          class="q-ml-sm"
          icon="delete"
          color="negative"
          label="Delete selected"
        />
        <!-- <q-space />
        <q-input
          borderless
          dense
          debounce="300"
          color="primary"
          v-model="filter"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input> -->
      </template>

      <template v-slot:body-cell-isLearnedFlg="props">
        <q-td :props="props">
          <q-icon
            :name="
              props.row.isLearnedFlg ? 'check_box' : 'check_box_outline_blank'
            "
            size="1.5em"
          />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<style>
.mobile .btn {
  width: 100%;
  margin-top: 8px;
  margin-left: 0px !important;
}
</style>

<script setup lang="ts">
import {
  collection,
  orderBy,
  where,
  doc,
  addDoc,
  deleteDoc,
  query,
  DocumentData,
} from 'firebase/firestore';
import { useQuasar } from 'quasar';
import { computed, ref } from 'vue';
import { useCollection, useCurrentUser, useFirestore } from 'vuefire';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const router = useRouter();

const user = useCurrentUser();
const firestore = useFirestore();

const pagination = ref({
  rowsPerPage: 0,
});
const wordsDynamicQuery = computed(() => {
  return query(
    collection(firestore, 'words'),
    where('userId', '==', user.value?.uid),
    orderBy('word1', 'asc')
  );
});
const { data: words, pending: loading } = useCollection(wordsDynamicQuery, {
  ssrKey: 'wordsList',
});
const selected = ref<DocumentData[]>([]);

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
    const demoPairs = [
      [['decir'], ['сказать', 'говорить']],
      [
        ['empezar', 'comenzar'],
        ['начать', 'начинать'],
      ],
      [['dar'], ['давать']],
      [['volver'], ['возвращаться']],
      [['abrir'], ['открывать']],
      [['cerrar'], ['закрыть']],
      [['contar'], ['считать']],
      [['encontrar'], ['находить']],
      [['contestar'], ['отвечать']],
      [['Nadie'], ['Ни кто']],
      [['Nada'], ['Ни что', 'Ничего']],
    ];
    for (const pair of demoPairs) {
      const word = {
        userId: user.value?.uid,
        createdTs: new Date(),
        word1: pair[0].map((v) => v.toLowerCase()),
        word2: pair[1].map((v) => v.toLowerCase()),
        isLearnedFlg: false,
        random: Math.random(),
      };
      const aword = await addDoc(collection(firestore, 'words'), word);
      console.log('added', word, aword);
    }
    $q.notify({
      message: `Was added ${demoPairs.length} word pair`,
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
      const docsLength = docs.length;
      for (const d of docs) {
        console.log('del doc', d);
        await deleteDoc(doc(firestore, 'words', d.id));
      }
      selected.value = [];
      $q.notify({
        message: `Deleted ${docsLength} documents`,
        timeout: 2000,
      });
    } finally {
      $q.loading.hide();
    }
  });
};
</script>
