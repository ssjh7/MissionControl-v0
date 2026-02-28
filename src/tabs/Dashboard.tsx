import { Power, Wifi, Cpu, ClipboardList, Users } from 'lucide-react';
import { useApp } from '../context';
import { StatusLight } from '../components/StatusLight';
import type { StatusLevel } from '../types';

// ── hex node geometry ──────────────────────────────────────────────────────
const CX = 260, CY = 260;

function hexPos(r: number, angleDeg: number, size: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    left: CX + r * Math.cos(rad) - size / 2,
    top:  CY + r * Math.sin(rad) - size / 2,
  };
}

const GEN_ANGLES  = [270, 30, 150];
const WORK_ANGLES = [250, 290, 330, 10, 50, 90, 130, 170, 210];

const STATUS_COLOR: Record<StatusLevel, string> = {
  active:  '#10b981',
  idle:    '#f59e0b',
  offline: '#ef4444',
};

// ── hex node ───────────────────────────────────────────────────────────────
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
        width: size, height: size,
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 2,
        outline: `2px solid ${color}55`,
        outlineOffset: -2,
        transition: 'outline-color .2s, filter .2s',
        filter: status === 'offline' ? 'brightness(0.45)' : undefined,
        ...style,
      }}
      title={`${label} — ${status}`}
    >
      {emoji && <span style={{ fontSize: size * 0.22, lineHeight: 1 }}>{emoji}</span>}
      <span style={{ fontSize: Math.max(8, size * 0.13), color: '#f1f5f9', fontWeight: 600, letterSpacing: 0.3, lineHeight: 1 }}>
        {label}
      </span>
      {sublabel && (
        <span style={{ fontSize: Math.max(7, size * 0.1), color: '#4b5563', lineHeight: 1 }}>
          {sublabel}
        </span>
      )}
      <span style={{
        position: 'absolute', bottom: size * 0.14, right: size * 0.2,
        width: 7, height: 7, borderRadius: '50%',
        background: color, boxShadow: status !== 'offline' ? `0 0 5px ${color}` : undefined,
      }} />
    </div>
  );
}

// ── metric card ────────────────────────────────────────────────────────────
function MetricCard({
  icon, value, label, color, subtext,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
  subtext?: string;
}) {
  return (
    <div className="metric-card">
      <div className="metric-icon" style={{ color }}>{icon}</div>
      <div className="metric-value" style={{ color }}>{value}</div>
      <div className="metric-label">{label}</div>
      {subtext && <div style={{ fontSize: 10, color: '#374151', marginTop: 1 }}>{subtext}</div>}
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────
export function Dashboard() {
  const { state, dispatch, addLog } = useApp();
  const { powered, generals, workers, tasks, proposals, openaiKey, ingressUrl } = state;

  const activeWorkers  = workers.filter(w => w.status === 'active').length;
  const pendingCount   = proposals.filter(p => p.approved === null && !p.replied).length;
  const runningTasks   = tasks.filter(t => t.status === 'running').length;
  const pendingTasks   = tasks.filter(t => t.status === 'pending').length;

  const waConnected  = !!ingressUrl;
  const aiReady      = !!openaiKey;

  function togglePower() {
    const next = !powered;
    dispatch({ type: 'TOGGLE_POWER' });
    addLog(next ? 'Master power switched ON' : 'Master power switched OFF', next ? 'info' : 'warn');
  }

  return (
    <div className="tab-content">
      {/* ── header ── */}
      <div className="tab-header">
        <div>
          <h2 className="tab-title">Dashboard</h2>
          <p className="tab-subtitle">Hive overview — real-time agent status</p>
        </div>
        <button
          onClick={togglePower}
          className={`power-btn ${powered ? 'power-btn-on' : 'power-btn-off'}`}
        >
          <Power size={16} />
          <span>{powered ? 'POWER ON' : 'POWER OFF'}</span>
        </button>
      </div>

      {/* ── metric cards ── */}
      <div className="metric-grid">
        <MetricCard
          icon={<Wifi size={18} />}
          value={waConnected ? 'Live' : 'Off'}
          label="WhatsApp Ingress"
          color={waConnected ? '#10b981' : '#ef4444'}
          subtext={waConnected ? ingressUrl.replace('http://', '') : 'not configured'}
        />
        <MetricCard
          icon={<Cpu size={18} />}
          value={aiReady ? 'Ready' : 'No Key'}
          label="OpenAI Brain"
          color={aiReady ? '#7c3aed' : '#ef4444'}
          subtext={aiReady ? 'GPT-4o-mini active' : 'set key in Connections'}
        />
        <MetricCard
          icon={<ClipboardList size={18} />}
          value={pendingCount}
          label="Pending Proposals"
          color={pendingCount > 0 ? '#f59e0b' : '#10b981'}
          subtext={pendingCount > 0 ? 'awaiting review' : 'all reviewed'}
        />
        <MetricCard
          icon={<Users size={18} />}
          value={`${activeWorkers}/${workers.length}`}
          label="Worker Status"
          color={activeWorkers > 0 ? '#10b981' : '#4b5563'}
          subtext={`${runningTasks} running · ${pendingTasks} queued`}
        />
      </div>

      {/* ── beehive ── */}
      <div className="hive-wrap">
        {!powered && (
          <div className="hive-offline-overlay">
            <Power size={36} style={{ color: '#ef4444' }} />
            <span>SYSTEM OFFLINE</span>
          </div>
        )}

        <div className="hive-canvas">
          <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} width={520} height={520}>
            {GEN_ANGLES.map((a, i) => {
              const gp = hexPos(115, a, 64);
              return (
                <line key={`qg-${i}`}
                  x1={CX} y1={CY}
                  x2={gp.left + 32} y2={gp.top + 32}
                  stroke={powered ? 'rgba(245,158,11,0.3)' : 'rgba(51,51,51,0.5)'}
                  strokeWidth={1.5} strokeDasharray="4 4"
                />
              );
            })}
            {workers.slice(0, 9).map((w, wi) => {
              const wp = hexPos(205, WORK_ANGLES[wi], 50);
              const gi = generals.findIndex(g => g.id === w.generalId);
              const ga = gi >= 0 ? GEN_ANGLES[gi] : GEN_ANGLES[0];
              const gp = hexPos(115, ga, 64);
              return (
                <line key={`gw-${wi}`}
                  x1={gp.left + 32} y1={gp.top + 32}
                  x2={wp.left + 25} y2={wp.top + 25}
                  stroke={powered ? 'rgba(14,165,233,0.18)' : 'rgba(34,34,34,0.4)'}
                  strokeWidth={1} strokeDasharray="3 5"
                />
              );
            })}
          </svg>

          <HexNode
            label="Queen" emoji="👸" sublabel="Coordinator"
            status={powered ? 'active' : 'offline'}
            size={90}
            style={{ left: CX - 45, top: CY - 45, zIndex: 10 }}
          />

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

        <div className="hive-legend">
          {(['active', 'idle', 'offline'] as StatusLevel[]).map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <StatusLight status={s} size={8} />
              <span style={{ color: '#64748b', textTransform: 'capitalize' }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
