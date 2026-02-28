export type InboxItem = {
  id: string | number;
  source: "whatsapp";
  from: string | null;
  name: string | null;
  text: string;
  timestamp: number;
  raw?: any;
};

const MAX_ITEMS = 200;

export async function fetchInbox(baseUrl: string): Promise<InboxItem[]> {
  const res = await fetch(`${baseUrl}/api/inbox`);
  if (!res.ok) throw new Error(`Inbox fetch failed: ${res.status}`);
  const json = await res.json();
  return Array.isArray(json?.items) ? json.items : [];
}

export function connectInboxSSE(
  baseUrl: string,
  onSnapshot: (items: InboxItem[]) => void,
  onItem: (item: InboxItem) => void,
  onStatus?: (status: "connecting" | "open" | "closed" | "error") => void
) {
  let es: EventSource | null = null;

  const open = () => {
    onStatus?.("connecting");
    es = new EventSource(`${baseUrl}/api/inbox/stream`);

    es.addEventListener("hello", () => onStatus?.("open"));

    es.addEventListener("snapshot", (ev) => {
      try {
        const items = JSON.parse((ev as MessageEvent).data);
        if (Array.isArray(items)) onSnapshot(items.slice(0, MAX_ITEMS));
      } catch {}
    });

    es.onmessage = (ev) => {
      try {
        const item = JSON.parse(ev.data);
        if (item) onItem(item);
      } catch {}
    };

    es.onerror = () => onStatus?.("error"); // browser auto-retries
  };

  open();

  return () => {
    onStatus?.("closed");
    es?.close();
    es = null;
  };
}

export function prependCapped(list: InboxItem[], item: InboxItem) {
  const next = [item, ...list];
  if (next.length > MAX_ITEMS) next.length = MAX_ITEMS;
  return next;
}
