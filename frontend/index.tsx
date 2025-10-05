import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

function App() {
    const [message, setMessage] = useState("Loading...");

    useEffect(() => {
        fetch("/api/")
            .then((res) => res.json())
            .then((data) => setMessage(data.message))
            .catch(() => setMessage("Error fetching backend"));
    }, []);

    return (
        <main style={{ fontFamily: "sans-serif", textAlign: "center", marginTop: "3rem" }}>
            <h1>{message}</h1>
            <p>Frontend is served by Vite + React.</p>
        </main>
    );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
