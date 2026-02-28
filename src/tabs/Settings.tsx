import { useState } from 'react';
import { Trash2, RefreshCw, Info, Wifi } from 'lucide-react';
import { useApp } from '../context';

const LOCAL_URL  = 'http://localhost:3001';
const PUBLIC_URL = 'https://mc.missioncontrolapp.org';

export function Settings() {
  const { state, dispatch, addLog } = useApp();
  const [confirmReset, setConfirmReset] = useState(false);

  // WhatsApp Ingress
  const [draftUrl,    setDraftUrl]    = useState(state.ingressUrl);
  const [healthState, setHealthState] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [healthMsg,   setHealthMsg]   = useState('');

  function saveIngressUrl() {
    const url = draftUrl.trim().replace(/\/$/, '');
    dispatch({ type: 'SET_INGRESS_URL', url });
    addLog(`WhatsApp ingress URL set to ${url}`, 'info');
  }

  function usePreset(url: string) {
    setDraftUrl(url);
    dispatch({ type: 'SET_INGRESS_URL', url });
    addLog(`WhatsApp ingress URL set to ${url}`, 'info');
  }

  async function testHealth() {
    const url = draftUrl.trim().replace(/\/$/, '');
    setHealthState('testing');
    setHealthMsg('');
    try {
      const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        setHealthState('ok');
        setHealthMsg(`${res.status} OK`);
      } else {
        setHealthState('fail');
        setHealthMsg(`${res.status} ${res.statusText}`);
      }
    } catch (e: unknown) {
      setHealthState('fail');
      setHealthMsg(e instanceof Error ? e.message : 'Connection failed');
    }
    setTimeout(() => setHealthState('idle'), 4000);
  }

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

        {/* WhatsApp Ingress */}
        <div className="settings-card">
          <div className="settings-card-title"><Wifi size={15} /> WhatsApp Ingress</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="key-input"
                style={{ flex: 1 }}
                value={draftUrl}
                onChange={e => setDraftUrl(e.target.value)}
                placeholder="http://localhost:3001"
                spellCheck={false}
              />
              <button className="btn-primary btn-sm" onClick={saveIngressUrl}>Save</button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-ghost btn-sm" onClick={() => usePreset(LOCAL_URL)}>Use Local</button>
              <button className="btn-ghost btn-sm" onClick={() => usePreset(PUBLIC_URL)}>Use Public</button>
              <button
                className={`btn-ghost btn-sm ${healthState === 'ok' ? 'btn-success' : healthState === 'fail' ? 'btn-danger' : ''}`}
                onClick={() => { void testHealth(); }}
                disabled={healthState === 'testing'}
              >
                {healthState === 'testing' ? 'Testing…' : healthState === 'ok' ? '✓ OK' : healthState === 'fail' ? '✗ Failed' : 'Test Connection'}
              </button>
            </div>
            {healthMsg && (
              <div style={{ fontSize: 12, color: healthState === 'ok' ? '#22c55e' : '#ef4444' }}>
                {healthMsg}
              </div>
            )}
            <div className="settings-rows" style={{ marginTop: 4 }}>
              <div className="settings-row">
                <span>Active URL</span>
                <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{state.ingressUrl}</span>
              </div>
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
