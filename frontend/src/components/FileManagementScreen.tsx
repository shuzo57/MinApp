// FileManagementScreen.tsx
import React from 'react';
import type { ManagedFile } from '../types';
import { PlusIcon, TrashIcon } from './icons';

interface FileManagementScreenProps {
    files: ManagedFile[];
    onAddFilesClick: () => void;
    onSelectFile: (id: string) => void;
    onDeleteFile: (id: string) => void;
    onStartAnalysis: (id: string) => void;
}

const StatusBadge: React.FC<{ status: ManagedFile['status'] }> = ({ status }) => {
    const statusMap: { [key in ManagedFile['status']]: { text: string, color: string } } = {
        pending: { text: '未分析', color: 'bg-slate-200 text-slate-700' },
        parsing: { text: '解析中', color: 'bg-blue-200 text-blue-800 animate-pulse' },
        analyzing: { text: '分析中', color: 'bg-blue-200 text-blue-800 animate-pulse' },
        success: { text: '分析完了', color: 'bg-green-200 text-green-800' },
        error: { text: 'エラー', color: 'bg-red-200 text-red-800' },
    };
    const { text, color } = statusMap[status];
    return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>{text}</span>;
}

const FileManagementScreen: React.FC<FileManagementScreenProps> = ({ files, onAddFilesClick, onSelectFile, onDeleteFile, onStartAnalysis }) => {
    return (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">ファイル管理</h2>
                <button
                    onClick={onAddFilesClick}
                    className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm hover:shadow-md"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    ファイルを追加
                </button>
            </div>

            {files.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                    <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-slate-900">ファイルがありません</h3>
                    <p className="mt-1 text-sm text-slate-500">「ファイルを追加」ボタンから分析したいPPTXファイルを追加してください。</p>
                </div>
            ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ファイル名</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">アップロード日時</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ステータス</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">アクション</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {files.map(file => (
                                <tr key={file.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-slate-900">{file.name}</div>
                                        <div className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {new Date(file.uploadDate).toLocaleString('ja-JP')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={file.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                        {file.status === 'pending' && (
                                            <button onClick={() => onStartAnalysis(file.id)} className="font-semibold text-blue-600 hover:text-blue-800 transition-colors">分析する</button>
                                        )}
                                        {(file.status === 'success' || file.status === 'error') && (
                                            <button onClick={() => onSelectFile(file.id)} className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">結果を見る</button>
                                        )}
                                        <button onClick={(e) => { e.stopPropagation(); onDeleteFile(file.id); }} className="p-2 rounded-full text-slate-400 hover:bg-red-100 hover:text-red-600 transition-colors">
                                            <span className="sr-only">削除</span>
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default FileManagementScreen;
