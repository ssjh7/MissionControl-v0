import { LayoutDashboard, Users, ListChecks, ScrollText, Plug, Settings, Zap } from 'lucide-react';
import type { Tab } from '../types';

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
  { id: 'settings',    label: 'Settings',    Icon: Settings        },
];

export function Sidebar({ activeTab, onTabChange, powered }: Props) {
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
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>OpenClaw OS · 2026</span>
      </div>
    </aside>
  );
}
