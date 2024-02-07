import { defineStore } from 'pinia';
import { inject, ref } from 'vue';
import {
  DocumentData,
  Firestore,
  QueryDocumentSnapshot,
  Unsubscribe,
  addDoc,
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
import shuffle from 'lodash/shuffle';
import { Task, TaskWord, TaskType, TaskProgress } from './models';

export const useTasksStore = defineStore('tasks', () => {
  console.log('[tasks.setup]');

  const fireauth = inject<Auth>('fireauth');
  const firestore = inject<Firestore>('firestore');
  const tasksCol = collection(firestore, 'tasks');

  const wordsStore = useWordsStore();

  const ready = ref(false);
  const tasks = ref<Task[]>([]);
  const statistics = ref<TaskProgress | null>(null);

  let user: User | null = null;

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
      createdTs: d.data().createdTs.toDate(),
      updatedTs: d.data().updatedTs?.toDate() || d.data().createdTs.toDate(),

      isDoneFlg: d.data().isDoneFlg,
      isSkipedFlg: d.data().isSkipedFlg,
      errorCount: d.data().errorCount,

      type: d.data().type,
      words: d.data().words,
    };
  };

  let tasksUnsubscribe: Unsubscribe | null = null;
  const init = () => {
    console.debug('[tasks.init]', user?.uid);
    if (user == null) {
      tasks.value = [];
      statistics.value = null;
      return;
    }
    const tasksQuery = query(
      tasksCol,
      where('userId', '==', user.uid),
      orderBy('createdTs', 'desc'),
      limit(100),
    );
    tasksUnsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      console.debug('[tasks.onSnapshot]', snapshot);
      if (!snapshot.empty) {
        const now = toDate(new Date());
        const alltasks = [];
        const today = [];
        const yeasterday = [];
        const previously = [];
        for (const taskDoc of snapshot.docs) {
          const t = deserialize(taskDoc);
          alltasks.push(t);
          const tDate = toDate(t.createdTs);
          if (now.getTime() - tDate.getTime() == 0) {
            today.push(t);
          } else if (now.getTime() - tDate.getTime() == oneDay) {
            yeasterday.push(t);
          } else {
            previously.push(t);
          }
        }
        tasks.value = alltasks;
        statistics.value = { today, yeasterday, previously };
      } else {
        tasks.value = [];
        statistics.value = null;
      }
      console.debug('statistics', statistics.value);
      ready.value = true;
    });
  };

  const cleanup = () => {
    console.debug('[tasks.cleanup]');
    if (tasksUnsubscribe != null) {
      tasksUnsubscribe();
      tasksUnsubscribe = null;
      tasks.value = [];
      statistics.value = null;
    }
  };

  onAuthStateChanged(fireauth, (authUser) => {
    user = authUser;
    console.debug('[tasks.onAuthStateChanged]', authUser?.uid);
    if (user) {
      cleanup();
      init();
    } else {
      cleanup();
    }
  });

  const newTask = async (type: TaskType): Promise<boolean> => {
    if (type === 'translation') {
      const randomWord = await wordsStore.randomWord(null);
      if (randomWord != null) {
        const queryAndAnswer = [randomWord.word1, randomWord.word2];
        shuffle(queryAndAnswer);
        const word: TaskWord = {
          wordId: randomWord.id,
          word1: queryAndAnswer[0],
          word2: queryAndAnswer[1],
        };
        const task = {
          userId: user?.uid,
          createdTs: new Date(),
          updatedTs: new Date(),

          isDoneFlg: false,
          isSkipedFlg: false,
          errorCount: 0,

          // el tipo de el ejercicio: translation; choice
          type: type,

          // word?: TaskWordPair;
          words: [word],
        };
        console.debug('new task', type, task);
        await addDoc(tasksCol, task);
      }
      return randomWord != null;
    } else if (type == 'choice') {
      const randomWords = wordsStore.randomWords(7, null);
      if (randomWords.length > 0) {
        const words = [] as TaskWord[];

        const pos = [] as number[];
        for (let i = 0; i < randomWords.length; i++) {
          pos.push(i);
        }
        const pos1 = shuffle(pos);
        const pos2 = shuffle(pos);

        randomWords.forEach((w, i) => {
          words.push({
            wordId: w.id,
            word1: w.word1,
            word1position: pos1[i],
            word2: w.word2,
            word2position: pos2[i],
          } as TaskWord);
        });

        const task = {
          userId: user?.uid,
          createdTs: new Date(),
          updatedTs: new Date(),

          isDoneFlg: false,
          isSkipedFlg: false,
          errorCount: 0,

          // el tipo de el ejercicio: translation; choice
          type: type,

          // word?: TaskWordPair;
          words: words,
        };
        console.debug('new task', type, task);
        await addDoc(tasksCol, task);
      }
      return randomWords.length > 0;
    } else {
      throw new Error(`The type '${type}' is unknown`);
    }
  };

  const markAsLearned = async (task: Task) => {
    if (task.type === 'translation' && !task.isSkipedFlg && !task.isDoneFlg) {
      try {
        await updateDoc(doc(tasksCol, task.id), {
          isSkipedFlg: true,
          updatedTs: new Date(),
        });
      } catch (error) {
        console.error(error);
      }
      try {
        await wordsStore.markWordAsLearned(t.words[0].wordId);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const markAsDone = async (task: Task): Promise<void> => {
    if (!task.isDoneFlg && !task.isSkipedFlg) {
      await updateDoc(doc(tasksCol, task.id), {
        isDoneFlg: true,
        updatedTs: new Date(),
      });
    }
  };

  const markAsSkiped = async (task: Task): Promise<void> => {
    if (!task.isDoneFlg && !task.isSkipedFlg) {
      await updateDoc(doc(tasksCol, task.id), {
        isSkipedFlg: true,
        updatedTs: new Date(),
      });
    }
  };

  return {
    ready,
    tasks,
    statistics,
    newTask,
    markAsDone,
    markAsSkiped,
    markAsLearned,
  };
});
