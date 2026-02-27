import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { AppState, Tab, Worker, MCTask, LogEntry, StatusLevel } from './types';

// ── helpers ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const obfuscate = (s: string) => btoa(s);
const deobfuscate = (s: string) => { try { return atob(s); } catch { return ''; } };

// ── initial state ─────────────────────────────────────────────────────────────
const initialState: AppState = {
  powered: true,
  activeTab: 'dashboard',
  generals: [
    { id: 'gen-1', name: 'General Alpha', status: 'active' },
    { id: 'gen-2', name: 'General Beta',  status: 'active' },
    { id: 'gen-3', name: 'General Gamma', status: 'idle'   },
  ],
  workers: [
    { id: 'w-1', name: 'Worker-01', type: 'Scraper',   status: 'active',  generalId: 'gen-1', createdAt: Date.now() - 86400000 },
    { id: 'w-2', name: 'Worker-02', type: 'Analyzer',  status: 'idle',    generalId: 'gen-1', createdAt: Date.now() - 72000000 },
    { id: 'w-3', name: 'Worker-03', type: 'Executor',  status: 'active',  generalId: 'gen-2', createdAt: Date.now() - 36000000 },
    { id: 'w-4', name: 'Worker-04', type: 'Reporter',  status: 'offline', generalId: 'gen-2', createdAt: Date.now() - 18000000 },
    { id: 'w-5', name: 'Worker-05', type: 'Monitor',   status: 'idle',    generalId: 'gen-3', createdAt: Date.now() -  7200000 },
  ],
  tasks: [
    { id: 't-1', name: 'Initial Scan',   description: 'Scan target endpoints', workerId: 'w-1', status: 'complete', createdAt: Date.now() - 3600000, startedAt: Date.now() - 3500000, completedAt: Date.now() - 3400000, output: 'Scan complete. 12 endpoints found.' },
    { id: 't-2', name: 'Data Analysis',  description: 'Analyse collected data',  workerId: 'w-2', status: 'running', createdAt: Date.now() - 1800000, startedAt: Date.now() - 1700000, output: 'Processing…' },
    { id: 't-3', name: 'Report Export',  description: 'Export findings to CSV',  workerId: null,  status: 'pending', createdAt: Date.now() - 600000, output: '' },
  ],
  logs: [],
  openaiKey: '',
  firstRunDone: false,
};

// ── actions ───────────────────────────────────────────────────────────────────
type Action =
  | { type: 'TOGGLE_POWER' }
  | { type: 'SET_TAB'; tab: Tab }
  | { type: 'ADD_WORKER'; worker: Worker }
  | { type: 'UPDATE_WORKER_STATUS'; id: string; status: StatusLevel }
  | { type: 'REMOVE_WORKER'; id: string }
  | { type: 'ADD_TASK'; task: MCTask }
  | { type: 'UPDATE_TASK'; id: string; patch: Partial<MCTask> }
  | { type: 'REMOVE_TASK'; id: string }
  | { type: 'ADD_LOG'; entry: LogEntry }
  | { type: 'CLEAR_LOGS' }
  | { type: 'SET_OPENAI_KEY'; raw: string }
  | { type: 'MARK_FIRST_RUN' }
  | { type: 'LOAD_SAVED'; saved: Partial<AppState> };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'TOGGLE_POWER': {
      const powered = !state.powered;
      return {
        ...state,
        powered,
        generals: state.generals.map(g => ({ ...g, status: powered ? g.status : 'offline' as StatusLevel })),
        workers:  state.workers.map(w  => ({ ...w, status: powered ? w.status  : 'offline' as StatusLevel })),
      };
    }
    case 'SET_TAB':    return { ...state, activeTab: action.tab };
    case 'ADD_WORKER': return { ...state, workers: [...state.workers, action.worker] };
    case 'UPDATE_WORKER_STATUS':
      return { ...state, workers: state.workers.map(w => w.id === action.id ? { ...w, status: action.status } : w) };
    case 'REMOVE_WORKER':
      return { ...state, workers: state.workers.filter(w => w.id !== action.id) };
    case 'ADD_TASK':   return { ...state, tasks: [...state.tasks, action.task] };
    case 'UPDATE_TASK':
      return { ...state, tasks: state.tasks.map(t => t.id === action.id ? { ...t, ...action.patch } : t) };
    case 'REMOVE_TASK': return { ...state, tasks: state.tasks.filter(t => t.id !== action.id) };
    case 'ADD_LOG':    return { ...state, logs: [action.entry, ...state.logs].slice(0, 500) };
    case 'CLEAR_LOGS': return { ...state, logs: [] };
    case 'SET_OPENAI_KEY': return { ...state, openaiKey: obfuscate(action.raw) };
    case 'MARK_FIRST_RUN': return { ...state, firstRunDone: true };
    case 'LOAD_SAVED': return { ...state, ...action.saved };
    default: return state;
  }
}

// ── context ───────────────────────────────────────────────────────────────────
interface AppCtx {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  addLog: (msg: string, level?: LogEntry['level'], workerId?: string | null, taskId?: string | null) => void;
  getOpenaiKey: () => string;
}

const AppContext = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // load persisted data on mount
  useEffect(() => {
    const raw = localStorage.getItem('mc_state');
    if (raw) {
      try {
        const saved = JSON.parse(raw) as Partial<AppState>;
        dispatch({ type: 'LOAD_SAVED', saved: { openaiKey: saved.openaiKey ?? '', firstRunDone: saved.firstRunDone ?? false } });
      } catch { /* ignore */ }
    }
  }, []);

  // persist select fields
  useEffect(() => {
    localStorage.setItem('mc_state', JSON.stringify({ openaiKey: state.openaiKey, firstRunDone: state.firstRunDone }));
  }, [state.openaiKey, state.firstRunDone]);

  const addLog = useCallback((msg: string, level: LogEntry['level'] = 'info', workerId: string | null = null, taskId: string | null = null) => {
    dispatch({
      type: 'ADD_LOG',
      entry: { id: uid(), timestamp: Date.now(), workerId, taskId, level, message: msg },
    });
  }, []);

  const getOpenaiKey = useCallback(() => deobfuscate(state.openaiKey), [state.openaiKey]);

  // first-run side-effect
  useEffect(() => {
    if (!state.firstRunDone) {
      const ts = new Date().toISOString();
      addLog(`[FIRST RUN] ${ts} — MissionControl v0 started`, 'info');
      addLog(`[FIRST RUN] Would create D:\\MissionControl\\data  (simulated in browser)`, 'info');
      addLog(`[FIRST RUN] Would create D:\\MissionControl\\logs  (simulated in browser)`, 'info');
      addLog(`[FIRST RUN] Would write  D:\\MissionControl\\logs\\first-run.txt`, 'info');
      dispatch({ type: 'MARK_FIRST_RUN' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <AppContext.Provider value={{ state, dispatch, addLog, getOpenaiKey }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

export { uid };
