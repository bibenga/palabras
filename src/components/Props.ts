import { Task } from 'src/stores/models';

export interface Props {
  label: string;
  tasks: Rev<Task[] | null>;
  timeFormat: 'timeAgo' | 'time' | 'full';
}
