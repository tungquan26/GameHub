import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { configDefaults } from "vitest/config";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
    server: {
      host: "127.0.0.1",
      // Ảnh và profile Chrome phục vụ QA không phải mã nguồn cần theo dõi.
      watch: { ignored: ["**/.qa/**"] },
      proxy: { "/api": { target: env.API_PROXY_TARGET || "http://localhost:8080", changeOrigin: true } },
    },
    test: {
      environment: "jsdom",
      exclude: [...configDefaults.exclude, "**/.qa/**"],
      restoreMocks: true,
      clearMocks: true,
    },
  };
});
