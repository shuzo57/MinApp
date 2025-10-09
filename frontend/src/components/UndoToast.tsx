
import React, { useState, useEffect } from 'react';
import { UndoIcon } from './icons';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

const UndoToast: React.FC<UndoToastProps> = ({ message, onUndo, onDismiss, duration = 7000 }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true); // Animate in

    const timer = setTimeout(() => {
      setVisible(false);
      // Allow time for fade out animation before calling dismiss
      setTimeout(onDismiss, 300); 
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [onDismiss, duration]);

  const handleUndoClick = () => {
    // Immediately hide and dismiss on undo
    setVisible(false);
    setTimeout(onUndo, 300);
  };

  return (
    <div
      role="alert"
      className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center justify-between w-full max-w-md z-[100] transition-all duration-300 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translate(-50%, 0)' : 'translate(-50%, 20px)',
      }}
    >
      <span className="text-sm">{message}</span>
      <button
        onClick={handleUndoClick}
        className="ml-4 flex items-center text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-md p-1"
      >
        <UndoIcon className="h-5 w-5 mr-1.5" />
        元に戻す
      </button>
    </div>
  );
};

export default UndoToast;
