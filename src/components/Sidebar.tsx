import { LayoutDashboard, Users, ListChecks, ScrollText, Plug, ClipboardList, Settings, Zap } from 'lucide-react';
import type { Tab } from '../types';
import { useApp } from '../context';

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  powered: boolean;
}

const NAV: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: 'dashboard',   label: 'Dashboard',   Icon: LayoutDashboard },
  { id: 'workers',     label: 'Workers',     Icon: Users           },
  { id: 'tasks',       label: 'Tasks',       Icon: ListChecks      },
  { id: 'logs',        label: 'Logs',        Icon: ScrollText      },
  { id: 'connections', label: 'Connections', Icon: Plug            },
  { id: 'proposals',   label: 'Proposals',   Icon: ClipboardList   },
  { id: 'settings',    label: 'Settings',    Icon: Settings        },
];

export function Sidebar({ activeTab, onTabChange, powered }: Props) {
  const { state } = useApp();
  const pendingCount = state.proposals.filter(p => p.approved === null && !p.replied).length;

  return (
    <aside className="sidebar">
      {/* logo / brand */}
      <div className="sidebar-brand">
        <Zap size={20} style={{ color: 'var(--accent)' }} />
        <span className="sidebar-brand-text">MissionControl</span>
        <span className="sidebar-version">v0</span>
      </div>

      {/* power indicator strip */}
      <div className={`sidebar-power-strip ${powered ? 'powered-on' : 'powered-off'}`}>
        <span className="power-dot" />
        <span>{powered ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}</span>
      </div>

      {/* nav items */}
      <nav className="sidebar-nav">
        {NAV.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`nav-item ${activeTab === id ? 'nav-item-active' : ''}`}
            onClick={() => onTabChange(id)}
          >
            <Icon size={16} />
            <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
            {id === 'proposals' && pendingCount > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 700, background: '#f59e0b', color: '#000',
                borderRadius: 8, padding: '0 5px', lineHeight: '16px',
              }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>OpenClaw OS · 2026</span>
      </div>
    </aside>
  );
}
