import { useEffect, useState } from "react";
import { apiFetch } from "../auth/client";

interface Item {
    id: number;
    name: string;
    description?: string;
}

export default function ItemList() {
    const [items, setItems] = useState<Item[]>([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    // --- 一覧取得 ---
    const fetchItems = async () => {
        try {
            const res = await apiFetch("/items");
            if (!res.ok) throw new Error(`Failed: ${res.status}`);
            setItems(await res.json());
        } catch (e) {
            console.error("Fetch error:", e);
        }
    };

    // --- 登録 ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await apiFetch("/items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description }),
            });
            if (!res.ok) throw new Error(`Failed: ${res.status}`);
            setName("");
            setDescription("");
            await fetchItems();
        } catch (e) {
            console.error("Create error:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    return (
        <>
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
        </>
    );
}
