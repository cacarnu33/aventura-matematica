// Pruebas automáticas: abren la app en Microsoft Edge (ya viene con Windows)
// y juegan cada juego solas.  Correr con:  npm test
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    channel: 'msedge',
    baseURL: 'http://localhost:4173',   // la versión publicada (dist/)
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    { command: 'node scripts/serve.mjs dist 4173', port: 4173, reuseExistingServer: !process.env.CI },
    { command: 'node scripts/serve.mjs src 5173',  port: 5173, reuseExistingServer: !process.env.CI },
  ],
});
