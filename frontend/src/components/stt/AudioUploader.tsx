import React, { useRef, useState } from 'react';
import { UploadCloud, FileAudio, X } from 'lucide-react';

interface AudioUploaderProps {
  onAudioSelected: (file: File) => void;
  onClear: () => void;
  selectedFile: File | null;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({
  onAudioSelected,
  onClear,
  selectedFile,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/') || /\.(wav|mp3|m4a|webm|ogg|flac)$/i.test(file.name)) {
        onAudioSelected(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAudioSelected(e.target.files[0]);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="audio-card">
      {!selectedFile ? (
        <div
          className={`dropzone ${isDragging ? 'drag-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud className="w-10 h-10 text-indigo-400 mb-2" />
          <p className="dropzone-text">
            <strong>Click to upload</strong> or drag and drop audio file
          </p>
          <p className="dropzone-sub">Supports WAV, MP3, M4A, WEBM, OGG, FLAC</p>
          <input
            ref={inputRef}
            type="file"
            accept="audio/*,.wav,.mp3,.m4a,.webm,.ogg,.flac"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="selected-file-banner">
          <div className="file-info">
            <FileAudio className="w-6 h-6 text-indigo-400 mr-3 flex-shrink-0" />
            <div>
              <p className="file-name">{selectedFile.name}</p>
              <p className="file-meta">
                {formatSize(selectedFile.size)} &bull; {selectedFile.type || 'audio file'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="clear-file-btn"
            onClick={onClear}
            title="Remove file"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
