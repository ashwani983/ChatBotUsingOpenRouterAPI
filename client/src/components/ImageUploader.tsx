import { useState, useRef, useCallback, useEffect } from 'react';

interface ImageAttachment {
  id: string;
  data: string;
  mimeType: string;
  name: string;
  size: number;
}

interface ImageUploaderProps {
  theme: 'light' | 'dark';
  onImageAnalyzed: (analysis: string) => void;
  onClose: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ImageUploader: React.FC<ImageUploaderProps> = ({ theme, onImageAnalyzed, onClose }) => {
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          
          const maxDimension = 1024;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Image too large. Max size is 5MB.');
      return;
    }

    setError(null);

    const compressedData = await compressImage(file);
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setImages(prev => [...prev, {
      id,
      data: compressedData,
      mimeType: file.type,
      name: file.name,
      size: file.size
    }]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(processFile);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) processFile(file);
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    setAnalysisResult(null);
  };

  const analyzeImages = async () => {
    if (images.length === 0) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const analyses: string[] = [];

      for (const img of images) {
        const response = await fetch('/api/vision/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: img.data,
            mimeType: img.mimeType
          })
        });

        if (!response.ok) {
          throw new Error('Failed to analyze image');
        }

        const data = await response.json();
        analyses.push(data.analysis);
      }

      const combinedAnalysis = analyses.join('\n\n---\n\n');
      setAnalysisResult(combinedAnalysis);
      onImageAnalyzed(combinedAnalysis);
    } catch (err) {
      setError('Failed to analyze image. Please try again.');
      console.error('Vision error:', err);
    } finally {
      setIsAnalyzing(false);
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
        <h3 className={`font-semibold ${textColor}`}>Image Analysis</h3>
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
        ref={dropZoneRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dropZoneBg}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            files.forEach(processFile);
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
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className={`${mutedText} text-sm`}>
          Drag & drop images here, or click to select
        </p>
        <p className={`${mutedText} text-xs mt-1`}>
          Supports: JPG, PNG, WebP, GIF (Max 5MB)
        </p>
      </div>

      {error && (
        <div className="mt-3 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
          {error}
        </div>
      )}

      {images.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${mutedText}`}>
              {images.length} image{images.length > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => setImages([])}
              className={`text-sm ${mutedText} hover:text-red-400 transition-colors`}
            >
              Clear all
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {images.map((img) => (
              <div key={img.id} className="relative group">
                <img
                  src={`data:${img.mimeType};base64,${img.data}`}
                  alt={img.name}
                  className="w-full h-20 object-cover rounded-lg"
                />
                <button
                  onClick={() => removeImage(img.id)}
                  className={`absolute top-1 right-1 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                  }`}
                  aria-label="Remove image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysisResult && (
        <div className={`mt-4 p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className={`text-sm font-medium ${textColor} mb-2`}>Analysis Result:</div>
          <div className={`text-sm ${mutedText} whitespace-pre-wrap`}>{analysisResult}</div>
        </div>
      )}

      <div className="mt-4 flex gap-3">
        <button
          onClick={analyzeImages}
          disabled={images.length === 0 || isAnalyzing}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            images.length === 0 || isAnalyzing
              ? 'bg-gray-500 cursor-not-allowed text-gray-300'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </span>
          ) : (
            'Analyze Images'
          )}
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

export default ImageUploader;
