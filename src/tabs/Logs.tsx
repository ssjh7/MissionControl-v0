import { useState, useRef, useEffect } from 'react';
import { Trash2, Download, FolderOpen } from 'lucide-react';
import { useApp } from '../context';
import type { LogLevel } from '../types';

const LEVEL_COLOR: Record<LogLevel, string> = {
  info:  '#94a3b8',
  warn:  '#eab308',
  error: '#ef4444',
};

const LEVEL_PREFIX: Record<LogLevel, string> = {
  info:  'INFO ',
  warn:  'WARN ',
  error: 'ERROR',
};

export function Logs() {
  const { state, dispatch, addLog } = useApp();
  const { logs, workers, tasks }    = state;

  const [workerFilter, setWorkerFilter] = useState<string>('all');
  const [levelFilter,  setLevelFilter]  = useState<LogLevel | 'all'>('all');
  const [taskFilter,   setTaskFilter]   = useState<string>('all');
  const [autoScroll,   setAutoScroll]   = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, autoScroll]);

  const visible = logs.filter(l => {
    if (workerFilter !== 'all' && l.workerId !== workerFilter) return false;
    if (levelFilter  !== 'all' && l.level    !== levelFilter)  return false;
    if (taskFilter   !== 'all' && l.taskId   !== taskFilter)   return false;
    return true;
  });

  function clearLogs() {
    dispatch({ type: 'CLEAR_LOGS' });
  }

  function buildExportContent() {
    return visible
      .slice().reverse()
      .map(l => `[${new Date(l.timestamp).toISOString()}] [${LEVEL_PREFIX[l.level]}] ${l.message}`)
      .join('\n');
  }

  async function exportLogs() {
    const content = buildExportContent();

    if (window.mc) {
      // Electron: write to D:\MissionControl\logs\export-<timestamp>.txt
      const filePath = await window.mc.exportLogs(content);
      addLog(`Logs exported → ${filePath}`, 'info');
    } else {
      // Browser fallback: trigger download
      const blob = new Blob([content], { type: 'text/plain' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `mc-logs-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      addLog('Logs exported to file', 'info');
    }
  }

  function openLogsFolder() {
    void window.mc?.openLogsFolder();
  }

  function formatTime(ts: number) {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}.${d.getMilliseconds().toString().padStart(3,'0')}`;
  }

  const workerName = (id: string | null) => workers.find(w => w.id === id)?.name;
  const taskName   = (id: string | null) => tasks.find(t => t.id === id)?.name;

  const inElectron = typeof window !== 'undefined' && !!window.mc;

  return (
    <div className="tab-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="tab-header">
        <div>
          <h2 className="tab-title">Logs</h2>
          <p className="tab-subtitle">{logs.length} entries · {visible.length} visible</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {inElectron && (
            <button className="btn-ghost" onClick={openLogsFolder}>
              <FolderOpen size={14} /> Open Folder
            </button>
          )}
          <button className="btn-ghost" onClick={() => { void exportLogs(); }}>
            <Download size={14} /> Export
          </button>
          <button className="btn-ghost btn-danger" onClick={clearLogs}>
            <Trash2 size={14} /> Clear
          </button>
        </div>
      </div>

      {/* path hint */}
      <div className="log-path-hint">
        <FolderOpen size={13} />
        {inElectron
          ? <span>Logs path: <code>D:\MissionControl\logs</code></span>
          : <span>Production path: <code>D:\MissionControl\logs\session-{new Date().toISOString().slice(0,10)}.txt</code> (simulated in browser)</span>
        }
      </div>

      {/* filters */}
      <div className="filter-row" style={{ flexWrap: 'wrap' }}>
        <select className="filter-select" value={workerFilter} onChange={e => setWorkerFilter(e.target.value)}>
          <option value="all">All Workers</option>
          {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <select className="filter-select" value={levelFilter} onChange={e => setLevelFilter(e.target.value as LogLevel | 'all')}>
          <option value="all">All Levels</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
        </select>
        <select className="filter-select" value={taskFilter} onChange={e => setTaskFilter(e.target.value)}>
          <option value="all">All Tasks</option>
          {tasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <label className="auto-scroll-toggle">
          <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} />
          Auto-scroll
        </label>
      </div>

      {/* log output */}
      <div className="log-terminal">
        {visible.length === 0 && (
          <div style={{ color: 'var(--text-dim)', padding: '12px 0' }}>No log entries match the current filter.</div>
        )}
        {[...visible].reverse().map(entry => (
          <div key={entry.id} className={`log-line log-line-${entry.level}`}>
            <span className="log-ts">{formatTime(entry.timestamp)}</span>
            <span className={`log-level log-level-${entry.level}`}>{LEVEL_PREFIX[entry.level]}</span>
            {entry.workerId && workerName(entry.workerId) && (
              <span className="log-tag">[{workerName(entry.workerId)}]</span>
            )}
            {entry.taskId && taskName(entry.taskId) && (
              <span className="log-tag log-tag-task">[{taskName(entry.taskId)}]</span>
            )}
            <span className="log-msg" style={{ color: LEVEL_COLOR[entry.level] }}>{entry.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
