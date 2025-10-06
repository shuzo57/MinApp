import React, { useState, useEffect, ChangeEvent } from 'react';
import { apiFetch } from '../auth/client';

interface GcsFile {
  name: string;
  updated: string;
  size: number;
  path: string;
}

export default function FileManager() {
  const [files, setFiles] = useState<GcsFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [fileContent, setFileContent] = useState<string | null>(null); // 取得したファイル内容を保持するState

  // --- ファイル一覧を取得 ---
  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/files");
      if (!res.ok) throw new Error(`Failed to fetch files: ${res.status}`);
      setFiles(await res.json());
    } catch (e: any) {
      setMessage(`エラー: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 初回読み込み ---
  useEffect(() => {
    fetchFiles();
  }, []);

  // --- ファイル選択 ---
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  // --- アップロード処理 ---
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

  // --- 内容表示処理 ---
  const handleReadContent = async (path: string) => {
    setMessage('ファイル内容を読み込み中...');
    setIsLoading(true);
    try {
      const res = await apiFetch('/files/read', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      if (!res.ok) {
        throw new Error(`Failed to read content: ${res.status}`);
      }
      const data = await res.json();
      setFileContent(data.content); // 取得したテキストをStateに保存
    } catch (e: any) {
      setMessage(`読み取りエラー: ${e.message}`);
    } finally {
      setIsLoading(false);
      setMessage('');
    }
  };

  // --- 削除処理 ---
  const handleDelete = async (path: string, name: string) => {
    if (window.confirm(`${name} を本当に削除しますか？`)) {
      try {
        const encodedPath = encodeURIComponent(path);
        const res = await apiFetch(`/files/${encodedPath}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
        setMessage('削除しました。');
        await fetchFiles();
      } catch (e: any) {
        setMessage(`削除エラー: ${e.message}`);
      }
    }
  };

  // --- モーダルを閉じる ---
  const closeContentModal = () => {
    setFileContent(null);
  };

  return (
    <div style={{ marginTop: '2rem', borderTop: '1px solid #ccc', paddingTop: '1rem' }}>
      <h3>📁 ファイルストレージ</h3>
      <div>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={!selectedFile || isLoading}>
          {isLoading ? '処理中...' : 'アップロード'}
        </button>
      </div>
      {message && <p>{message}</p>}
      <h4 style={{marginTop: '2rem'}}>アップロード済みファイル</h4>
      {isLoading && files.length === 0 && <p>読み込み中...</p>}
      <table style={{ margin: 'auto', width: '80%' }}>
        <thead>
          <tr>
            <th>ファイル名</th>
            <th>サイズ (KB)</th>
            <th>最終更新日</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.path}>
              <td>{file.name}</td>
              <td>{Math.round(file.size / 1024)}</td>
              <td>{new Date(file.updated).toLocaleString()}</td>
              <td>
                <button onClick={() => handleReadContent(file.path)} disabled={isLoading}>内容表示</button>
                <button onClick={() => handleDelete(file.path, file.name)} disabled={isLoading}>削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* fileContentに中身がある時だけモーダルを表示 */}
      {fileContent !== null && (
        <div style={modalOverlayStyle} onClick={closeContentModal}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <h3>ファイル内容</h3>
            <pre style={preStyle}>{fileContent}</pre>
            <button onClick={closeContentModal}>閉じる</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- モーダル表示用のスタイル ---
const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};
const modalContentStyle: React.CSSProperties = {
  backgroundColor: '#fff', padding: '20px', borderRadius: '8px',
  width: '80%', maxHeight: '80vh', overflowY: 'auto',
};
const preStyle: React.CSSProperties = {
  whiteSpace: 'pre-wrap',       /* テキストを折り返す */
  wordWrap: 'break-word',       /* 長い単語も折り返す */
  backgroundColor: '#f4f4f4',
  border: '1px solid #ddd',
  padding: '10px',
  textAlign: 'left',
};