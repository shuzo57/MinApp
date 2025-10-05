import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            // ローカルでFastAPIに転送
            "/api": "http://localhost:8080"
        },
        port: 5173
    }
});
