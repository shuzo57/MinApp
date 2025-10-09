// FileUpload.tsx
import React, { useCallback, useState } from 'react';
import { uploadFiles } from '../services/fileService';
import type { ManagedFile } from '../types';
import { FileIcon, TrashIcon, UploadIcon } from './icons';

interface FileUploadScreenProps {
    onUpload: (uploadedFiles: ManagedFile[]) => void;
    onCancel: () => void;
}

const FileUploadScreen: React.FC<FileUploadScreenProps> = ({ onUpload, onCancel }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [stagedFiles, setStagedFiles] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const addFiles = (files: FileList | null) => {
        if (!files) return;
        setError(null);
        const newFiles = Array.from(files).filter(file =>
            file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        );
        if (newFiles.length !== files.length) {
            setError('PowerPoint (.pptx) ファイルのみアップロードできます。');
        }
        const uniqueNewFiles = newFiles.filter(newFile =>
            !stagedFiles.some(stagedFile => stagedFile.name === newFile.name && stagedFile.size === newFile.size)
        );
        setStagedFiles(prev => [...prev, ...uniqueNewFiles]);
    };

    const removeFile = (index: number) => {
        setStagedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        addFiles(e.dataTransfer.files);
    }, []);

    const handleUploadClick = async () => {
        if (stagedFiles.length === 0) return;
        setUploading(true);
        try {
            const uploadedResults = await uploadFiles(stagedFiles);
            onUpload(uploadedResults);
            setStagedFiles([]);
        } catch (err) {
            console.error(err);
            setError('アップロードに失敗しました。');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">ファイルを追加</h2>
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative block w-full border-2 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 border-dashed'
                    } rounded-lg p-12 text-center hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300`}
            >
                <UploadIcon className="mx-auto h-12 w-12 text-slate-400" />
                <span className="mt-2 block text-sm font-medium text-slate-900">
                    ここにファイルをドラッグ＆ドロップ
                </span>
                <span className="text-xs text-slate-500">または</span>
                <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                    <span> ファイルを選択</span>
                    <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                        onChange={(e) => addFiles(e.target.files)}
                        multiple
                    />
                </label>
                <p className="text-xs text-slate-500 mt-1">複数の .pptx ファイルを選択できます</p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {stagedFiles.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-lg font-medium text-slate-700">アップロードするファイル ({stagedFiles.length})</h3>
                    <ul className="border border-slate-200 rounded-md divide-y divide-slate-200">
                        {stagedFiles.map((file, index) => (
                            <li key={index} className="px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <FileIcon className="h-6 w-6 text-blue-500 flex-shrink-0" />
                                    <div className="text-sm">
                                        <p className="font-medium text-slate-800">{file.name}</p>
                                        <p className="text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <button onClick={() => removeFile(index)} className="text-slate-500 hover:text-red-600 p-1 rounded-full hover:bg-red-100">
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <div className="flex justify-end space-x-3 pt-4">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
                >
                    キャンセル
                </button>
                <button
                    onClick={handleUploadClick}
                    disabled={stagedFiles.length === 0 || uploading}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
                >
                    {uploading ? 'アップロード中...' : `${stagedFiles.length}件のファイルをアップロード`}
                </button>
            </div>
        </div>
    );
};

export default FileUploadScreen;
