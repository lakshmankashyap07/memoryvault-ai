'use client';

import React, { useState } from 'react';
import {
  X,
  FileText,
  Upload,
  Sparkles,
  Loader2,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  FileCheck,
} from 'lucide-react';
import { uploadFileWithProgress } from '@/lib/upload-helper';

interface UploadFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  memoryId: string;
  onFileUploaded: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(fileName: string, mimeType?: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (['xls', 'xlsx', 'csv'].includes(ext) || mimeType?.includes('spreadsheet') || mimeType?.includes('csv')) {
    return FileSpreadsheet;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || mimeType?.includes('zip') || mimeType?.includes('archive')) {
    return FileArchive;
  }
  if (['js', 'ts', 'html', 'css', 'json', 'py', 'java'].includes(ext)) {
    return FileCode;
  }
  return FileText;
}

export function UploadFileModal({
  isOpen,
  onClose,
  memoryId,
  onFileUploaded,
}: UploadFileModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploaderName, setUploaderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSelectFile = (selected: File) => {
    setFile(selected);
    // Default file title to original file name without extension if empty
    if (!fileTitle) {
      const baseName = selected.name.replace(/\.[^/.]+$/, '');
      setFileTitle(baseName);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleSelectFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please choose a file to upload.');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // 1. Direct browser-to-Vercel-Blob client upload
      const blobUrl = await uploadFileWithProgress(file, {
        onProgress: (pct) => setUploadProgress(pct),
      });

      if (!blobUrl) {
        throw new Error('Failed to obtain storage file reference.');
      }

      // 2. Post metadata record to Prisma API
      const res = await fetch(`/api/memories/${memoryId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: blobUrl,
          fileName: file.name,
          fileTitle: fileTitle.trim() || file.name,
          description: description.trim(),
          mimeType: file.type || null,
          fileSize: file.size,
          uploaderName: uploaderName.trim(),
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error('Server returned an unexpected response while preserving file metadata.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to preserve file memory.');
      }

      // Reset form & notify parent
      setFile(null);
      setFileTitle('');
      setDescription('');
      setUploaderName('');
      setUploadProgress(null);
      onFileUploaded();
      onClose();
    } catch (err: any) {
      console.error('File memory upload error:', err);
      setError(err.message || 'An error occurred while preserving the file memory.');
    } finally {
      setLoading(false);
    }
  };

  const FileIconComponent = file ? getFileIcon(file.name, file.type) : FileText;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-vault-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-vault-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-vault-900 via-vault-950 to-vault-900 text-vault-100 flex items-center justify-between border-b border-vault-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-white">Add File Memory</h3>
              <p className="text-xs text-vault-400">Preserve an important document or file</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-full hover:bg-vault-800 text-vault-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-grow">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* File Drag & Drop / Selection Area */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-vault-600">
              Upload File
            </label>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-3xl p-6 text-center transition-all ${
                isDragging
                  ? 'border-amber-500 bg-amber-50/50 scale-[1.01]'
                  : file
                  ? 'border-amber-400/80 bg-amber-50/20'
                  : 'border-vault-200 hover:border-amber-400/60 bg-vault-50/50'
              }`}
            >
              <input
                type="file"
                onChange={handleFileChange}
                disabled={loading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.csv,.zip,.rar,.7z,.heic,.png,.jpg,.jpeg,.webp,.avif,.mp3,.mp4"
              />

              {file ? (
                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 border border-amber-300">
                    <FileIconComponent className="w-6 h-6 text-amber-800" />
                  </div>
                  <div className="min-w-0 flex-grow">
                    <p className="font-semibold text-sm text-vault-950 truncate">{file.name}</p>
                    <p className="text-xs text-vault-500 font-mono">{formatBytes(file.size)}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 mt-0.5">
                      <FileCheck className="w-3 h-3" /> Ready for direct upload
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setFileTitle('');
                    }}
                    className="p-2 rounded-full hover:bg-vault-200 text-vault-500 z-20"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-vault-900">
                      Drop document here, or <span className="text-amber-700 underline">Browse</span>
                    </p>
                    <p className="text-[11px] text-vault-500 mt-1">
                      Supports PDF, DOC, DOCX, TXT, XLS, PPT, CSV, ZIP & more
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar UI */}
          {uploadProgress !== null && (
            <div className="space-y-1.5 p-3 rounded-2xl bg-amber-50 border border-amber-200">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                  Uploading file to Vercel Blob...
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-amber-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* File Title Input */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-vault-600">
              File Title / Name
            </label>
            <input
              type="text"
              value={fileTitle}
              onChange={(e) => setFileTitle(e.target.value)}
              placeholder="e.g. College Graduation Certificate, Farewell Letter"
              className="w-full px-4 py-2.5 rounded-xl border border-vault-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm font-medium text-vault-900"
            />
          </div>

          {/* Description / Note */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-vault-600">
              Description / Note
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add context or notes about this document..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-vault-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm font-medium text-vault-900 resize-none"
            />
          </div>

          {/* Optional Uploader Name */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-vault-600">
              Your Name (Optional)
            </label>
            <input
              type="text"
              value={uploaderName}
              onChange={(e) => setUploaderName(e.target.value)}
              placeholder="Leave blank to use your logged-in name"
              className="w-full px-4 py-2.5 rounded-xl border border-vault-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm font-medium text-vault-900"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-vault-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-vault-600 hover:text-vault-900 hover:bg-vault-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !file}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-vault-900 hover:bg-vault-950 text-amber-300 font-bold text-xs shadow-md disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Preserving File...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Upload File</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
