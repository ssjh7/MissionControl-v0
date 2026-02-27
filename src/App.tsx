import { AppProvider, useApp } from './context';
import { Sidebar } from './components/Sidebar';
import { Dashboard }   from './tabs/Dashboard';
import { Workers }     from './tabs/Workers';
import { Tasks }       from './tabs/Tasks';
import { Logs }        from './tabs/Logs';
import { Connections } from './tabs/Connections';
import { Settings }    from './tabs/Settings';
import './App.css';

function Shell() {
  const { state, dispatch } = useApp();
  const { activeTab, powered } = state;

  const tab = activeTab;

  return (
    <div className="app-layout">
      <Sidebar
        activeTab={tab}
        onTabChange={t => dispatch({ type: 'SET_TAB', tab: t })}
        powered={powered}
      />
      <main className="main-area">
        {tab === 'dashboard'   && <Dashboard />}
        {tab === 'workers'     && <Workers />}
        {tab === 'tasks'       && <Tasks />}
        {tab === 'logs'        && <Logs />}
        {tab === 'connections' && <Connections />}
        {tab === 'settings'    && <Settings />}
      </main>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}

export default App;
