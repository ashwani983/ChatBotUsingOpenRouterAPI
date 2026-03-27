import { useState, useRef, useCallback } from 'react';

interface FileAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
}

interface FileUploaderProps {
  theme: 'light' | 'dark';
  onFilesUploaded: (files: FileAttachment[]) => void;
  onClose: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }
  if (mimeType === 'application/pdf') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
};

const FileUploader: React.FC<FileUploaderProps> = ({ theme, onFilesUploaded, onClose }) => {
  const [files, setFiles] = useState<Array<{ file: File; preview?: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setError(`File "${file.name}" is too large. Max size is 10MB.`);
      return;
    }

    const preview = file.type.startsWith('image/')
      ? await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        })
      : undefined;

    setFiles(prev => [...prev, { file, preview }]);
    setError(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const newFiles = Array.from(e.dataTransfer.files);
    newFiles.forEach(processFile);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    const uploaded: FileAttachment[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const { file } = files[i];
        const reader = new FileReader();

        const fileData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const response = await fetch('/api/files/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: fileData,
            filename: file.name,
            mimeType: file.type
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const data = await response.json();
        uploaded.push(data);
        setUploadProgress(((i + 1) / files.length) * 100);
      }

      onFilesUploaded(uploaded);
    } catch (err) {
      setError('Failed to upload files. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const panelBg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const mutedText = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
  const dropZoneBg = isDragging
    ? theme === 'dark' ? 'border-blue-500 bg-blue-500/20' : 'border-blue-500 bg-blue-100'
    : theme === 'dark' ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-gray-50';

  return (
    <div className={`${panelBg} rounded-lg border ${borderColor} shadow-xl p-4 max-w-lg mx-auto`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-semibold ${textColor}`}>Upload Files</h3>
        <button
          onClick={onClose}
          className={`p-1 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} ${mutedText}`}
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dropZoneBg}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => {
            const newFiles = Array.from(e.target.files || []);
            newFiles.forEach(processFile);
          }}
          className="hidden"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-12 w-12 mx-auto mb-2 ${mutedText}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className={`${mutedText} text-sm`}>
          Drag & drop files here, or click to select
        </p>
        <p className={`${mutedText} text-xs mt-1`}>
          PDF, Images, Text, Code files (Max 10MB)
        </p>
      </div>

      {error && (
        <div className="mt-3 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
          {files.map((item, index) => (
            <div key={index} className={`flex items-center gap-3 p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
              {item.preview ? (
                <img src={item.preview} alt={item.file.name} className="w-10 h-10 object-cover rounded" />
              ) : (
                getFileIcon(item.file.type)
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${textColor}`}>{item.file.name}</p>
                <p className={`text-xs ${mutedText}`}>{formatFileSize(item.file.size)}</p>
              </div>
              <button
                onClick={() => removeFile(index)}
                className={`p-1 rounded ${mutedText} hover:text-red-400 transition-colors`}
                aria-label="Remove file"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <div className="mt-4">
          <div className={`h-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div
              className="h-2 rounded-full bg-blue-500 transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className={`text-xs ${mutedText} mt-1 text-center`}>
            Uploading... {Math.round(uploadProgress)}%
          </p>
        </div>
      )}

      <div className="mt-4 flex gap-3">
        <button
          onClick={uploadFiles}
          disabled={files.length === 0 || uploading}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            files.length === 0 || uploading
              ? 'bg-gray-500 cursor-not-allowed text-gray-300'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          {uploading ? 'Uploading...' : `Upload ${files.length > 0 ? `(${files.length})` : ''}`}
        </button>
        <button
          onClick={onClose}
          className={`py-2 px-4 rounded-lg font-medium transition-colors ${
            theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
          } ${textColor}`}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default FileUploader;
