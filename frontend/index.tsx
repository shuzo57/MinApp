import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

// --- 型定義 ---
interface Item {
    id: number;
    name: string;
    description?: string;
}

// --- メインアプリ ---
function App() {
    const [items, setItems] = useState<Item[]>([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:8080";

    // --- 一覧取得 ---
    const fetchItems = async () => {
        try {
            const res = await fetch(`${apiBase}/api/items`);
            if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
            const data = await res.json();
            setItems(data);
        } catch (err) {
            console.error("Error fetching items:", err);
        }
    };

    // --- 登録処理 ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/api/items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description }),
            });
            if (!res.ok) throw new Error(`Failed to post: ${res.status}`);
            setName("");
            setDescription("");
            await fetchItems();
        } catch (err) {
            console.error("Error creating item:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    return (
        <main style={{ fontFamily: "sans-serif", textAlign: "center", marginTop: "2rem" }}>
            <h1>MinApp Items</h1>

            <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
                <input
                    placeholder="Item name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{ marginRight: "0.5rem" }}
                />
                <input
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ marginRight: "0.5rem" }}
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Adding..." : "Add"}
                </button>
            </form>

            {items.length === 0 ? (
                <p>No items yet.</p>
            ) : (
                <ul style={{ listStyle: "none", padding: 0 }}>
                    {items.map((item) => (
                        <li key={item.id}>
                            <strong>{item.name}</strong>
                            {item.description && <span> — {item.description}</span>}
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
