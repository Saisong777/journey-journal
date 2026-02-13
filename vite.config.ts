import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  root: path.resolve(__dirname, "./client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  optimizeDeps: {
    include: ["@tanstack/react-query"],
  },
  server: {
    allowedHosts: true,
  },
}));
