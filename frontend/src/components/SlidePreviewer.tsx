
import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface SlidePreviewerProps {
  slideContents: string[];
  currentSlide: number; // 1-based
  onNavigate: (slideNumber: number) => void;
}

const SlidePreviewer: React.FC<SlidePreviewerProps> = ({ slideContents, currentSlide, onNavigate }) => {
  const totalSlides = slideContents.length;
  const currentSlideIndex = currentSlide - 1;

  const handlePrev = () => {
    if (currentSlide > 1) {
      onNavigate(currentSlide - 1);
    }
  };

  const handleNext = () => {
    if (currentSlide < totalSlides) {
      onNavigate(currentSlide + 1);
    }
  };

  const currentText = slideContents[currentSlideIndex];

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-xl p-4 shadow-inner">
      <div className="flex-grow bg-white shadow-md rounded-lg p-6 flex items-center justify-center overflow-auto">
        {totalSlides > 0 ? (
          <p className="whitespace-pre-wrap text-slate-800 text-lg leading-relaxed">
            {currentText || 'このスライドには認識可能なテキストがありません。'}
          </p>
        ) : (
          <p className="text-slate-500">スライドのコンテンツを読み込めませんでした。</p>
        )}
      </div>
      <div className="flex items-center justify-between pt-4 flex-shrink-0">
        <button
          onClick={handlePrev}
          disabled={currentSlide <= 1}
          className="p-2 rounded-full text-slate-600 bg-white shadow-sm hover:bg-slate-50 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
          aria-label="前のスライド"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        <span className="text-sm font-medium text-slate-700">
          {totalSlides > 0 ? `スライド ${currentSlide} / ${totalSlides}` : 'スライドなし'}
        </span>
        <button
          onClick={handleNext}
          disabled={currentSlide >= totalSlides || totalSlides === 0}
          className="p-2 rounded-full text-slate-600 bg-white shadow-sm hover:bg-slate-50 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
          aria-label="次のスライド"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

export default SlidePreviewer;
