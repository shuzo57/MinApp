import { auth } from "./firebase";

// 認証付きfetch
export async function apiFetch(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken();
        headers.set("Authorization", `Bearer ${token}`);
    }
    const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:8080/api";
    return fetch(`${apiBase}${path}`, { ...init, headers });
}
