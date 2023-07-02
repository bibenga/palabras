import { defineStore } from 'pinia';
import { inject, ref } from 'vue';
import {
  Firestore,
  Unsubscribe,
  addDoc,
  and,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { useWordsStore } from './words';
import deburr from 'lodash/deburr';
import isEqual from 'lodash/isEqual';

export const useTasksStore = defineStore('tasks', () => {
  console.log('[tasks.setup]');

  const fireauth = inject<Auth>('fireauth');
  const firestore = inject<Firestore>('firestore');
  const tasksCol = collection(firestore, 'tasks');

  const wordStore = useWordsStore();

  const ready = ref(false);
  const task = ref();
  const tasks = ref([]);

  let user: User | null = null;
  let tasksUnsubscribe: Unsubscribe | null = null;

  const init = () => {
    console.debug('[tasks.init]', user?.uid);
    if (user == null) {
      task.value = null;
      tasks.value = [];
      return;
    }
    const tasksQuery = query(
      tasksCol,
      and(where('userId', '==', user.uid)),
      orderBy('createdTs', 'desc'),
      limit(20)
    );
    tasksUnsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      console.debug('[tasks.onSnapshot]', snapshot);
      if (!snapshot.empty) {
        const taskDoc = snapshot.docs[0];
        task.value = {
          id: taskDoc.id,
          createdTs: taskDoc.data().createdTs.toDate(),
          word1: taskDoc.data().word1,
          word2: taskDoc.data().word2,
          isDoneFlg: taskDoc.data().isDoneFlg,
          isSkipedFlg: taskDoc.data().isSkipedFlg,
        };
      } else {
        tasks.value = [];
        task.value = null;
      }
      ready.value = true;
    });
  };

  const cleanup = () => {
    console.debug('[tasks.cleanup]');
    if (tasksUnsubscribe != null) {
      tasksUnsubscribe();
      tasksUnsubscribe = null;
      tasks.value = [];
      task.value = null;
    }
  };

  const authUnsunscribe = onAuthStateChanged(fireauth, (authUser) => {
    user = authUser;
    console.debug('[tasks.onAuthStateChanged]', authUser?.uid);
    if (user) {
      init();
    } else {
      cleanup();
    }
  });

  const next = async (): Promise<void> => {
    const t = task.value;
    if (t != null) {
      if (!t.isSkipedFlg && !t.isDoneFlg) {
        await updateDoc(doc(tasksCol, task.value.id), {
          isSkipedFlg: true,
          updatedTs: new Date(),
        });
      }
    }

    const word = await wordStore.randomWord();
    if (word != null) {
      let word1, word2;
      if (Math.random() >= 0.5) {
        word1 = word.word1;
        word2 = word.word2;
      } else {
        word1 = word.word2;
        word2 = word.word1;
      }
      await addDoc(tasksCol, {
        userId: user?.uid,
        wordId: word.id,
        word1: word1,
        word2: word2,
        isDoneFlg: false,
        isSkipedFlg: false,
        createdTs: new Date(),
        updatedTs: new Date(),
      });
    }

    return;
  };

  const markAsLearned = async () => {
    const t = task.value;
    try {
      await updateDoc(doc(tasksCol, t.id), {
        isSkipedFlg: true,
        updatedTs: new Date(),
      });
    } catch (error) {
      console.error(error);
    }
    try {
      await wordStore.markWordAsLearned(t.wordId);
    } catch (error) {
      console.error(error);
    }
  };

  const splitRule = /[ \r\n¡!¿?.,:;'\"]+/;
  // const convert = (s: string) => s.toLowerCase().normalize('NFKD').split(splitRule);
  const convert = (s: string): string[] =>
    deburr(s.toLowerCase()).split(splitRule);
  const validate = async (answer: string): Promise<boolean> => {
    const t = task.value;

    const aAnswer = convert(answer);
    let valid = false;
    for (const word2 of t.word2) {
      const aWord2 = convert(word2);
      valid = isEqual(aAnswer, aWord2);
      console.debug(aAnswer, '===', aWord2, '->', valid);
      if (valid) {
        break;
      }
    }

    if (valid) {
      await updateDoc(doc(tasksCol, t.id), {
        isDoneFlg: true,
        updatedTs: new Date(),
      });
    }
    return valid;
  };

  return {
    ready,
    task,
    tasks,
    next,
    markAsLearned,
    validate,
  };
});
