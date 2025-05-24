import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path,
        configure: (proxy, options) => {
          proxy.on("proxyReq", (proxyReq, req, res) => {
            console.log("[VITE PROXY] Proxying:", req.url);
          });
        },
      },
    },
  },
  define: {
    "process.env": {
      VITE_SUPABASE_URL: JSON.stringify(process.env.VITE_SUPABASE_URL),
      VITE_SUPABASE_KEY: JSON.stringify(process.env.VITE_SUPABASE_KEY),
      VITE_API_URL: JSON.stringify(process.env.VITE_API_URL),
    },
  },
});
