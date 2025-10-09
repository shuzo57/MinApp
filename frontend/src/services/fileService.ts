// src/services/fileService.ts
import { apiFetch } from '../auth/client';
import { AnalysisDetail, AnalysisItem, AnalysisSummary, ManagedFile } from '../types';

// 返り値の型を定義
export interface LatestAnalysisResult {
  analysisId: number;
  items: AnalysisItem[];
}

export async function fetchFiles(): Promise<ManagedFile[]> {
  const res = await apiFetch(`/files-db`);
  if (!res.ok) throw new Error('ファイル一覧の取得に失敗しました');
  const list = await res.json();
  return list as ManagedFile[];
}

export async function uploadFiles(files: File[]): Promise<void> {
  for (const file of files) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiFetch(`/files/upload`, { method: 'POST', body: formData });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `ファイル ${file.name} のアップロードに失敗しました`);
    }
  }
}

export async function deleteFile(id: string): Promise<void> {
  const res = await apiFetch(`/files/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('ファイルの削除に失敗しました');
}

export async function startAnalysis(id: string): Promise<AnalysisItem[]> {
  const formData = new FormData();
  formData.append('file_id', id);
  const res = await apiFetch(`/analyze`, { method: 'POST', body: formData });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || '解析の開始に失敗しました');
  }
  return res.json();
}

export async function fetchAnalysesByFile(fileId: string): Promise<AnalysisSummary[]> {
  const res = await apiFetch(`/files/${fileId}/analyses`);
  if (!res.ok) throw new Error('解析一覧の取得に失敗しました');
  return res.json();
}

export async function getAnalysis(analysisId: number): Promise<AnalysisDetail> {
  const res = await apiFetch(`/analyses/${analysisId}`);
  if (!res.ok) throw new Error('解析詳細の取得に失敗しました');
  return res.json();
}

export async function fetchLatestAnalysisItems(fileId: string): Promise<LatestAnalysisResult | null> {
  const res = await apiFetch(`/files/${fileId}/analyses/latest`);
  if (!res.ok) {
    if (res.status === 404) {
      return null;
    }
    throw new Error('最新の解析結果の取得に失敗しました');
  }
  const detail = await res.json();
  const items = (detail.items ?? []).map((i: any) => ({
    id: String(i.id ?? crypto.randomUUID()),
    slideNumber: i.slideNumber,
    category: i.category,
    basis: i.basis,
    issue: i.issue,
    suggestion: i.suggestion,
    correctionType: i.correctionType ?? '任意',
  }));
  return {
    analysisId: detail.id,
    items: items,
  };
}

export async function createAnalysisItemForLatest(
  fileId: string,
  payload: Omit<AnalysisItem, 'id' | 'correctionType'> & { correctionType?: '必須' | '任意' },
): Promise<AnalysisItem> {
  const res = await apiFetch(`/files/${fileId}/analyses/latest/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      correctionType: payload.correctionType ?? '任意',
    }),
  });
  if (!res.ok) throw new Error('指摘事項の追加に失敗しました');
  return res.json();
}

export async function updateAnalysisItem(item: AnalysisItem): Promise<AnalysisItem> {
  const res = await apiFetch(`/analysis-items/${Number(item.id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('指摘事項の更新に失敗しました');
  return res.json();
}

export async function deleteAnalysisItem(itemId: string): Promise<void> {
  const res = await apiFetch(`/analysis-items/${Number(itemId)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('指摘事項の削除に失敗しました');
}