// src/utils/excelExporter.ts

import { apiFetch } from '../auth/client';

/**
 * バックエンドで生成されたExcelファイルをダウンロードする関数
 * @param analysisId - エクスポート対象の解析ID
 * @param fileName - ダウンロードするファイル名 (拡張子なし)
 */
export const downloadExcelFile = async (analysisId: number, fileName: string): Promise<void> => {
  try {
    // バックエンドのAPIエンドポイントを呼び出す
    const res = await apiFetch(`/export/analysis/${analysisId}/excel`);

    if (!res.ok) {
      throw new Error('Excelファイルのダウンロードに失敗しました。');
    }

    // レスポンスからファイル内容(blob)を取得
    const blob = await res.blob();

    // ダウンロードリンクを動的に作成してクリック
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.xlsx`; // 拡張子を付与
    document.body.appendChild(a);
    a.click();
    
    // 後片付け
    a.remove();
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error(error);
    alert(error instanceof Error ? error.message : '不明なエラーが発生しました。');
  }
};