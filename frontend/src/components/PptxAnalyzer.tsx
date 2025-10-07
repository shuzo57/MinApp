// src/components/PptxAnalyzer.tsx
import { useEffect, useState } from "react";
import { apiFetch } from "../auth/client";

type Mode = "auto" | "mock" | "llm";

interface GcsFile {
    name: string;
    updated: string;
    size: number;
    path: string; // 例: "<uid>/sample.pptx"
}

interface AnalysisItem {
    slideNumber: number;
    category: string;
    basis: string;
    issue: string;
    suggestion: string;
    correctionType?: "必須" | "任意";
}

export default function PptxAnalyzer() {
    const [files, setFiles] = useState<GcsFile[]>([]);
    const [mode, setMode] = useState<Mode>("auto");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [resultFor, setResultFor] = useState<string | null>(null);
    const [items, setItems] = useState<AnalysisItem[]>([]);

    // GCS ファイル一覧
    const fetchFiles = async () => {
        setLoading(true);
        setMessage("ファイル一覧を取得しています…");
        try {
            const res = await apiFetch("/files");
            if (!res.ok) throw new Error(`Failed to fetch files: ${res.status}`);
            setFiles(await res.json());
            setMessage("");
        } catch (e: any) {
            setMessage(`エラー: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    // 解析実行（/analyze に gcs_path と mode を投げる）
    const runAnalyze = async (gcsPath: string) => {
        setLoading(true);
        setMessage("解析を実行しています…");
        setItems([]);
        setResultFor(null);

        try {
            const fd = new FormData();
            fd.append("gcs_path", gcsPath);
            fd.append("mode", mode);

            const res = await apiFetch("/analyze", {
                method: "POST",
                body: fd,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || `Analyze failed: ${res.status}`);
            }
            const data: AnalysisItem[] = await res.json();
            setItems(data);
            setResultFor(gcsPath);
            setMessage("");
        } catch (e: any) {
            setMessage(`エラー: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section style={{ marginTop: "2rem", borderTop: "1px solid #ccc", paddingTop: "1rem" }}>
            <h3>🧪 PPTX Analyzer</h3>

            <div style={{ marginBottom: "0.75rem" }}>
                <label>
                    モード：
                    <select value={mode} onChange={(e) => setMode(e.target.value as Mode)} style={{ marginLeft: 8 }}>
                        <option value="auto">auto</option>
                        <option value="mock">mock</option>
                        <option value="llm">llm</option>
                    </select>
                </label>
                <button onClick={fetchFiles} disabled={loading} style={{ marginLeft: 12 }}>
                    {loading ? "更新中…" : "一覧を更新"}
                </button>
            </div>

            {message && <p>{message}</p>}

            {files.length === 0 ? (
                <p>ファイルがありません。まず「ファイルストレージ」で .pptx をアップロードしてください。</p>
            ) : (
                <table style={{ margin: "auto", width: "90%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: "left" }}>ファイル名</th>
                            <th>サイズ(KB)</th>
                            <th>最終更新</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {files.map((f) => (
                            <tr key={f.path}>
                                <td style={{ textAlign: "left" }}>{f.name}</td>
                                <td>{Math.round(f.size / 1024)}</td>
                                <td>{new Date(f.updated).toLocaleString()}</td>
                                <td>
                                    <button onClick={() => runAnalyze(f.path)} disabled={loading}>
                                        {loading && resultFor === null ? "実行中…" : "Analyze"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {resultFor && (
                <div style={{ marginTop: "1rem", textAlign: "left" }}>
                    <h4>解析結果: <code>{resultFor}</code>（{mode}）</h4>
                    {items.length === 0 ? (
                        <p>指摘はありませんでした。</p>
                    ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>スライド</th>
                                    <th>カテゴリ</th>
                                    <th>根拠</th>
                                    <th>指摘</th>
                                    <th>提案</th>
                                    <th>種別</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((it, idx) => (
                                    <tr key={idx}>
                                        <td style={{ verticalAlign: "top" }}>{idx + 1}</td>
                                        <td style={{ verticalAlign: "top" }}>{it.slideNumber}</td>
                                        <td style={{ verticalAlign: "top" }}>{it.category}</td>
                                        <td style={{ verticalAlign: "top", whiteSpace: "pre-wrap" }}>{it.basis}</td>
                                        <td style={{ verticalAlign: "top", whiteSpace: "pre-wrap" }}>{it.issue}</td>
                                        <td style={{ verticalAlign: "top", whiteSpace: "pre-wrap" }}>{it.suggestion}</td>
                                        <td style={{ verticalAlign: "top" }}>{it.correctionType || "任意"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </section>
    );
}
