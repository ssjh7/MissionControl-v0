import { useState } from 'react';
import { Trash2, RefreshCw, Info } from 'lucide-react';
import { useApp } from '../context';

export function Settings() {
  const { state, dispatch, addLog } = useApp();
  const [confirmReset, setConfirmReset] = useState(false);

  const totalLogs    = state.logs.length;
  const totalWorkers = state.workers.length;
  const totalTasks   = state.tasks.length;

  function clearAll() {
    if (!confirmReset) { setConfirmReset(true); return; }
    dispatch({ type: 'CLEAR_LOGS' });
    addLog('All logs cleared via Settings', 'warn');
    setConfirmReset(false);
  }

  function resetWorkers() {
    state.workers.forEach(w => dispatch({ type: 'REMOVE_WORKER', id: w.id }));
    addLog('All workers removed via Settings', 'warn');
  }

  function resetTasks() {
    state.tasks.forEach(t => dispatch({ type: 'REMOVE_TASK', id: t.id }));
    addLog('All tasks removed via Settings', 'warn');
  }

  return (
    <div className="tab-content">
      <div className="tab-header">
        <div>
          <h2 className="tab-title">Settings</h2>
          <p className="tab-subtitle">App configuration and data management</p>
        </div>
      </div>

      <div className="settings-grid">

        {/* App info */}
        <div className="settings-card">
          <div className="settings-card-title"><Info size={15} /> About</div>
          <div className="settings-rows">
            <div className="settings-row"><span>App</span><span>MissionControl v0</span></div>
            <div className="settings-row"><span>Runtime</span><span>React 19 + Vite (browser)</span></div>
            <div className="settings-row"><span>Build date</span><span>2026-02-27</span></div>
            <div className="settings-row"><span>Production logs</span><span style={{ fontFamily: 'monospace', fontSize: 12 }}>D:\MissionControl\logs\</span></div>
            <div className="settings-row"><span>Production data</span><span style={{ fontFamily: 'monospace', fontSize: 12 }}>D:\MissionControl\data\</span></div>
          </div>
        </div>

        {/* System stats */}
        <div className="settings-card">
          <div className="settings-card-title"><RefreshCw size={15} /> System State</div>
          <div className="settings-rows">
            <div className="settings-row"><span>Power</span>
              <span style={{ color: state.powered ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                {state.powered ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <div className="settings-row"><span>Workers</span><span>{totalWorkers}</span></div>
            <div className="settings-row"><span>Tasks</span><span>{totalTasks}</span></div>
            <div className="settings-row"><span>Log entries</span><span>{totalLogs}</span></div>
            <div className="settings-row"><span>OpenAI key</span>
              <span style={{ color: state.openaiKey ? '#22c55e' : '#ef4444' }}>
                {state.openaiKey ? 'Saved' : 'Not set'}
              </span>
            </div>
            <div className="settings-row"><span>First run</span>
              <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>
                {state.firstRunDone ? 'Completed' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="settings-card settings-card-danger">
          <div className="settings-card-title" style={{ color: '#ef4444' }}><Trash2 size={15} /> Danger Zone</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="settings-danger-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Clear all logs</div>
                <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>Removes {totalLogs} log entries from memory</div>
              </div>
              <button className="btn-ghost btn-danger btn-sm" onClick={clearAll}>
                {confirmReset ? '⚠ Confirm?' : 'Clear Logs'}
              </button>
            </div>
            <div className="settings-danger-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Remove all workers</div>
                <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>{totalWorkers} workers will be deleted</div>
              </div>
              <button className="btn-ghost btn-danger btn-sm" onClick={resetWorkers}>Remove Workers</button>
            </div>
            <div className="settings-danger-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Remove all tasks</div>
                <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>{totalTasks} tasks will be deleted</div>
              </div>
              <button className="btn-ghost btn-danger btn-sm" onClick={resetTasks}>Remove Tasks</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
