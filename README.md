# MissionControl v0 — Local Desktop AI Control Center

A local-first Electron + React desktop application for managing AI workers, tasks, logs, and connections. Runs entirely on your machine — no cloud dependency, no remote server required.

---

## Overview

MissionControl is a Windows desktop app that provides a unified control surface for orchestrating AI agents and workers. The UI is built with React 19 + TypeScript, wrapped in an Electron shell that bridges the renderer to the local filesystem. All data lives under `D:\MissionControl\` — your machine, your data.

---

## Features

- **Beehive Dashboard** — Visual hex layout with Queen node at center, Generals at the first ring, and Workers at the outer ring. SVG connection lines show the hierarchy at a glance.
- **Worker Management** — Add, configure, and monitor workers. Toggle master power to bring the hive online or offline.
- **Task Queue** — Assign tasks to workers, track status, and simulate execution with success/failure reporting.
- **Logs Viewer** — Real-time log stream with filtering by worker, level (info / warn / error), and task. Exports to a real file on disk via the Electron bridge.
- **Local Filesystem Storage** — All logs and data write to `D:\MissionControl\logs` and `D:\MissionControl\data`. Directories are created automatically on first launch.
- **Secure Electron Bridge** — Preload script exposes a typed `window.mc` API via `contextBridge`. `contextIsolation` is enabled; no remote module; no `nodeIntegration`.
- **Connections Tab** — Placeholder for future service integrations.
- **Settings Tab** — OpenAI key storage (base64-obfuscated in localStorage), first-run detection.

---

## Requirements

| Dependency | Version |
|---|---|
| Node.js | 20+ |
| pnpm | any recent version |
| OS | Windows (current target) |

---

## Setup

```bash
cd D:\MissionControl\app\v0
pnpm install --ignore-workspace
```

> **Important:** The `--ignore-workspace` flag is required. This project lives inside a pnpm workspace (the parent Tauri project) but is not a declared workspace member. Without this flag, pnpm delegates to the workspace root and skips installing v0's dependencies — including the Electron binary.

---

## Running

### Browser mode (Vite only)

```bash
pnpm dev
```

Opens the React UI at `http://localhost:5174`. The `window.mc` bridge is not available in this mode — filesystem features fall back to browser behaviour (blob download for log export).

### Desktop app (Electron)

```bash
pnpm electron:dev
```

Starts Vite on `:5174`, waits for it to be ready, compiles the Electron main/preload TypeScript, then launches the desktop window with DevTools open.

On first launch the main process will:
- Create `D:\MissionControl\data\` and `D:\MissionControl\logs\` if they don't exist
- Write `D:\MissionControl\logs\first-run.txt` with a startup timestamp

---

## Logs

All logs are written to:

```
D:\MissionControl\logs\
  first-run.txt               ← written on every startup
  export-<timestamp>.txt      ← written when you click Export in the Logs tab
```

Click **Open Folder** in the Logs tab to open the directory in Explorer directly from the app.

---

## Project Structure

```
v0/
├── electron/
│   ├── main.ts          # Main process: window, IPC handlers, filesystem
│   └── preload.ts       # contextBridge: exposes window.mc to renderer
├── src/
│   ├── tabs/            # Dashboard, Workers, Tasks, Logs, Connections, Settings
│   ├── components/      # Sidebar, StatusLight
│   ├── types/
│   │   └── electron.d.ts  # Window.mc type declarations
│   ├── context.tsx      # Global state via useReducer
│   └── types.ts         # Shared TypeScript types
├── tsconfig.electron.json   # Compiles electron/ → dist-electron/ (CommonJS)
└── package.json
```

---

## Troubleshooting

**Port 5174 already in use**
Another Vite process is running. Kill it:
```bash
netstat -ano | findstr :5174
taskkill /PID <pid> /F
```
Then re-run `pnpm electron:dev`.

**`ELIFECYCLE` error when closing the window**
This is normal if you see it from an older version. The current build uses `--success first` on concurrently, so closing the Electron window exits cleanly with code 0. If you still see it, make sure your `package.json` has `--success first` in the `electron:dev` script.

**Electron binary missing after install**
If you get `Error: Electron failed to install correctly`, the binary was not downloaded. Re-run:
```bash
pnpm install --ignore-workspace
```
The `pnpm.onlyBuiltDependencies` field in `package.json` ensures Electron's postinstall script (binary download) runs when using `--ignore-workspace`.

---

## Roadmap

- [ ] Tray mode — minimise to system tray, keep workers running in background
- [ ] Worker runner engine — real subprocess execution, not simulated
- [ ] Command inbox — receive and queue commands from external sources
- [ ] WhatsApp ingress — parse incoming WhatsApp messages as task triggers
- [ ] Trading worker research agents — specialised workers for market research and signal generation
