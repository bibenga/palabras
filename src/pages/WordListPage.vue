<template>
  <div class="q-pa-md">
    <q-table
      title="Tus palabras para estudiar"
      :rows="words"
      :columns="columns"
      v-model:pagination="pagination"
      row-key="id"
      selection="multiple"
      v-model:selected="selected"
    >
      <template v-slot:top>
        <q-space />
        <q-input debounce="300" color="primary">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>
      <template v-slot:bottom>
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
      </template>

      <template v-slot:header-selection="scope">
        <q-checkbox v-model="scope.selected" color="grey" />
      </template>

      <template v-slot:body="props">
        <q-tr :props="props" :click="() => rowClicked(props)">
          <q-td key="id">
            <q-checkbox v-model="props.selected" color="grey" />
          </q-td>
          <q-td key="word1" :props="props">
            {{ props.row.word1?.join(', ') }}
          </q-td>
          <q-td key="word2" :props="props">
            {{ props.row.word2?.join(', ') }}
          </q-td>
          <q-td key="createdTs" :props="props">
            {{ new Date(props.row.createdTs.seconds * 1000).toISOString() }}
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
  </div>
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
} from 'firebase/firestore';
import { useQuasar } from 'quasar';
import { computed, inject, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const router = useRouter();

const fireauth = inject<Auth>('fireauth');
const firestore = inject<Firestore>('firestore');
const { isAuthenticated, user } = useAuth(fireauth);
// const words = useFirestore(collection(firestore, 'words'));

const pagination = ref({
  sortBy: 'desc',
  descending: false,
  page: 1,
  rowsPerPage: 5,
  rowsNumber: 0,
});

// const wordsLimit = ref(10);
const wordsQuery = computed(() =>
  isAuthenticated.value
    ? query(
        collection(firestore, 'words'),
        where('userId', '==', user.value?.uid),
        orderBy('word1', 'asc')
        // orderBy('createdTs', 'asc')
        // startAt((pagination.value.page - 1) * pagination.value.rowsPerPage)
        // endAt(pagination.value.page * pagination.value.rowsPerPage)
        // limit(wordsLimit.value)
      )
    : undefined
);
const words = useFirestore(wordsQuery);
setTimeout(() => {
  console.log(words.value);
}, 2000);

const updateRowsNumber = async () => {
  if (isAuthenticated.value) {
    try {
      const countQuery = query(
        collection(firestore, 'words'),
        where('userId', '==', user.value?.uid)
      );
      const snapshot = await getCountFromServer(countQuery);
      //   console.log('count', snapshot);
      //   console.log('count', snapshot.data().count);
      pagination.value = {
        ...pagination.value,
        rowsNumber: snapshot.data().count,
      };
    } catch (error) {
      console.log('error', error);
    }
  } else {
    pagination.value = {
      ...pagination.value,
      rowsNumber: 0,
    };
  }
};
watch(isAuthenticated, updateRowsNumber);

// setTimeout(() => {
//   console.log(words.value);
//   getCountFromServer(wordsQuery.value)
//     .then((snapshot) => {
//       console.log('count', snapshot);
//       console.log('count', snapshot.data().count);
//     })
//     .catch((error) => {
//       console.log('error', error);
//     });
// }, 2000);

const selected = ref([]);

const columns = [
  { name: 'word1', required: true, label: 'Word1', align: 'left' },
  { name: 'word2', required: true, label: 'Word2', align: 'left' },
  { name: 'createdTs', required: true, label: 'Created', align: 'left' },
  {
    name: 'isLearnedFlg',
    required: true,
    label: 'Is Learned',
    align: 'center',
  },
  { name: 'actions', required: true, label: '', align: 'left' },
];
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
  });
};
</script>
