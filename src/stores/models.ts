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

export interface Task {
  id: string;
  userId: string;
  wordId: string;
  word1: string[];
  word2: string[];
  isDoneFlg: boolean;
  isSkipedFlg: boolean;
  createdTs: Date;
  updatedTs?: Date;
}
