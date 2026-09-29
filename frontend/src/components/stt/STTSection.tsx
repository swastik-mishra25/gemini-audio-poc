import React, { useState } from 'react';
import { Mic, UploadCloud, PlayCircle, AlertCircle } from 'lucide-react';
import { AudioRecorder } from './AudioRecorder';
import { AudioUploader } from './AudioUploader';
import { STTOptions } from './STTOptions';
import { TranscriptDisplay } from './TranscriptDisplay';
import { STTOptionsState, STTResponse, STTModelMetadata } from '../../types/stt';
import { sttService } from '../../services/sttService';

interface STTSectionProps {
  availableModels: STTModelMetadata[];
}

export const STTSection: React.FC<STTSectionProps> = ({ availableModels }) => {
  const [inputMode, setInputMode] = useState<'record' | 'upload'>('record');

  // Dedicated states for recorder vs uploader
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const [options, setOptions] = useState<STTOptionsState>({
    model: 'gemini-3.5-transcribe',
    language: 'auto',
    mode: 'verbatim',
    customVocabulary: '',
    enableDiarization: false,
    enableWordTimestamps: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<STTResponse | null>(null);

  // Active audio selection based on tab
  const activeBlob = inputMode === 'record' ? recordedBlob : uploadedFile;
  const activeUrl = inputMode === 'record' ? recordedUrl : uploadedUrl;

  const handleRecorderAudio = (blob: Blob, url: string) => {
    setRecordedBlob(blob);
    setRecordedUrl(url);
    setErrorMessage(null);
  };

  const handleClearRecorder = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedBlob(null);
    setRecordedUrl(null);
    setErrorMessage(null);
  };

  const handleUploaderAudio = (file: File) => {
    if (uploadedUrl) {
      URL.revokeObjectURL(uploadedUrl);
    }
    setUploadedFile(file);
    setUploadedUrl(URL.createObjectURL(file));
    setErrorMessage(null);
  };

  const handleClearUploader = () => {
    if (uploadedUrl) {
      URL.revokeObjectURL(uploadedUrl);
    }
    setUploadedFile(null);
    setUploadedUrl(null);
    setErrorMessage(null);
  };

  const handleOptionsChange = (updated: Partial<STTOptionsState>) => {
    setOptions((prev) => {
      const next = { ...prev, ...updated };

      // Prevent incompatible configurations dynamically
      if (updated.mode === 'smart') {
        next.enableDiarization = false;
        next.enableWordTimestamps = false;
      }

      if (updated.enableDiarization || updated.enableWordTimestamps) {
        next.mode = 'verbatim';
        next.customVocabulary = '';
      }

      if (updated.customVocabulary !== undefined && updated.customVocabulary.trim().length > 0) {
        next.enableDiarization = false;
        next.enableWordTimestamps = false;
      }

      return next;
    });
  };

  const handleTranscribe = async () => {
    if (!activeBlob) {
      setErrorMessage(
        inputMode === 'record'
          ? 'Please record your microphone audio first.'
          : 'Please select or upload an audio file first.'
      );
      return;
    }

    if (activeBlob.size === 0) {
      setErrorMessage('Audio sample is empty (0 bytes). Please re-record or select a valid audio file.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Determine file extension matching the binary payload
      let fileName = 'recording.webm';
      if (inputMode === 'upload' && uploadedFile) {
        fileName = uploadedFile.name;
      } else {
        const type = activeBlob.type.toLowerCase();
        if (type.includes('wav')) fileName = 'recording.wav';
        else if (type.includes('mp4')) fileName = 'recording.mp4';
        else if (type.includes('ogg')) fileName = 'recording.ogg';
        else fileName = 'recording.webm';
      }

      console.log(
        `[STTSection] Submitting: mode=${inputMode}, file=${fileName}, ` +
        `size=${activeBlob.size} bytes, type=${activeBlob.type}`
      );

      const response = await sttService.transcribeAudio(activeBlob, fileName, options);
      setResult(response);
    } catch (err: unknown) {
      console.error('[STTSection] Transcription error:', err);
      const msg = err instanceof Error ? err.message : 'Transcription failed. Please check backend connection.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="section-container">
      <div className="section-header">
        <div>
          <h2 className="section-main-title">Speech-to-Text (STT) Module</h2>
          <p className="section-description">
            Evaluate Speech &rarr; Text transcription using <code>gemini-3.5-transcribe</code> via Gemini Files API and Interactions API.
          </p>
        </div>
      </div>

      <div className="module-layout">
        {/* Left Column: Input & Options */}
        <div className="module-column">
          {/* Input Method Switcher */}
          <div className="input-tab-container">
            <button
              type="button"
              className={`input-tab-btn ${inputMode === 'record' ? 'active' : ''}`}
              onClick={() => {
                setInputMode('record');
                setErrorMessage(null);
              }}
            >
              <Mic className="w-4 h-4 mr-1.5" />
              <span>Record Microphone</span>
            </button>
            <button
              type="button"
              className={`input-tab-btn ${inputMode === 'upload' ? 'active' : ''}`}
              onClick={() => {
                setInputMode('upload');
                setErrorMessage(null);
              }}
            >
              <UploadCloud className="w-4 h-4 mr-1.5" />
              <span>Upload Audio File</span>
            </button>
          </div>

          {/* Audio Input Card */}
          {inputMode === 'record' ? (
            <AudioRecorder
              onAudioReady={handleRecorderAudio}
              onClear={handleClearRecorder}
              hasAudio={Boolean(recordedBlob)}
            />
          ) : (
            <AudioUploader
              onAudioSelected={handleUploaderAudio}
              onClear={handleClearUploader}
              selectedFile={uploadedFile}
            />
          )}

          {/* Audio Preview if audio ready */}
          {activeUrl && (
            <div className="audio-preview-box">
              <span className="text-xs text-slate-400 font-medium">Input Audio Preview:</span>
              <audio src={activeUrl} controls className="w-full mt-1 h-8" />
            </div>
          )}

          {/* STT Configuration Options */}
          <STTOptions
            options={options}
            onChange={handleOptionsChange}
            availableModels={availableModels}
          />

          {/* Action Button */}
          <div className="action-row">
            <button
              type="button"
              className="primary-action-btn"
              disabled={!activeBlob || isLoading}
              onClick={handleTranscribe}
            >
              <PlayCircle className="w-5 h-5 mr-2" />
              <span>{isLoading ? 'Uploading & Transcribing...' : 'Run Transcription Evaluation'}</span>
            </button>
          </div>

          {errorMessage && (
            <div className="error-alert">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Right Column: Output Transcript & Latency */}
        <div className="module-column">
          <TranscriptDisplay result={result} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};
