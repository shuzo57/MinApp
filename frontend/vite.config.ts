import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const isDev = mode === "development";

    return {
        base: "./",
        plugins: [react()],
        server: {
            host: "0.0.0.0",
            port: Number(env.VITE_PORT) || 5173,
            proxy: isDev
                ? {
                    "/api": {
                        target: env.VITE_API_BASE || "http://localhost:8080",
                        changeOrigin: true,
                    },
                }
                : undefined,
        },
        build: {
            outDir: "dist",
            sourcemap: isDev,
        },
    };
});
