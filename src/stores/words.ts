import { defineStore } from 'pinia';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { Word } from './models';
import { useCollection, useCurrentUser } from 'vuefire';
import { computed } from 'vue';

export const useWordsStore = defineStore('words', () => {
  console.log('[words.setup]');

  const firestore = getFirestore();
  const wordsCol = collection(firestore, 'words');

  const user = useCurrentUser();

  // const { data: words, pending } = useCollection(() => {
  //   if (user.value) {
  //     const wordsQuery = query(
  //       wordsCol,
  //       where('userId', '==', user.value.uid),
  //       orderBy('word1', 'asc'),
  //     );
  //     return wordsQuery.withConverter<Word, DocumentData>({
  //       fromFirestore: (snapshot) => firestoreDefaultConverter.fromFirestore(snapshot) as Word,
  //       toFirestore: firestoreDefaultConverter.toFirestore,
  //     });
  //   }
  //   return null;
  // });
  const { data: words, pending } = useCollection<Word>(() => {
    if (user.value) {
      return query(wordsCol, where('userId', '==', user.value.uid), orderBy('word1', 'asc'));
    }
    return null;
  });
  const ready = computed(() => !pending.value);

  // const deserialize = (d: QueryDocumentSnapshot<DocumentData>): Word => {
  //   return {
  //     id: d.id,
  //     userId: d.data().userId,
  //     word1: d.data().word1,
  //     word2: d.data().word2,
  //     isLearnedFlg: d.data().isLearnedFlg,
  //     random: d.data().random,
  //     createdTs: d.data().createdTs.toDate(),
  //     updatedTs: d.data().updatedTs?.toDate() || d.data().createdTs.toDate(),
  //   };
  // };

  const getWord = (id: string): Word | null => {
    const items = words.value;
    if (items.length > 0) {
      for (const item of items) {
        if (item.id == id) {
          return item;
        }
      }
    }
    return null;
  };

  const randomWord = (ignoreIds: string[] | null = null): Word | null => {
    const items = words.value;
    if (items != null && items.length > 0) {
      if (items.length == 1) {
        return items[0];
      }
      while (true) {
        const selected = items[Math.floor(Math.random() * items.length)];
        if (ignoreIds === null || ignoreIds === undefined) {
          return selected;
        } else if (!ignoreIds.includes(selected.id)) {
          return selected;
        }
      }
    }
    return null;
  };

  const randomWords = (expected: number, ignoreIds: string[] | null = null): Word[] => {
    let items = [...words.value];
    if (ignoreIds) {
      items = items.filter((item) => !ignoreIds.includes(item.id));
    }
    const res = [] as Word[];
    while (res.length < expected && items.length > 0) {
      const index = Math.floor(Math.random() * items.length);
      res.push(items[index]);
      items.splice(index, 1);
    }
    return res;
  };

  const createWord = async (
    word1: string[],
    word2: string[],
    isLearnedFlg: boolean,
  ): Promise<void> => {
    await addDoc(wordsCol, {
      userId: user.value?.uid || '',
      word1: word1,
      word2: word2,
      isLearnedFlg: isLearnedFlg,
      random: Math.random(),
      createdTs: new Date(),
      updatedTs: new Date(),
    });
  };

  const updateWord = async (
    id: string,
    word1: string[],
    word2: string[],
    isLearnedFlg: boolean,
  ): Promise<void> => {
    await updateDoc(doc(wordsCol, id), {
      word1: word1,
      word2: word2,
      isLearnedFlg: isLearnedFlg,
      updatedTs: new Date(),
    });
  };

  const markWordAsLearned = async (id: string): Promise<void> => {
    await updateDoc(doc(wordsCol, id), {
      isLearnedFlg: true,
      updatedTs: new Date(),
    });
  };

  const deleteWord = async (id: string): Promise<void> => {
    await deleteDoc(doc(wordsCol, id));
  };

  const deleteWords = async (ids: string[]): Promise<void> => {
    const batch = writeBatch(firestore);
    for (const id of ids) {
      const laRef = doc(wordsCol, id);
      batch.delete(laRef);
    }
    await batch.commit();
  };

  const parseAndSaveWords = async (text: string, wordSep = /\s*;\s*/): Promise<number> => {
    try {
      const pairSep = /\s*-\s*/;
      const newWords = text
        .split(/[\r\n]+/)
        .map((line) => line.trim())
        .filter((line) => line.length == 0 || !line.startsWith('#'))
        .map((line) => line.split(pairSep))
        .filter((line) => line.length == 2)
        .map((line) => [line[0].split(wordSep), line[1].split(wordSep)]);

      const batch = writeBatch(firestore);
      for (const pair of newWords) {
        const wordDoc = doc(wordsCol);
        batch.set(wordDoc, {
          userId: user.value?.uid || '',
          word1: pair[0],
          word2: pair[1],
          isLearnedFlg: false,
          random: Math.random(),
          createdTs: new Date(),
          updatedTs: new Date(),
        });
      }
      await batch.commit();
      return newWords.length;
    } catch (error) {
      console.error(error);
      return -1;
    }
  };

  const loadDemoWords = async (code: string): Promise<number> => {
    try {
      let newWordsRaw;
      if (code === 'es-ru') {
        newWordsRaw = (await import('../assets/es-ru.txt?raw')).default;
      } else if (code == 'es-en') {
        newWordsRaw = (await import('../assets/es-en.txt?raw')).default;
      } else if (code == 'en-ru') {
        newWordsRaw = (await import('../assets/en-ru.txt?raw')).default;
      } else {
        throw new Error(`the code "${code}" is not supported`);
      }
      return await parseAndSaveWords(newWordsRaw);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return {
    ready,
    words,
    getWord,
    randomWord,
    randomWords,
    createWord,
    updateWord,
    markWordAsLearned,
    deleteWord,
    deleteWords,
    loadDemoWords,
  };
});
