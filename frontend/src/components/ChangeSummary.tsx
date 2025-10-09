import React, { useEffect } from 'react';
import type { AnalysisItem } from '../types';

type Action = 'create' | 'update' | 'delete';

export interface ChangeSummaryData {
  action: Action;
  before?: AnalysisItem | null;
  after?: AnalysisItem | null;
  diff?: Partial<Record<keyof AnalysisItem, { before: any; after: any }>>;
}

interface Props {
  data: ChangeSummaryData;
  onDismiss?: () => void;
  autoHideMs?: number;
}

const fieldLabel: Record<keyof AnalysisItem, string> = {
  id: 'ID',
  slideNumber: 'スライド番号',
  category: 'カテゴリ',
  basis: '根拠',
  issue: '指摘事項',
  suggestion: '改善案',
  correctionType: '修正の種類',
};

const ChangeSummary: React.FC<Props> = ({ data, onDismiss, autoHideMs = 6000 }) => {
  useEffect(() => {
    if (!autoHideMs) return;
    const t = setTimeout(() => onDismiss?.(), autoHideMs);
    return () => clearTimeout(t);
  }, [autoHideMs, onDismiss]);

  const renderUpdate = () => {
    const entries = Object.entries(data.diff || {}).filter(([k]) => k !== 'id');
    if (entries.length === 0) return <p className="text-slate-600">変更はありません。</p>;
    return (
      <ul className="list-disc pl-5 space-y-1">
        {entries.map(([key, { before, after }]) => (
          <li key={key} className="text-sm text-slate-700">
            <span className="font-semibold">{fieldLabel[key as keyof AnalysisItem]}:</span>
            <span className="mx-2 line-through decoration-rose-400 text-slate-500">{String(before ?? '')}</span>
            <span className="mx-2 text-emerald-700">→ {String(after ?? '')}</span>
          </li>
        ))}
      </ul>
    );
  };

  const renderCreate = () => {
    const a = data.after;
    if (!a) return null;
    return (
      <p className="text-sm text-slate-700">
        スライド{a.slideNumber} に「{a.category}」を追加しました。
      </p>
    );
  };

  const renderDelete = () => {
    const b = data.before;
    if (!b) return null;
    return (
      <p className="text-sm text-slate-700">
        スライド{b.slideNumber} の「{b.category}」を削除しました。
      </p>
    );
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800 mb-1">
            {data.action === 'update' && '変更内容'}
            {data.action === 'create' && '追加しました'}
            {data.action === 'delete' && '削除しました'}
          </p>
          {data.action === 'update' && renderUpdate()}
          {data.action === 'create' && renderCreate()}
          {data.action === 'delete' && renderDelete()}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 text-slate-400 hover:text-slate-600"
            aria-label="閉じる"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default ChangeSummary;

