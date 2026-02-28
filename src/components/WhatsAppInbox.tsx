import React from "react";
import { connectInboxSSE, fetchInbox, prependCapped } from "../lib/whatsappInbox";
import type { InboxItem } from "../lib/whatsappInbox";

const BASE_URL = "http://localhost:3001";

function formatTime(ts: number) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

export default function WhatsAppInbox() {
  const [items, setItems] = React.useState<InboxItem[]>([]);
  const [status, setStatus] = React.useState<"connecting" | "open" | "closed" | "error">("connecting");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cleanup: (() => void) | null = null;
    let alive = true;

    (async () => {
      try {
        const initial = await fetchInbox(BASE_URL);
        if (!alive) return;
        setItems(initial.slice(0, 200));
      } catch (e: any) {
        setError(e?.message ?? "Failed to load inbox");
      }

      cleanup = connectInboxSSE(
        BASE_URL,
        (snapshot) => setItems(snapshot),
        (item) => setItems((prev) => prependCapped(prev, item)),
        (s) => setStatus(s)
      );
    })();

    return () => {
      alive = false;
      cleanup?.();
    };
  }, []);

  const dot =
    status === "open" ? "🟢" :
    status === "connecting" ? "🟡" :
    status === "error" ? "🔴" : "⚪";

  return (
    <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>WhatsApp Inbox</div>
        <div style={{ fontSize: 12, opacity: 0.85 }}>{dot} {status}</div>
      </div>

      {error && (
        <div style={{ marginBottom: 8, color: "salmon", fontSize: 12 }}>
          {error}
        </div>
      )}

      <div style={{ maxHeight: 420, overflow: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        {items.length === 0 ? (
          <div style={{ opacity: 0.7, fontSize: 12 }}>No messages yet.</div>
        ) : (
          items.map((m) => (
            <div
              key={String(m.id)}
              style={{ padding: 10, borderRadius: 10, background: "rgba(255,255,255,0.06)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  {m.name ?? m.from ?? "unknown"}
                </div>
                <div style={{ fontSize: 11, opacity: 0.75 }}>
                  {formatTime(m.timestamp)}
                </div>
              </div>
              <div style={{ marginTop: 6, fontSize: 13, whiteSpace: "pre-wrap" }}>
                {m.text}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
