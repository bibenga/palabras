<template>
  <q-page>
    <q-table
      ref="tableRef"
      title="Tus palabras para estudiar"
      :grid="$q.platform.is.mobile"
      :rows="rows"
      :columns="columns"
      row-key="id"
      selection="multiple"
      v-model:selected="selected"
      v-model:pagination="pagination"
      :loading="loading"
      :filter="filter"
      binary-state-sort
      @request="onRequest"
      @row-click="(evt, row, index) => rowClicked(row)"
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
          class="q-ml-sm"
          outline
          color="primary"
          label="Add demo data"
          icon="add"
        />
        <q-btn
          @click="() => add()"
          class="q-ml-sm"
          color="primary"
          label="Add"
          icon="add"
        />
        <q-btn
          v-if="selected.length > 0"
          @click="() => del()"
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

<script setup lang="ts">
import { query } from 'firebase/database';
import {
  Firestore,
  collection,
  orderBy,
  where,
  getCountFromServer,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  startAt,
  limit,
  startAfter,
  limitToLast,
  endBefore,
} from 'firebase/firestore';
import { useQuasar } from 'quasar';
import { inject, onMounted, ref } from 'vue';
import { useCurrentUser } from 'vuefire';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const router = useRouter();
const firestore = inject<Firestore>('firestore');

const user = useCurrentUser();

const pagination = ref({
  sortBy: 'desc',
  descending: false,
  page: 1,
  rowsPerPage: 5,
  rowsNumber: 0,
});
const columns = [
  // { name: 'id', required: true, label: 'ID', align: 'left' },
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
  { name: 'actions', required: true, label: '', align: 'left' },
];

const tableRef = ref();
const selected = ref([]);
const loading = ref(false);
const filter = ref('');
const rows = ref([]);
const rowsSnapshot = ref();

const onRequest = async (props) => {
  var { page, rowsPerPage, sortBy, descending } = props.pagination;
  const filter = props.filter;

  console.log(
    `onRequest: user=${user.value?.uid}; ` +
      `page=${page}; rowsPerPage=${rowsPerPage}; sortBy=${sortBy}; descending=${descending}; filter=${filter}; `
  );

  loading.value = true;

  try {
    console.log('rowsSnapshot', rowsSnapshot.value);

    const c = collection(firestore, 'words');
    // limitToLast(docsLimit), endBefore(snapshot.docs[0])]
    if (rowsPerPage != pagination.value.rowsPerPage) {
      rowsSnapshot.value = null;
    }
    var que = [];
    if (rowsSnapshot.value == null) {
      // first request
      page = 1;
      que.push(limit(rowsPerPage));
    } else {
      // pagination
      if (page == pagination.value.page) {
        // refresh
        que.push(startAt(rowsSnapshot.value.docs[0]));
        que.push(limit(rowsPerPage));
      } else if (page >= pagination.value.page) {
        // next page
        que.push(
          startAfter(rowsSnapshot.value.docs[rowsSnapshot.value.size - 1])
        );
        que.push(limit(rowsPerPage));
      } else {
        // prev page
        que.push(endBefore(rowsSnapshot.value.docs[0]));
        que.push(limitToLast(rowsPerPage));
      }
    }
    const q = query(
      c,
      where('userId', '==', user.value?.uid),
      orderBy('word1', 'asc'),
      ...que
    );
    const s = await getDocs(q);
    console.log('snapshot', s.size, s);
    rowsSnapshot.value = s;
    rows.value = s.docs.map((i) => {
      return {
        ...i.data(),
        id: i.id,
      };
    });
    console.log('rows', rows.value);

    pagination.value.page = page;
    pagination.value.rowsPerPage = rowsPerPage;
    pagination.value.sortBy = sortBy;
    pagination.value.descending = descending;

    if (pagination.value.rowsNumber <= 0) {
      const qCount = query(c, where('userId', '==', user.value?.uid));
      const sCount = await getCountFromServer(qCount);
      pagination.value.rowsNumber = sCount.data().count;
      console.log('loaded count', pagination.value.rowsNumber);
    } else {
      console.log('cached count', pagination.value.rowsNumber);
    }
  } catch (error) {
    console.log('error', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  tableRef.value.requestServerInteraction();
});

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
      $q.loadingBar.increment(1);
    }
    $q.notify({
      message: `Was added ${demoPairs.length} word pair`,
      timeout: 2000,
    });
    pagination.value.rowsNumber = 0;
    rowsSnapshot.value = null;
    tableRef.value.requestServerInteraction();
  } finally {
    $q.loading.hide();
  }
};

const add = async () => {
  router.push('/word/new');
};

const edit = (doc) => {
  console.log('edit', doc.id);
  router.push(`/word/${doc.id}`);
};

const rowClicked = async (row) => {
  console.log('rowClicked', row.id);
  router.push(`/word/${row.id}`);
};

const del = async () => {
  const docs = selected.value;
  $q.dialog({
    title: 'Confirmation',
    message: `Do yo want delete selected ${docs.length} word/words?`,
    cancel: true,
    focus: 'cancel',
  }).onOk(async () => {
    $q.loading.show();
    try {
      const docsLength = docs.length;
      for (const d of docs) {
        console.log('del doc', d);
        await deleteDoc(doc(firestore, 'words', d.id));
        if (docsLength < 5) {
          $q.notify({
            message: `The document ${d.id} was deleted`,
            timeout: 2000,
          });
        }
      }
      if (docsLength >= 5) {
        $q.notify({
          message: `Deleted ${docsLength} documents`,
          timeout: 2000,
        });
      }

      selected.value = [];
      pagination.value.rowsNumber = 0;
      rowsSnapshot.value = null;
      tableRef.value.requestServerInteraction();
    } finally {
      $q.loading.hide();
    }
  });
};
</script>
