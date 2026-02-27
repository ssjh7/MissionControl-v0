import { Power } from 'lucide-react';
import { useApp } from '../context';
import { StatusLight } from '../components/StatusLight';
import type { StatusLevel } from '../types';

// ── hex node geometry ─────────────────────────────────────────────────────────
const CX = 260, CY = 260;

function hexPos(r: number, angleDeg: number, size: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    left: CX + r * Math.cos(rad) - size / 2,
    top:  CY + r * Math.sin(rad) - size / 2,
  };
}

// Generals: 270° = top, 30° = bottom-right, 150° = bottom-left
const GEN_ANGLES  = [270, 30, 150];
// Workers: 9 slots evenly spread, avoiding general angles
const WORK_ANGLES = [250, 290, 330, 10, 50, 90, 130, 170, 210];

const STATUS_COLOR: Record<StatusLevel, string> = {
  active:  '#22c55e',
  idle:    '#eab308',
  offline: '#ef4444',
};

// ── sub-components ────────────────────────────────────────────────────────────
function HexNode({
  label, emoji, sublabel, status, size, style, onClick,
}: {
  label: string; emoji?: string; sublabel?: string;
  status: StatusLevel; size: number;
  style?: React.CSSProperties; onClick?: () => void;
}) {
  const color = STATUS_COLOR[status];
  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        width: size,
        height: size,
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        background: `linear-gradient(135deg, #1c1c2e 0%, #141420 100%)`,
        border: 'none',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        outline: `2px solid ${color}55`,
        outlineOffset: -2,
        transition: 'outline-color .2s, filter .2s',
        filter: status === 'offline' ? 'brightness(0.5)' : undefined,
        ...style,
      }}
      title={`${label} — ${status}`}
    >
      {emoji && <span style={{ fontSize: size * 0.22, lineHeight: 1 }}>{emoji}</span>}
      <span style={{ fontSize: Math.max(8, size * 0.13), color: '#e2e8f0', fontWeight: 600, letterSpacing: 0.3, lineHeight: 1 }}>
        {label}
      </span>
      {sublabel && (
        <span style={{ fontSize: Math.max(7, size * 0.1), color: '#64748b', lineHeight: 1 }}>
          {sublabel}
        </span>
      )}
      <span style={{
        position: 'absolute', bottom: size * 0.14, right: size * 0.2,
        width: 8, height: 8, borderRadius: '50%',
        background: color, boxShadow: status !== 'offline' ? `0 0 5px ${color}` : undefined,
      }} />
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export function Dashboard() {
  const { state, dispatch, addLog } = useApp();
  const { powered, generals, workers, tasks } = state;

  const activeWorkers  = workers.filter(w => w.status === 'active').length;
  const idleWorkers    = workers.filter(w => w.status === 'idle').length;
  const offlineWorkers = workers.filter(w => w.status === 'offline').length;
  const runningTasks   = tasks.filter(t => t.status === 'running').length;
  const pendingTasks   = tasks.filter(t => t.status === 'pending').length;

  function togglePower() {
    const next = !powered;
    dispatch({ type: 'TOGGLE_POWER' });
    addLog(next ? 'Master power switched ON' : 'Master power switched OFF', next ? 'info' : 'warn');
  }

  return (
    <div className="tab-content">
      {/* ── header row ── */}
      <div className="tab-header">
        <div>
          <h2 className="tab-title">Dashboard</h2>
          <p className="tab-subtitle">Hive overview — real-time agent status</p>
        </div>
        {/* master power toggle */}
        <button
          onClick={togglePower}
          className={`power-btn ${powered ? 'power-btn-on' : 'power-btn-off'}`}
        >
          <Power size={18} />
          <span>{powered ? 'POWER ON' : 'POWER OFF'}</span>
        </button>
      </div>

      {/* ── stat pills ── */}
      <div className="stat-row">
        {[
          { label: 'Active',   value: activeWorkers,  color: '#22c55e' },
          { label: 'Idle',     value: idleWorkers,    color: '#eab308' },
          { label: 'Offline',  value: offlineWorkers, color: '#ef4444' },
          { label: 'Running',  value: runningTasks,   color: '#3b82f6' },
          { label: 'Queued',   value: pendingTasks,   color: '#a855f7' },
        ].map(s => (
          <div key={s.label} className="stat-pill">
            <span style={{ color: s.color, fontWeight: 700, fontSize: 22 }}>{s.value}</span>
            <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── beehive canvas ── */}
      <div className="hive-wrap">
        {!powered && (
          <div className="hive-offline-overlay">
            <Power size={40} style={{ color: '#ef4444' }} />
            <span>SYSTEM OFFLINE</span>
          </div>
        )}

        <div className="hive-canvas">
          {/* connecting lines — drawn with SVG behind the hex nodes */}
          <svg
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            width={520} height={520}
          >
            {/* queen → generals */}
            {GEN_ANGLES.map((a, i) => {
              const gp = hexPos(115, a, 64);
              return (
                <line key={`qg-${i}`}
                  x1={CX} y1={CY}
                  x2={gp.left + 32} y2={gp.top + 32}
                  stroke={powered ? '#f59e0b44' : '#33333388'} strokeWidth={1.5} strokeDasharray="4 4"
                />
              );
            })}
            {/* generals → workers */}
            {workers.slice(0, 9).map((w, wi) => {
              const wp = hexPos(205, WORK_ANGLES[wi], 50);
              const gi = generals.findIndex(g => g.id === w.generalId);
              const ga = gi >= 0 ? GEN_ANGLES[gi] : GEN_ANGLES[0];
              const gp = hexPos(115, ga, 64);
              return (
                <line key={`gw-${wi}`}
                  x1={gp.left + 32} y1={gp.top + 32}
                  x2={wp.left + 25} y2={wp.top + 25}
                  stroke={powered ? '#3b82f622' : '#22222255'} strokeWidth={1} strokeDasharray="3 5"
                />
              );
            })}
          </svg>

          {/* ── Queen ── */}
          <HexNode
            label="Queen"
            emoji="👸"
            sublabel="Coordinator"
            status={powered ? 'active' : 'offline'}
            size={90}
            style={{ left: CX - 45, top: CY - 45, zIndex: 10 }}
          />

          {/* ── Generals ── */}
          {generals.map((gen, i) => {
            const pos = hexPos(115, GEN_ANGLES[i], 64);
            return (
              <HexNode
                key={gen.id}
                label={gen.name.replace('General ', 'Gen.')}
                emoji="⚡"
                status={powered ? gen.status : 'offline'}
                size={64}
                style={{ ...pos, zIndex: 8 }}
              />
            );
          })}

          {/* ── Workers ── */}
          {workers.slice(0, 9).map((w, wi) => {
            const pos = hexPos(205, WORK_ANGLES[wi], 50);
            return (
              <HexNode
                key={w.id}
                label={w.name}
                sublabel={w.type}
                status={powered ? w.status : 'offline'}
                size={50}
                style={{ ...pos, zIndex: 6 }}
              />
            );
          })}
        </div>

        {/* legend */}
        <div className="hive-legend">
          {(['active', 'idle', 'offline'] as StatusLevel[]).map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <StatusLight status={s} size={9} />
              <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
