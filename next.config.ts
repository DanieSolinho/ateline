import type { NextConfig } from "next";

// No GitHub o site fica em daniesolinho.github.io/ateline.
// No seu Mac (npm run dev) continua em localhost:3000.
const noGitHubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: "export",          // gera o site como arquivos estáticos na pasta /out
  basePath: noGitHubPages ? "/ateline" : "",
  trailingSlash: true,       // /alugar vira /alugar/index.html, que o GitHub Pages entende melhor
  images: { unoptimized: true },
  experimental: {
    agentFeedback: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;