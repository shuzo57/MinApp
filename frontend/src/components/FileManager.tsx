// FileManager.tsx（変更版）

import { ChangeEvent, useEffect, useState } from 'react';
import { apiFetch } from '../auth/client';

// ✅ DB一覧の行型（/api/files-db の戻り）
interface DbFileRow {
  id: string;         // ← これが必要
  name: string;
  size: number;
  uploadDate: string; // ISO文字列
  // 他のフィールド（status等）が返りますが必須ではない
}

export default function FileManager() {
  const [files, setFiles] = useState<DbFileRow[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [fileContent, setFileContent] = useState<string | null>(null);

  // --- ファイル一覧（DB） ---
  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/files-db"); // ← ✅ ここを /files-db に
      if (!res.ok) throw new Error(`Failed to fetch files: ${res.status}`);
      setFiles(await res.json());
    } catch (e: any) {
      setMessage(`エラー: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchFiles(); }, []);

  // --- ファイル選択 ---
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  // --- アップロード ---
  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setMessage('アップロード中...');
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const res = await apiFetch("/files/upload", { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      setMessage('アップロード成功！');
      setSelectedFile(null);
      await fetchFiles();
    } catch (e: any) {
      setMessage(`エラー: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 内容表示（※/files-db は path を返さないので、内容表示は今はスキップ or 別UIでGCS一覧を使う） ---
  //   もし内容表示も必要なら、「GCS一覧（/api/files）」専用の小さな表を別に残すのがおすすめです。

  // --- 削除（idで削除） ---
  const handleDelete = async (row: DbFileRow) => {
    if (window.confirm(`${row.name} を本当に削除しますか？`)) {
      try {
        const res = await apiFetch(`/files/${row.id}`, { method: 'DELETE' }); // ← ✅ idで削除
        if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
        setMessage('削除しました。');
        await fetchFiles();
      } catch (e: any) {
        setMessage(`削除エラー: ${e.message}`);
      }
    }
  };

  return (
    <div style={{ marginTop: '2rem', borderTop: '1px solid #ccc', paddingTop: '1rem' }}>
      <h3>📁 ファイル（DBベース）</h3>
      <div>
        <input type="file" accept=".pptx" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={!selectedFile || isLoading}>
          {isLoading ? '処理中...' : 'アップロード'}
        </button>
      </div>
      {message && <p>{message}</p>}

      <h4 style={{ marginTop: '2rem' }}>アップロード済みファイル</h4>
      {isLoading && files.length === 0 && <p>読み込み中...</p>}

      <table style={{ margin: 'auto', width: '80%' }}>
        <thead>
          <tr>
            <th>ファイル名</th>
            <th>サイズ (KB)</th>
            <th>アップロード日時</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {files.map((f) => (
            <tr key={f.id}> {/* ← ✅ key も id に */}
              <td>{f.name}</td>
              <td>{Math.round(f.size / 1024)}</td>
              <td>{new Date(f.uploadDate).toLocaleString()}</td>
              <td>
                <button onClick={() => handleDelete(f)} disabled={isLoading}>削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* （必要なら）GCSの内容表示テーブルは別セクションとして残してください */}
    </div>
  );
}
