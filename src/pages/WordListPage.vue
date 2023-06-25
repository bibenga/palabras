<template>
  <q-layout view="hHh Lpr lFf">
    <q-table
      ref="tableRef"
      title="Tus palabras para estudiar"
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
    >
      <!-- <template v-slot:top>
        <q-space />
        <q-input debounce="300" color="primary">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template> -->

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
          @click="() => fakeAdd()"
          class="q-ml-sm"
          outline
          color="primary"
          label="Fake Add"
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
        <q-space />
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
        </q-input>
      </template>

      <!-- <template v-slot:body-cell-isLearnedFlg="props">
        <q-td :props="props">
          <q-checkbox v-model="props.row.isLearnedFlg" />
        </q-td>
      </template> -->

      <template v-slot:header-selection="scope">
        <q-checkbox v-model="scope.selected" color="grey" />
      </template>

      <template v-slot:body="props">
        <q-tr :props="props" :on-click="() => rowClicked(props)">
          <q-td key="check-id">
            <q-checkbox v-model="props.selected" color="grey" />
          </q-td>
          <q-td key="id" :props="props">
            {{ props.row.id }}
          </q-td>
          <q-td key="word1" :props="props">
            {{ props.row.word1?.join(', ') }}
          </q-td>
          <q-td key="word2" :props="props">
            {{ props.row.word2?.join(', ') }}
          </q-td>
          <q-td key="isLearnedFlg" :props="props">
            <q-checkbox v-model="props.row.isLearnedFlg" color="grey" disable />
          </q-td>
          <q-td key="actions" :props="props">
            <q-btn
              @click="() => edit(props.row)"
              flat
              round
              color="primary"
              icon="edit"
            />
          </q-td>
        </q-tr>
      </template>
    </q-table>

    <!-- <q-btn
      @click="() => fakeAdd()"
      class="q-ml-sm"
      outline
      color="primary"
      label="Fake Add"
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
    /> -->
  </q-layout>
</template>

<script setup lang="ts">
import { useAuth, useFirestore } from '@vueuse/firebase';
import { Auth } from 'firebase/auth';
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
import { inject, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const router = useRouter();

const fireauth = inject<Auth>('fireauth');
const firestore = inject<Firestore>('firestore');
const { isAuthenticated, user } = useAuth(fireauth);

const pagination = ref({
  sortBy: 'desc',
  descending: false,
  page: 1,
  rowsPerPage: 5,
  rowsNumber: 0,
});
const columns = [
  { name: 'id', required: true, label: 'ID', align: 'left' },
  { name: 'word1', required: true, label: 'Word1', align: 'left' },
  { name: 'word2', required: true, label: 'Word2', align: 'left' },
  {
    name: 'isLearnedFlg',
    required: true,
    label: 'Is Learned',
    align: 'center',
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
    `onRequest: isAuthenticated=${isAuthenticated.value}; user=${user.value?.uid}; ` +
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
  if (!isAuthenticated.value) {
    watch(isAuthenticated, () => {
      tableRef.value.requestServerInteraction();
    });
  } else {
    tableRef.value.requestServerInteraction();
  }
});

const fakeAdd = async () => {
  console.log('add');
  const word = {
    userId: user.value?.uid,
    createdTs: new Date(),
    word1: ['1'],
    word2: ['2'],
    isLearnedFlg: false,
  };
  console.log('try add', word);
  const aword = await addDoc(collection(firestore, 'words'), word);
  console.log('added', aword);
  $q.notify({
    message: `The document ${aword.id} was added`,
    timeout: 2000,
  });
  pagination.value.rowsNumber = 0;
  rowsSnapshot.value = null;
  tableRef.value.requestServerInteraction();
};

const add = async () => {
  router.push('/word/new');
};

const edit = (doc) => {
  console.log('edit', doc.id);
  router.push(`/word/${doc.id}`);
};

const rowClicked = async (row) => {
  console.log('rowClicked', row);
};

const del = async () => {
  const docs = selected.value;
  $q.dialog({
    title: 'Confirmation',
    message: `Do yo want delete selected ${docs.length} word/words?`,
    cancel: true,
    focus: 'cancel',
  }).onOk(async () => {
    for (const d of docs) {
      console.log('del doc', d);
      await deleteDoc(doc(firestore, 'words', d.id));
      $q.notify({
        message: `The document ${d.id} was deleted`,
        timeout: 2000,
      });
    }
    selected.value = [];
    pagination.value.rowsNumber = 0;
    rowsSnapshot.value = null;
    tableRef.value.requestServerInteraction();
  });
};
</script>
