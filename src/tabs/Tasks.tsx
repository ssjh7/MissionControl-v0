import { useState } from 'react';
import { Plus, Play, Trash2, X, CheckCircle, Clock, AlertCircle, Loader } from 'lucide-react';
import { useApp, uid } from '../context';
import type { MCTask, TaskStatus } from '../types';

const STATUS_ICON: Record<TaskStatus, React.ReactNode> = {
  pending:  <Clock     size={14} color="#a855f7" />,
  running:  <Loader    size={14} color="#3b82f6" className="spin" />,
  complete: <CheckCircle size={14} color="#22c55e" />,
  failed:   <AlertCircle size={14} color="#ef4444" />,
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  pending:  'Pending',
  running:  'Running',
  complete: 'Complete',
  failed:   'Failed',
};

function CreateTaskModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch, addLog } = useApp();
  const [name, setName]         = useState('');
  const [desc, setDesc]         = useState('');
  const [workerId, setWorkerId] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const task: MCTask = {
      id: `t-${uid()}`,
      name: name.trim(),
      description: desc.trim(),
      workerId: workerId || null,
      status: 'pending',
      createdAt: Date.now(),
      output: '',
    };
    dispatch({ type: 'ADD_TASK', task });
    addLog(`Task "${task.name}" created`, 'info', workerId || null, task.id);
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create Task</h3>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="modal-form">
          <label>
            Task Name
            <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Describe the task…" />
          </label>
          <label>
            Description
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Optional details…" />
          </label>
          <label>
            Assign Worker
            <select value={workerId} onChange={e => setWorkerId(e.target.value)}>
              <option value="">— unassigned —</option>
              {state.workers.filter(w => w.status !== 'offline').map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.type})</option>
              ))}
            </select>
          </label>
          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={!name.trim()}>Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Tasks() {
  const { state, dispatch, addLog } = useApp();
  const [showModal, setShowModal]   = useState(false);
  const [filter, setFilter]         = useState<TaskStatus | 'all'>('all');
  const { tasks, workers, powered } = state;

  const workerName = (id: string | null) => workers.find(w => w.id === id)?.name ?? 'Unassigned';

  function runTask(t: MCTask) {
    if (!powered) return;
    dispatch({ type: 'UPDATE_TASK', id: t.id, patch: { status: 'running', startedAt: Date.now() } });
    addLog(`Task "${t.name}" started`, 'info', t.workerId, t.id);

    // simulate completion after 3-6s
    const delay = 3000 + Math.random() * 3000;
    setTimeout(() => {
      const success = Math.random() > 0.2;
      dispatch({
        type: 'UPDATE_TASK', id: t.id,
        patch: {
          status: success ? 'complete' : 'failed',
          completedAt: Date.now(),
          output: success ? `Task completed successfully at ${new Date().toLocaleTimeString()}.` : 'Task failed: simulated error.',
        },
      });
      addLog(`Task "${t.name}" ${success ? 'completed' : 'FAILED'}`, success ? 'info' : 'error', t.workerId, t.id);
    }, delay);
  }

  function removeTask(t: MCTask) {
    dispatch({ type: 'REMOVE_TASK', id: t.id });
    addLog(`Task "${t.name}" removed`, 'warn', null, t.id);
  }

  const visible = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
  const counts  = { all: tasks.length, pending: 0, running: 0, complete: 0, failed: 0 };
  tasks.forEach(t => counts[t.status]++);

  return (
    <div className="tab-content">
      <div className="tab-header">
        <div>
          <h2 className="tab-title">Tasks</h2>
          <p className="tab-subtitle">{tasks.length} total · {counts.running} running</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)} disabled={!powered}>
          <Plus size={14} /> New Task
        </button>
      </div>

      {!powered && <div className="warning-banner">System is offline — power on to run tasks.</div>}

      {/* filter tabs */}
      <div className="filter-row">
        {(['all', 'pending', 'running', 'complete', 'failed'] as const).map(f => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'filter-btn-active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : STATUS_LABEL[f]}
            <span className="filter-count">{counts[f]}</span>
          </button>
        ))}
      </div>

      <div className="task-list">
        {visible.length === 0 && (
          <div className="empty-state">No tasks in this category.</div>
        )}
        {visible.map(t => (
          <div key={t.id} className={`task-card task-card-${t.status}`}>
            <div className="task-card-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {STATUS_ICON[t.status]}
                <span className="task-name">{t.name}</span>
                <span className={`badge badge-status-${t.status}`}>{STATUS_LABEL[t.status]}</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {t.status === 'pending' && (
                  <button
                    className="icon-btn icon-btn-start"
                    onClick={() => runTask(t)}
                    disabled={!powered}
                    title="Run task"
                  >
                    <Play size={13} />
                  </button>
                )}
                <button className="icon-btn icon-btn-danger" onClick={() => removeTask(t)} title="Remove">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <div className="task-meta">
              <span>Worker: <b>{workerName(t.workerId)}</b></span>
              <span>Created: {new Date(t.createdAt).toLocaleString()}</span>
            </div>
            {t.description && <p className="task-desc">{t.description}</p>}
            {t.output && (
              <div className="task-output">{t.output}</div>
            )}
          </div>
        ))}
      </div>

      {showModal && <CreateTaskModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
