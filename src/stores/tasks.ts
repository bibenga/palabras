import { defineStore } from 'pinia';
import { inject, ref } from 'vue';
import {
  DocumentData,
  Firestore,
  QueryDocumentSnapshot,
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
import { Task, TaskProgress } from './models';

export const useTasksStore = defineStore('tasks', () => {
  console.log('[tasks.setup]');

  const fireauth = inject<Auth>('fireauth');
  const firestore = inject<Firestore>('firestore');
  const tasksCol = collection(firestore, 'tasks');

  const wordStore = useWordsStore();

  const ready = ref(false);
  const task = ref<Task | null>(null);
  const tasks = ref<TaskProgress | null>(null);

  let user: User | null = null;
  let tasksUnsubscribe: Unsubscribe | null = null;

  const oneDay = 24 * 60 * 60 * 1000;
  const toDate = (d: Date): Date => {
    const c = new Date(d.getTime());
    c.setHours(0);
    c.setMinutes(0);
    c.setSeconds(0);
    c.setMilliseconds(0);
    return c;
  };
  const deserialize = (d: QueryDocumentSnapshot<DocumentData>): Task => {
    return {
      id: d.id,
      userId: d.data().userId,
      wordId: d.data().wordId,
      word1: d.data().word1,
      word2: d.data().word2,
      isDoneFlg: d.data().isDoneFlg,
      isSkipedFlg: d.data().isSkipedFlg,
      createdTs: d.data().createdTs.toDate(),
      updatedTs: d.data().updatedTs.toDate(),
    };
  };

  const init = () => {
    console.debug('[tasks.init]', user?.uid);
    if (user == null) {
      task.value = null;
      tasks.value = null;
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
        task.value = deserialize(snapshot.docs[0]);

        const now = toDate(new Date());
        const today = [];
        const yeasterday = [];
        const previously = [];
        for (const taskDoc of snapshot.docs) {
          const t = deserialize(taskDoc);
          const tDate = toDate(task.value.createdTs);
          if (now.getTime() - tDate.getTime() == 0) {
            today.push(t);
          } else if (now.getTime() - tDate.getTime() == oneDay) {
            yeasterday.push(t);
          } else {
            previously.push(t);
          }
        }
        tasks.value = { today, yeasterday, previously };
      } else {
        tasks.value = null;
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
      tasks.value = null;
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
        await updateDoc(doc(tasksCol, t.id), {
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
    if (t == null) {
      return;
    }

    if (!t.isSkipedFlg && !t.isDoneFlg) {
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
    }
  };

  const splitRule = /[ \r\n¡!¿?.,:;'\"]+/;
  // const convert = (s: string) => s.toLowerCase().normalize('NFKD').split(splitRule);
  const convert = (s: string): string[] =>
    deburr(s.toLowerCase()).split(splitRule);
  const validate = async (answer: string): Promise<boolean> => {
    const t = task.value;
    if (t == null) {
      return false;
    }

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
