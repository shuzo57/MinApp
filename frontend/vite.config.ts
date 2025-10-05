import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// defineConfig の外で環境をロードする
export default defineConfig(({ mode }) => {
    // mode（"development" or "production"）に応じて .env ファイルを読む
    const env = loadEnv(mode, process.cwd(), "");

    const isDev = mode === "development";

    return {
        plugins: [react()],
        server: {
            host: "0.0.0.0",
            port: Number(env.VITE_PORT) || 5173,
            proxy: isDev
                ? {
                    "/api": {
                        target: env.VITE_API_BASE || "http://backend:8080",
                        changeOrigin: true,
                    },
                }
                : undefined, // 本番は proxy 無効
        },
        build: {
            outDir: "dist",
            sourcemap: isDev,
        },
    };
});
