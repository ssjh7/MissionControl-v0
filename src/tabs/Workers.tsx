import { useState } from 'react';
import { Plus, Play, Square, Trash2, X } from 'lucide-react';
import { useApp, uid } from '../context';
import { StatusLight } from '../components/StatusLight';
import type { Worker, StatusLevel } from '../types';

const WORKER_TYPES = ['Scraper', 'Analyzer', 'Executor', 'Reporter', 'Monitor', 'Scheduler', 'Notifier'];

function AddWorkerModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch, addLog } = useApp();
  const [name, setName]       = useState('');
  const [type, setType]       = useState('Scraper');
  const [genId, setGenId]     = useState(state.generals[0]?.id ?? '');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const w: Worker = {
      id: `w-${uid()}`,
      name: name.trim(),
      type,
      status: 'idle',
      generalId: genId || null,
      createdAt: Date.now(),
    };
    dispatch({ type: 'ADD_WORKER', worker: w });
    addLog(`Worker "${w.name}" (${w.type}) added`, 'info', w.id);
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Worker</h3>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="modal-form">
          <label>
            Name
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Worker-06"
            />
          </label>
          <label>
            Type
            <select value={type} onChange={e => setType(e.target.value)}>
              {WORKER_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label>
            Assign to General
            <select value={genId} onChange={e => setGenId(e.target.value)}>
              <option value="">— none —</option>
              {state.generals.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </label>
          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={!name.trim()}>Add Worker</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Workers() {
  const { state, dispatch, addLog } = useApp();
  const [showModal, setShowModal]   = useState(false);
  const { workers, generals, powered } = state;

  function toggle(w: Worker) {
    if (!powered) return;
    const next: StatusLevel = w.status === 'active' ? 'idle' : 'active';
    dispatch({ type: 'UPDATE_WORKER_STATUS', id: w.id, status: next });
    addLog(`Worker "${w.name}" ${next === 'active' ? 'started' : 'stopped'}`, 'info', w.id);
  }

  function remove(w: Worker) {
    dispatch({ type: 'REMOVE_WORKER', id: w.id });
    addLog(`Worker "${w.name}" removed`, 'warn', w.id);
  }

  const generalName = (id: string | null) => generals.find(g => g.id === id)?.name ?? '—';

  return (
    <div className="tab-content">
      <div className="tab-header">
        <div>
          <h2 className="tab-title">Workers</h2>
          <p className="tab-subtitle">{workers.length} registered · {workers.filter(w => w.status === 'active').length} active</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)} disabled={!powered}>
          <Plus size={14} /> Add Worker
        </button>
      </div>

      {!powered && (
        <div className="warning-banner">System is offline — power on to manage workers.</div>
      )}

      <div className="table-wrap">
        <table className="mc-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Name</th>
              <th>Type</th>
              <th>General</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {workers.length === 0 && (
              <tr><td colSpan={6} className="table-empty">No workers registered.</td></tr>
            )}
            {workers.map(w => (
              <tr key={w.id} className={w.status === 'offline' ? 'row-dim' : ''}>
                <td><StatusLight status={w.status} size={11} /></td>
                <td style={{ fontWeight: 600 }}>{w.name}</td>
                <td><span className="badge badge-type">{w.type}</span></td>
                <td style={{ color: 'var(--text-secondary)' }}>{generalName(w.generalId)}</td>
                <td style={{ color: 'var(--text-dim)', fontSize: 12 }}>{new Date(w.createdAt).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className={`icon-btn ${w.status === 'active' ? 'icon-btn-stop' : 'icon-btn-start'}`}
                      onClick={() => toggle(w)}
                      disabled={!powered || w.status === 'offline'}
                      title={w.status === 'active' ? 'Stop' : 'Start'}
                    >
                      {w.status === 'active' ? <Square size={13} /> : <Play size={13} />}
                    </button>
                    <button
                      className="icon-btn icon-btn-danger"
                      onClick={() => remove(w)}
                      title="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <AddWorkerModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
