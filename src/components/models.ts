export interface Todo {
  id: number;
  content: string;
}

export interface Meta {
  totalCount: number;
}

export interface Word {
  userId: string;
  createdTs: Date;
  word1: string[];
  word2: string[];
  isLearnedFlg: boolean;
  random: number;
}

export interface Task {
  userId: string;
  createdTs: Date;
  wordId: string;
  word1: string[];
  word2: string[];
  isDoneFlg: boolean;
  isSkipedFlg: boolean;
}
