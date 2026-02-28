import { defineConfig } from 'vite';
import type { ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

// Writes the actual chosen port to .vite-port so electron/main.ts can read it.
// This lets Vite auto-increment if 5174 is in TIME_WAIT, while Electron always
// connects to the right port.
const vitePortPlugin = {
  name: 'write-vite-port',
  configureServer(server: ViteDevServer) {
    // Remove stale file before server starts so wait-on doesn't see old data
    try { fs.unlinkSync('.vite-port'); } catch { /* not present, that's fine */ }
    server.httpServer?.once('listening', () => {
      const addr = server.httpServer?.address();
      const port = typeof addr === 'object' && addr !== null ? (addr as { port: number }).port : 5174;
      fs.writeFileSync('.vite-port', String(port), 'utf8');
    });
  },
};

export default defineConfig({
  plugins: [react(), vitePortPlugin],
  base: './',
  server: { port: 5174 },
});
