import { useState } from 'react';
import { ClipboardList, Check, X, MessageSquare } from 'lucide-react';
import { useApp } from '../context';
import { Button } from '../components/Button';
import type { Proposal, ProposalIntent } from '../types';

type Filter = 'pending' | 'approved' | 'rejected' | 'all';

const INTENT_COLOR: Record<ProposalIntent, string> = {
  task:  '#6366f1',
  query: '#0ea5e9',
  alert: '#f59e0b',
  trade: '#10b981',
  chat:  '#64748b',
  other: '#94a3b8',
};

function IntentBadge({ intent }: { intent: ProposalIntent }) {
  const c = INTENT_COLOR[intent];
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 9999,
      background: `${c}18`, color: c, border: `1px solid ${c}44`,
      textTransform: 'uppercase', letterSpacing: 1.2,
    }}>
      {intent}
    </span>
  );
}

function ProposalCard({ proposal }: { proposal: Proposal }) {
  const { dispatch, addLog } = useApp();
  const [hovered, setHovered] = useState(false);

  function approve() {
    dispatch({ type: 'UPDATE_PROPOSAL', id: proposal.id, patch: { approved: true } });
    addLog(`[Proposals] Approved: ${proposal.summary}`, 'info');
  }
  function reject() {
    dispatch({ type: 'UPDATE_PROPOSAL', id: proposal.id, patch: { approved: false } });
    addLog(`[Proposals] Rejected: ${proposal.summary}`, 'warn');
  }
  function replyAndClose() {
    dispatch({ type: 'UPDATE_PROPOSAL', id: proposal.id, patch: { replied: true, approved: false } });
    addLog(`[Proposals] Marked replied & closed: ${proposal.summary}`, 'info');
  }

  const isPending  = proposal.approved === null && !proposal.replied;
  const isApproved = proposal.approved === true;
  const isRejected = proposal.approved === false || proposal.replied;

  const statusColor = isApproved ? '#10b981' : isRejected ? '#ef4444' : '#f59e0b';
  const statusLabel = isApproved ? 'Approved' : isRejected ? (proposal.replied ? 'Replied & Closed' : 'Rejected') : 'Pending';
  const intentColor = INTENT_COLOR[proposal.intent];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: `1px solid ${isPending ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 14,
        padding: '14px 18px 14px 22px',
        display: 'flex', flexDirection: 'column', gap: 10,
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? '0 8px 28px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
      }}
    >
      {/* intent color bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        borderRadius: '14px 0 0 14px',
        background: intentColor,
        boxShadow: `0 0 12px ${intentColor}66`,
      }} />

      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <IntentBadge intent={proposal.intent} />
        <span style={{ fontSize: 11, color: '#374151', marginLeft: 'auto' }}>
          {new Date(proposal.createdAt).toLocaleString()}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 9999,
          background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}33`,
        }}>
          {statusLabel}
        </span>
      </div>

      {/* summary */}
      <div style={{ fontWeight: 600, fontSize: 14, color: '#f1f5f9', lineHeight: 1.4 }}>
        {proposal.summary}
      </div>

      {/* details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, color: '#64748b' }}>
        <div>
          <span style={{ color: '#374151' }}>Reasoning — </span>
          {proposal.reasoning}
        </div>
        <div>
          <span style={{ color: '#374151' }}>Suggested action — </span>
          <span style={{ color: '#f59e0b', fontWeight: 600 }}>{proposal.suggestedAction}</span>
        </div>
        {proposal.requiresApproval && (
          <div style={{ color: '#92400e', fontSize: 11, marginTop: 2 }}>
            ⚠ Manual approval required before any action is taken
          </div>
        )}
      </div>

      {/* action buttons — pending only */}
      {isPending && (
        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
          <Button variant="success" size="sm" onClick={approve}>
            <Check size={12} /> Approve
          </Button>
          <Button variant="danger" size="sm" onClick={reject}>
            <X size={12} /> Reject
          </Button>
          <Button variant="ghost" size="sm" onClick={replyAndClose}>
            <MessageSquare size={12} /> Reply &amp; Close
          </Button>
        </div>
      )}
    </div>
  );
}

export function Proposals() {
  const { state } = useApp();
  const [filter, setFilter] = useState<Filter>('pending');

  const filtered = state.proposals.filter(p => {
    if (filter === 'all')      return true;
    if (filter === 'pending')  return p.approved === null && !p.replied;
    if (filter === 'approved') return p.approved === true;
    if (filter === 'rejected') return p.approved === false || p.replied;
    return true;
  });

  const pendingCount = state.proposals.filter(p => p.approved === null && !p.replied).length;

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'pending',  label: `Pending (${pendingCount})` },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'all',      label: `All (${state.proposals.length})` },
  ];

  return (
    <div className="tab-content">
      <div className="tab-header">
        <div>
          <h2 className="tab-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ClipboardList size={20} />
            Proposals
            {pendingCount > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: 'rgba(245,158,11,0.2)', color: '#f59e0b',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 9999, padding: '1px 9px',
              }}>
                {pendingCount}
              </span>
            )}
          </h2>
          <p className="tab-subtitle">AI-classified incoming messages — approve or reject before any action</p>
        </div>
      </div>

      {/* filter bar */}
      <div style={{ display: 'flex', gap: 8 }}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            className={`filter-btn ${filter === f.id ? 'filter-btn-active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* proposal list */}
      {filtered.length === 0 ? (
        <div style={{ opacity: 0.4, fontSize: 13, textAlign: 'center', paddingTop: 60 }}>
          {state.proposals.length === 0
            ? 'No proposals yet — send a WhatsApp message to generate one.'
            : 'No proposals match this filter.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(p => <ProposalCard key={p.id} proposal={p} />)}
        </div>
      )}
    </div>
  );
}
