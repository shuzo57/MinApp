import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { apiFetch } from "./auth/client";
import { auth } from "./auth/firebase";
import ItemList from "./components/ItemList";
import LoginButton from "./components/LoginButton";
import GeminiChat from "./components/GeminiChat"; // GeminiChatをインポート
import FileManager from "./components/FileManager"; // FileManagerをインポート

interface User {
    uid: string;
    email: string;
    verified: boolean;
}

export default function App() {
    const [user, setUser] = useState<User | null>(null);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [loadingUserData, setLoadingUserData] = useState(false);

    // --- Firebaseログイン状態を監視 ---
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) {
                setUser(null);
                setCheckingAuth(false);
                return;
            }

            // Firebaseユーザーがいる場合、バックエンドの /me を確認
            setLoadingUserData(true);
            try {
                const res = await apiFetch("/me");
                if (res.ok) {
                    setUser(await res.json());
                } else {
                    setUser(null);
                }
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

    // --- Firebase自体の初期化待ち ---
    if (checkingAuth) {
        return <p>Loading authentication...</p>;
    }

    // --- 未ログインなら即ログインフォームを表示 ---
    if (!user) {
        return (
            <main style={{ fontFamily: "sans-serif", textAlign: "center", marginTop: "2rem" }}>
                <h1>MinApp</h1>
                <LoginButton />
                <p style={{ color: "#666" }}>ログインしてください</p>
            </main>
        );
    }

    // --- ログイン済みならデータを表示 ---
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
                    <FileManager /> {/* ファイル管理コンポーネントを追加 */}
                    <GeminiChat /> {/* GeminiChatコンポーネントを追加 */}
                </>
            )}
        </main>
    );
}