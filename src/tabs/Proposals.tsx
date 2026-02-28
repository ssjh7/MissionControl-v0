import { useState } from 'react';
import { ClipboardList, Check, X, MessageSquare } from 'lucide-react';
import { useApp } from '../context';
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
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
      background: `${INTENT_COLOR[intent]}22`,
      color: INTENT_COLOR[intent],
      border: `1px solid ${INTENT_COLOR[intent]}55`,
      textTransform: 'uppercase',
      letterSpacing: 1,
    }}>
      {intent}
    </span>
  );
}

function ProposalCard({ proposal }: { proposal: Proposal }) {
  const { dispatch, addLog } = useApp();

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

  const statusColor = isApproved ? '#22c55e' : isRejected ? '#ef4444' : '#f59e0b';
  const statusLabel = isApproved ? 'Approved' : isRejected ? (proposal.replied ? 'Replied & Closed' : 'Rejected') : 'Pending';

  return (
    <div style={{
      borderRadius: 12,
      border: `1px solid ${isPending ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.1)'}`,
      background: 'var(--surface)',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {/* header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <IntentBadge intent={proposal.intent} />
        <span style={{ fontSize: 11, opacity: 0.45, marginLeft: 'auto' }}>
          {new Date(proposal.createdAt).toLocaleString()}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
          background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}44`,
        }}>
          {statusLabel}
        </span>
      </div>

      {/* summary */}
      <div style={{ fontWeight: 700, fontSize: 14 }}>{proposal.summary}</div>

      {/* details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, opacity: 0.75 }}>
        <div><span style={{ opacity: 0.6 }}>Reasoning: </span>{proposal.reasoning}</div>
        <div><span style={{ opacity: 0.6 }}>Suggested action: </span>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{proposal.suggestedAction}</span>
        </div>
        {proposal.requiresApproval && (
          <div style={{ color: '#f59e0b', fontSize: 11 }}>⚠ Requires manual approval before action</div>
        )}
      </div>

      {/* action buttons — only for pending */}
      {isPending && (
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button
            className="btn-primary btn-sm"
            onClick={approve}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <Check size={13} /> Approve
          </button>
          <button
            className="btn-ghost btn-danger btn-sm"
            onClick={reject}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <X size={13} /> Reject
          </button>
          <button
            className="btn-ghost btn-sm"
            onClick={replyAndClose}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <MessageSquare size={13} /> Reply &amp; Close
          </button>
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
            <ClipboardList size={20} /> Proposals
            {pendingCount > 0 && (
              <span style={{
                fontSize: 12, fontWeight: 700, background: '#f59e0b', color: '#000',
                borderRadius: 10, padding: '1px 8px',
              }}>
                {pendingCount}
              </span>
            )}
          </h2>
          <p className="tab-subtitle">Incoming messages classified by AI — approve or reject before any action is taken</p>
        </div>
      </div>

      {/* filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            className={`btn-ghost btn-sm ${filter === f.id ? 'nav-item-active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* proposal list */}
      {filtered.length === 0 ? (
        <div style={{ opacity: 0.5, fontSize: 13, textAlign: 'center', paddingTop: 48 }}>
          {state.proposals.length === 0
            ? 'No proposals yet. Send a WhatsApp message to generate one.'
            : 'No proposals match this filter.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(p => <ProposalCard key={p.id} proposal={p} />)}
        </div>
      )}
    </div>
  );
}
