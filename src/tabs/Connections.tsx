import { useState } from 'react';
import { Eye, EyeOff, Zap, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useApp } from '../context';

type TestState = 'idle' | 'testing' | 'ok' | 'fail';

function ConnectionCard({
  name, logo, description, children, status,
}: {
  name: string; logo: string; description: string;
  children?: React.ReactNode; status?: 'connected' | 'disconnected' | 'placeholder';
}) {
  const stColor = status === 'connected' ? '#22c55e' : status === 'disconnected' ? '#ef4444' : '#475569';
  const stLabel = status === 'connected' ? 'Connected' : status === 'disconnected' ? 'Disconnected' : 'Coming soon';
  return (
    <div className="conn-card">
      <div className="conn-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>{logo}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{name}</div>
            <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>{description}</div>
          </div>
        </div>
        <span style={{ fontSize: 12, color: stColor, fontWeight: 600, border: `1px solid ${stColor}44`, borderRadius: 6, padding: '2px 8px' }}>
          {stLabel}
        </span>
      </div>
      {children && <div className="conn-card-body">{children}</div>}
    </div>
  );
}

export function Connections() {
  const { state, dispatch, addLog, getOpenaiKey } = useApp();
  const [rawKey,    setRawKey]   = useState(() => getOpenaiKey());
  const [showKey,   setShowKey]  = useState(false);
  const [testState, setTest]     = useState<TestState>('idle');

  function saveKey() {
    dispatch({ type: 'SET_OPENAI_KEY', raw: rawKey });
    addLog('OpenAI API key updated', 'info');
  }

  function testConnection() {
    if (!rawKey.trim()) return;
    setTest('testing');
    addLog('Testing OpenAI connection…', 'info');
    setTimeout(() => {
      const ok = rawKey.startsWith('sk-');
      setTest(ok ? 'ok' : 'fail');
      addLog(ok ? 'OpenAI connection test: OK (simulated)' : 'OpenAI connection test: FAILED — key format invalid', ok ? 'info' : 'error');
      setTimeout(() => setTest('idle'), 3000);
    }, 1500);
  }

  const testIcon = {
    idle:    <Zap size={14} />,
    testing: <Clock size={14} className="spin" />,
    ok:      <CheckCircle size={14} color="#22c55e" />,
    fail:    <XCircle size={14} color="#ef4444" />,
  }[testState];

  const testLabel = { idle: 'Test', testing: 'Testing…', ok: 'Success', fail: 'Failed' }[testState];
  const keyStatus = state.openaiKey ? 'connected' : 'disconnected';

  return (
    <div className="tab-content">
      <div className="tab-header">
        <div>
          <h2 className="tab-title">Connections</h2>
          <p className="tab-subtitle">API keys, integrations, and external services</p>
        </div>
      </div>

      <div className="conn-grid">

        {/* ── OpenAI ── */}
        <ConnectionCard
          name="OpenAI"
          logo="🤖"
          description="GPT-4 / o1 — AI reasoning engine"
          status={keyStatus}
        >
          <div className="key-row">
            <div className="key-input-wrap">
              <input
                type={showKey ? 'text' : 'password'}
                value={rawKey}
                onChange={e => setRawKey(e.target.value)}
                placeholder="sk-…"
                className="key-input"
              />
              <button className="icon-btn" onClick={() => setShowKey(v => !v)} title={showKey ? 'Hide' : 'Show'}>
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <button className="btn-primary btn-sm" onClick={saveKey} disabled={!rawKey.trim()}>
              Save
            </button>
            <button
              className={`btn-ghost btn-sm ${testState === 'ok' ? 'btn-success' : testState === 'fail' ? 'btn-danger' : ''}`}
              onClick={testConnection}
              disabled={!rawKey.trim() || testState === 'testing'}
            >
              {testIcon} {testLabel}
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-dim)', margin: '6px 0 0' }}>
            Key is stored locally (base64 obfuscated). Never sent to any server.
          </p>
        </ConnectionCard>

        {/* ── Suntra ── */}
        <ConnectionCard name="Suntra" logo="🌞" description="Suntra trading integration" status="placeholder">
          <div className="placeholder-msg">
            Integration coming soon. Will connect to Suntra API for automated trade signals.
          </div>
        </ConnectionCard>

        {/* ── WhatsApp ── */}
        <ConnectionCard name="WhatsApp" logo="💬" description="Messaging & notifications via WhatsApp Business API" status="placeholder">
          <div className="placeholder-msg">
            Integration coming soon. Workers will be able to send status updates via WhatsApp.
          </div>
        </ConnectionCard>

        {/* ── CoinSpot ── */}
        <ConnectionCard name="CoinSpot" logo="🪙" description="CoinSpot exchange API for crypto trading" status="placeholder">
          <div className="placeholder-msg">
            Integration coming soon. Connect your CoinSpot API key to enable automated trading.
          </div>
        </ConnectionCard>

        {/* ── Wizard ── */}
        <ConnectionCard name="Wizard" logo="🧙" description="Wizard orchestration platform" status="placeholder">
          <div className="placeholder-msg">
            Integration coming soon. Wizard will allow multi-step agent orchestration workflows.
          </div>
        </ConnectionCard>

      </div>
    </div>
  );
}
