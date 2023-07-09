export interface Word {
  id: string;
  userId: string;
  word1: string[];
  word2: string[];
  isLearnedFlg: boolean;
  random: number;
  createdTs: Date;
  updatedTs?: Date;
}

// export interface Task {
//   id: string;
//   userId: string;
//   wordId: string;
//   word1: string[];
//   word2: string[];
//   isDoneFlg: boolean;
//   isSkipedFlg: boolean;
//   createdTs: Date;
//   updatedTs: Date;
// }

export interface TaskWord {
  wordId: string;
  word1: string[];
  word2: string[];
  word1position?: number;
  word2position?: number;
}

export type TaskType = 'translation' | 'choice';

export interface Task {
  id: string;
  userId: string;
  createdTs: Date;
  updatedTs: Date;

  isDoneFlg: boolean;
  isSkipedFlg: boolean;
  errorCount: number;

  // el tipo de el ejercicio: translation; choice
  type: TaskType;

  // word?: TaskWordPair;
  words: TaskWord[];

  // 1 - adivina la palabra
  // direction: string; // 1->2, 1<-2

  // 2 - comparación
  // wordsPosition: number[][]; //rowIndex[0..n], wordIndex[1..2]
}

export interface TaskProgress {
  today: Task[];
  yeasterday: Task[];
  previously: Task[];
}
