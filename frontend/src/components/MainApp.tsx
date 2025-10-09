// src/components/MainApp.tsx
import { User } from 'firebase/auth';
import React, { useCallback, useEffect, useState } from 'react';
import {
    deleteFile as apiDeleteFile,
    startAnalysis as apiStartAnalysis,
    fetchFiles,
    fetchLatestAnalysisItems,
} from '../services/fileService';
import type { ManagedFile } from '../types';
import AnalysisScreen from './Dashboard';
import FileManagementScreen from './FileManagementScreen';
import FileUploadScreen from './FileUpload';
import Header from './Header';

type View = 'fileManagement' | 'fileUpload' | 'analysis';

interface MainAppProps {
    user: User;
    onLogout: () => void;
}

const MainApp: React.FC<MainAppProps> = ({ user, onLogout }) => {
    const [view, setView] = useState<View>('fileManagement');
    const [files, setFiles] = useState<ManagedFile[]>([]);
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

    const loadFiles = useCallback(async () => {
        const list = await fetchFiles();
        setFiles(list);
    }, []);

    useEffect(() => {
        loadFiles();
    }, [loadFiles]);

    const handleAddFilesClick = useCallback(() => setView('fileUpload'), []);

    const handleUpload = useCallback(async () => {
        setView('fileManagement');
        await loadFiles();
    }, [loadFiles]);

    const handleSelectFile = useCallback(async (id: string) => {
        try {
            const result = await fetchLatestAnalysisItems(id);
            setFiles(prev =>
                prev.map(f => (f.id === id ? { 
                  ...f, 
                  analysisResult: result?.items ?? [],
                  latestAnalysisId: result?.analysisId,
                  status: 'success' 
                } : f)),
            );
            setSelectedFileId(id);
            setView('analysis');
        } catch (e) {
            console.error(e);
            alert('分析結果の取得に失敗しました');
        }
    }, []);

    const handleDeleteFile = useCallback(
        async (id: string) => {
            if (window.confirm('このファイルを削除しますか？分析結果も失われます。')) {
                await apiDeleteFile(id);
                await loadFiles();
                if (selectedFileId === id) {
                    setSelectedFileId(null);
                    setView('fileManagement');
                }
            }
        },
        [loadFiles, selectedFileId],
    );

    const startAnalysisProcess = useCallback(
        async (fileId: string) => {
            setFiles(prev => prev.map(f => (f.id === fileId ? { ...f, status: 'parsing', error: null } : f)));
            try {
                await apiStartAnalysis(fileId);
                const result = await fetchLatestAnalysisItems(fileId);
                setFiles(prev =>
                    prev.map(f => (f.id === fileId ? { 
                        ...f, 
                        status: 'success', 
                        analysisResult: result?.items ?? [],
                        latestAnalysisId: result?.analysisId,
                    } : f))
                );
            } catch (e) {
                console.error(e);
                setFiles(prev => prev.map(f => (f.id === fileId ? { ...f, status: 'error', error: '分析に失敗しました' } : f)));
            }
        },
        [],
    );

    const handleBack = useCallback(() => {
        setSelectedFileId(null);
        setView('fileManagement');
    }, []);

    const selectedFile = selectedFileId ? files.find(f => f.id === selectedFileId) ?? null : null;

    return (
        <div className="flex flex-col min-h-screen">
            <Header user={user} onLogout={onLogout} />
            <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {view === 'fileManagement' && (
                        <FileManagementScreen
                            files={files}
                            onAddFilesClick={handleAddFilesClick}
                            onSelectFile={handleSelectFile}
                            onDeleteFile={handleDeleteFile}
                            onStartAnalysis={startAnalysisProcess}
                        />
                    )}

                    {view === 'fileUpload' && (
                        <FileUploadScreen onUpload={handleUpload} onCancel={() => setView('fileManagement')} />
                    )}

                    {view === 'analysis' && selectedFile && (
                        <AnalysisScreen
                            fileData={selectedFile}
                            onUpdateFile={(id, updates) =>
                                setFiles(prev => prev.map(f => (f.id === id ? { ...f, ...updates } : f)))
                            }
                            onBack={handleBack}
                            onTriggerAnalysis={startAnalysisProcess}
                        />
                    )}

                    {view === 'analysis' && !selectedFile && (
                        <div>
                            <p>ファイルが見つかりません。ファイル管理画面に戻ります。</p>
                            <button onClick={handleBack}>戻る</button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default MainApp;