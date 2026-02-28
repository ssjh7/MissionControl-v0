import { useApp, uid } from '../context';
import type { Proposal, ProposalIntent } from '../types';
import type { InboxItem } from '../lib/whatsappInbox';

const VALID_INTENTS = new Set<ProposalIntent>(['task', 'query', 'alert', 'trade', 'chat', 'other']);

function toIntent(raw: string | undefined): ProposalIntent {
  return VALID_INTENTS.has(raw as ProposalIntent) ? (raw as ProposalIntent) : 'other';
}

export function useProposalEngine() {
  const { dispatch, addLog, getOpenaiKey } = useApp();

  async function analyzeAndPropose(item: InboxItem) {
    const apiKey = getOpenaiKey();

    // Build fallback proposal in case GPT is unavailable
    let resolved = {
      intent:          'chat' as ProposalIntent,
      summary:         item.text.slice(0, 120),
      reasoning:       'No OpenAI key set — classified as chat by default',
      suggestedAction: 'Review message manually',
      requiresApproval: true,
    };

    if (apiKey && window.mc) {
      try {
        const res = await window.mc.analyzeMessage(item.text, item.id, apiKey);
        resolved = {
          intent:          toIntent(res.intent),
          summary:         res.summary,
          reasoning:       res.reasoning,
          suggestedAction: res.suggestedAction,
          requiresApproval: res.requiresApproval,
        };
      } catch (e) {
        addLog(
          `[Proposals] analyzeMessage threw: ${e instanceof Error ? e.message : String(e)}`,
          'warn',
        );
      }
    } else if (!apiKey) {
      addLog('[Proposals] Skipped GPT analysis — no OpenAI key configured', 'warn');
    }

    const proposal: Proposal = {
      id:              uid(),
      sourceMessageId: item.id,
      intent:          resolved.intent,
      summary:         resolved.summary,
      reasoning:       resolved.reasoning,
      suggestedAction: resolved.suggestedAction,
      requiresApproval: resolved.requiresApproval,
      approved:        null,
      replied:         false,
      createdAt:       Date.now(),
    };

    dispatch({ type: 'ADD_PROPOSAL', proposal });
    addLog(`[Proposals] Created — intent:${proposal.intent} — ${proposal.summary}`, 'info');
  }

  return { analyzeAndPropose };
}
