import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import type { AnalysisItem } from '../types';
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, TrashIcon, XIcon } from './icons';

const AutoResizingTextarea: React.FC<{
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  placeholder?: string;
}> = ({ value, onChange, className, placeholder }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    if (textareaRef.current) {
      const target = textareaRef.current;
      target.style.height = 'auto';
      target.style.height = `${target.scrollHeight}px`;
    }
  }, [value]);
  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  };
  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      onInput={handleInput}
      className={className}
      placeholder={placeholder}
      rows={1}
    />
  );
};

interface EditAnalysisModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  item: AnalysisItem | null;
  onSave: (updatedItem: AnalysisItem) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  canNavigatePrev: boolean;
  canNavigateNext: boolean;
  onDelete: () => void;
}

const EditAnalysisModal: React.FC<EditAnalysisModalProps> = ({
  isOpen,
  onRequestClose,
  item,
  onSave,
  onNavigate,
  canNavigatePrev,
  canNavigateNext,
  onDelete,
}) => {
  const [formData, setFormData] = useState<AnalysisItem | null>(item);

  useEffect(() => {
    setFormData(item);
  }, [item]);

  if (!isOpen || !formData) return null;

  const handleChange = (field: keyof AnalysisItem, value: any) => {
    setFormData(prev => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSlideNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 1) value = 1;
    handleChange('slideNumber', value);
  };

  const handleSave = () => {
    if (formData) {
      onSave(formData);
      onRequestClose();
    }
  };

  const handleDelete = () => {
    onDelete();
  };

  const categories = ['誤植', '表現', '出典'];
  const editableInputClass =
    'w-full px-3 py-2 rounded-md bg-slate-50/50 hover:bg-slate-100 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all duration-200 ease-in-out text-sm text-slate-800 placeholder-slate-400';

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity"
      onClick={onRequestClose}
    >
      <div
        className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-800">指摘事項の編集</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('prev')}
                disabled={!canNavigatePrev}
                className="p-2 rounded-full enabled:hover:bg-slate-200 disabled:opacity-50 transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5 text-slate-600" />
              </button>
              <span className="text-sm font-medium text-slate-600">
                {canNavigatePrev || canNavigateNext ? '次の指摘へ' : '指摘は1件です'}
              </span>
              <button
                onClick={() => onNavigate('next')}
                disabled={!canNavigateNext}
                className="p-2 rounded-full enabled:hover:bg-slate-200 disabled:opacity-50 transition-colors"
              >
                <ChevronRightIcon className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <button onClick={onRequestClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
              <XIcon className="w-6 h-6 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="flex-grow p-6 overflow-auto">
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">スライド番号</label>
                <input
                  type="number"
                  value={formData.slideNumber}
                  onChange={handleSlideNumberChange}
                  className={editableInputClass}
                  min={1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">カテゴリ</label>
                <input
                  type="text"
                  list="category-suggestions"
                  value={formData.category}
                  onChange={e => handleChange('category', e.target.value)}
                  className={editableInputClass}
                  placeholder="カテゴリを入力または選択"
                />
                <datalist id="category-suggestions">
                  {categories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">修正の種類</label>
                <select
                  value={formData.correctionType}
                  onChange={e => handleChange('correctionType', e.target.value)}
                  className={`${editableInputClass} appearance-none`}
                >
                  <option value="任意">任意</option>
                  <option value="必須">必須</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">根拠</label>
              <AutoResizingTextarea
                value={formData.basis}
                onChange={e => handleChange('basis', e.target.value)}
                className={`${editableInputClass} resize-none`}
                placeholder="薬機法 第XX条など"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">指摘事項</label>
              <AutoResizingTextarea
                value={formData.issue}
                onChange={e => handleChange('issue', e.target.value)}
                className={`${editableInputClass} resize-none min-h-[80px]`}
                placeholder="具体的な指摘内容"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">改善案</label>
              <AutoResizingTextarea
                value={formData.suggestion}
                onChange={e => handleChange('suggestion', e.target.value)}
                className={`${editableInputClass} resize-none min-h-[80px]`}
                placeholder="具体的な改善提案"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center p-4 border-t border-slate-200 flex-shrink-0 bg-slate-50/50">
          <button
            onClick={handleDelete}
            className="flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-red-600 hover:bg-red-100 transition-colors"
          >
            <TrashIcon className="w-5 h-5 mr-2" />
            この指摘を削除
          </button>
          <div className="flex gap-3">
            <button
              onClick={onRequestClose}
              className="px-5 py-2.5 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-100 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
            >
              <CheckIcon className="w-5 h-5 mr-2" />
              変更を保存
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EditAnalysisModal;
