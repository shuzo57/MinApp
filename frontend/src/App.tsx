// src/App.tsx
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { apiFetch } from "./auth/client";
import { auth } from "./auth/firebase";
import FileManager from "./components/FileManager";
import GeminiChat from "./components/GeminiChat";
import ItemList from "./components/ItemList";
import LoginButton from "./components/LoginButton";
import PptxAnalyzer from "./components/PptxAnalyzer"; // ← 追加

interface User {
    uid: string;
    email: string;
    verified: boolean;
}

export default function App() {
    const [user, setUser] = useState<User | null>(null);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [loadingUserData, setLoadingUserData] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) {
                setUser(null);
                setCheckingAuth(false);
                return;
            }
            setLoadingUserData(true);
            try {
                const res = await apiFetch("/me");
                if (res.ok) setUser(await res.json());
                else setUser(null);
            } catch (err) {
                console.error("Failed to fetch /me:", err);
                setUser(null);
            } finally {
                setLoadingUserData(false);
                setCheckingAuth(false);
            }
        });
        return () => unsub();
    }, []);

    if (checkingAuth) return <p>Loading authentication...</p>;

    if (!user) {
        return (
            <main style={{ fontFamily: "sans-serif", textAlign: "center", marginTop: "2rem" }}>
                <h1>MinApp</h1>
                <LoginButton />
                <p style={{ color: "#666" }}>ログインしてください</p>
            </main>
        );
    }

    return (
        <main style={{ fontFamily: "sans-serif", textAlign: "center", marginTop: "2rem" }}>
            <h1>MinApp</h1>
            <LoginButton />
            {loadingUserData ? (
                <p>Loading user data...</p>
            ) : (
                <>
                    <p>こんにちは、{user.email}</p>
                    <ItemList />
                    <FileManager />
                    <PptxAnalyzer /> {/* ← ここで解析UIを追加 */}
                    <GeminiChat />
                </>
            )}
        </main>
    );
}
