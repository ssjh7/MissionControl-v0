import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = 'D:\\MissionControl\\data';
const LOGS_DIR = 'D:\\MissionControl\\logs';

const isDev = !app.isPackaged;

// ---------------------------------------------------------------------------
// Filesystem helpers
// ---------------------------------------------------------------------------

function ensureDirs(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

function writeFirstRun(): void {
  const filePath = path.join(LOGS_DIR, 'first-run.txt');
  const content  = `${new Date().toISOString()} — MissionControl v0 started\n`;
  fs.writeFileSync(filePath, content, { encoding: 'utf8' });
}

// ---------------------------------------------------------------------------
// IPC handlers
// ---------------------------------------------------------------------------

ipcMain.handle('mc:open-logs-folder', async () => {
  await shell.openPath(LOGS_DIR);
});

ipcMain.handle('mc:write-log', async (_event, content: string) => {
  const date     = new Date().toISOString().slice(0, 10);
  const filePath = path.join(LOGS_DIR, `session-${date}.txt`);
  fs.appendFileSync(filePath, content + '\n', { encoding: 'utf8' });
  return filePath;
});

ipcMain.handle('mc:export-logs', async (_event, content: string) => {
  const filePath = path.join(LOGS_DIR, `export-${Date.now()}.txt`);
  fs.writeFileSync(filePath, content, { encoding: 'utf8' });
  return filePath;
});

ipcMain.handle('mc:analyze-message', async (
  _event,
  text: string,
  _sourceMessageId: string | number,
  apiKey: string,
) => {
  const FALLBACK = {
    ok: false,
    intent: 'chat',
    summary: text.slice(0, 120),
    reasoning: 'GPT analysis unavailable',
    suggestedAction: 'Review message manually',
    requiresApproval: true,
  };

  if (!apiKey) return FALLBACK;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

  try {
    const body = JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content:
            'You are an intent classifier for MissionControl, a business operations dashboard. ' +
            'Analyse the incoming message and respond with a JSON object containing exactly these keys:\n' +
            '  intent: one of "task"|"query"|"alert"|"trade"|"chat"|"other"\n' +
            '  summary: short one-sentence summary (max 120 chars)\n' +
            '  reasoning: one sentence explaining your classification\n' +
            '  suggestedAction: one concrete action the operator should take\n' +
            '  requiresApproval: true if action has real-world consequences, else false\n' +
            'Respond ONLY with the JSON object.',
        },
        { role: 'user', content: text },
      ],
    });

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body,
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) return FALLBACK;

    const json = await res.json() as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? '';
    const parsed = JSON.parse(raw) as {
      intent?: string; summary?: string; reasoning?: string;
      suggestedAction?: string; requiresApproval?: boolean;
    };

    const VALID_INTENTS = new Set(['task', 'query', 'alert', 'trade', 'chat', 'other']);
    return {
      ok: true,
      intent:           VALID_INTENTS.has(parsed.intent ?? '') ? parsed.intent : 'other',
      summary:          typeof parsed.summary         === 'string' ? parsed.summary.slice(0, 200)         : text.slice(0, 120),
      reasoning:        typeof parsed.reasoning       === 'string' ? parsed.reasoning.slice(0, 300)       : '',
      suggestedAction:  typeof parsed.suggestedAction === 'string' ? parsed.suggestedAction.slice(0, 300) : 'Review message',
      requiresApproval: typeof parsed.requiresApproval === 'boolean' ? parsed.requiresApproval : true,
    };
  } catch {
    clearTimeout(timer);
    return FALLBACK;
  }
});

// ---------------------------------------------------------------------------
// Window
// ---------------------------------------------------------------------------

function createWindow(): void {
  const win = new BrowserWindow({
    width:           1280,
    height:          800,
    minWidth:        900,
    minHeight:       600,
    backgroundColor: '#0f1117',
    title:           'MissionControl v0',
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          false,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5174');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

app.whenReady().then(() => {
  ensureDirs();
  writeFirstRun();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
