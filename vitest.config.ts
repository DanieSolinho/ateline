import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Ensina ao Vitest o atalho "@/", igual ao tsconfig.json
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
});