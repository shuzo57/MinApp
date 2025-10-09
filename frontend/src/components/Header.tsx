import { User } from 'firebase/auth'; // ← 変更点1: User型をインポート
import React from 'react';
import { LogoutIcon } from './icons';

// Simple logo, representing document + AI spark
const Logo: React.FC = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#2563EB"/>
        <path d="M14 2V8H20L14 2Z" fill="#60A5FA"/>
        <path d="M12.5 17.5L14 15L16.5 14L14 13L12.5 10.5L11 13L8.5 14L11 15L12.5 17.5Z" fill="white"/>
    </svg>
)

interface HeaderProps {
  user: User; // ← 変更点2: userプロパティを追加
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => { // ← 変更点3: userを受け取る
  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
             <Logo />
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              MinApp
            </h1>
          </div>
          <div className="flex items-center gap-4"> {/* ← 変更点4: ユーザー名とボタンをグループ化 */}
            {/* ユーザー名があれば表示する */}
            {user.displayName && (
                <span className="text-sm font-medium text-slate-600">
                    {user.displayName}さん
                </span>
            )}
            <button
              onClick={onLogout}
              className="flex items-center px-4 py-2 border border-slate-200 text-sm font-medium rounded-lg text-slate-600 bg-white hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <LogoutIcon className="h-5 w-5 mr-2 text-slate-500" />
              ログアウト
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;