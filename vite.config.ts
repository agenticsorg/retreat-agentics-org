import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    // Dev-only: proxy Cloud Function calls so the browser request stays
    // same-origin (avoids CORS from the Codespace preview domain). Set
    // VITE_FUNCTIONS_URL="" in .env.local to route calls through this.
    proxy: {
      "/retreat": {
        target: "https://us-central1-agenticsorg.cloudfunctions.net",
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./packages/agentics-shared/src"),
    },
    dedupe: ["react", "react-dom", "firebase", "react-router-dom"],
  },
});
