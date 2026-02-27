export type Tab = 'dashboard' | 'workers' | 'tasks' | 'logs' | 'connections' | 'settings';

export type StatusLevel = 'active' | 'idle' | 'offline';
export type TaskStatus = 'pending' | 'running' | 'complete' | 'failed';
export type LogLevel = 'info' | 'warn' | 'error';

export interface Worker {
  id: string;
  name: string;
  type: string;
  status: StatusLevel;
  generalId: string | null;
  createdAt: number;
}

export interface General {
  id: string;
  name: string;
  status: StatusLevel;
}

export interface MCTask {
  id: string;
  name: string;
  description: string;
  workerId: string | null;
  status: TaskStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  output: string;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  workerId: string | null;
  taskId: string | null;
  level: LogLevel;
  message: string;
}

export interface AppState {
  powered: boolean;
  activeTab: Tab;
  workers: Worker[];
  generals: General[];
  tasks: MCTask[];
  logs: LogEntry[];
  openaiKey: string;
  firstRunDone: boolean;
}
