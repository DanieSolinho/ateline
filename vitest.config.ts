import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Ensina ao Vitest o atalho "@/", igual ao tsconfig.json
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  // Lê o arquivo .env (como o Next faz), para o cliente do Supabase existir nos testes
  test: {
    env: loadEnv("test", process.cwd(), "NEXT_PUBLIC_"),
  },
});
