// src/components/LoginButton.tsx
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../auth/firebase";

export default function LoginButton() {
    const [user, setUser] = useState(() => auth.currentUser);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, setUser);
        return () => unsub();
    }, []);

    const handleLogin = async () => {
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (e: any) {
            setError(e.message);
        }
    };

    if (user) {
        return (
            <div>
                <p>ログイン中: {user.email}</p>
                <button onClick={() => signOut(auth)}>ログアウト</button>
            </div>
        );
    }

    return (
        <div style={{ marginBottom: "1rem" }}>
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <button onClick={handleLogin}>ログイン</button>
            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
}
