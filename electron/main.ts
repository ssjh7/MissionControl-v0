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
