import { defineConfig, devices } from "@playwright/test";

// Os testes de ponta a ponta abrem o site de verdade (a pasta out/, gerada por "npm run build")
// num navegador e clicam como uma cliente. O Supabase é simulado: nada vai para o banco real.
const basePath = process.env.GITHUB_ACTIONS === "true" ? "/ateline" : "";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI, // no GitHub, um "test.only" esquecido faz o teste falhar
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:4173${basePath}/`,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "computador", use: { ...devices["Desktop Chrome"] } },
    { name: "celular", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "node scripts/servir-site.mjs",
    url: `http://localhost:4173${basePath}/`,
    reuseExistingServer: !process.env.CI,
  },
});
