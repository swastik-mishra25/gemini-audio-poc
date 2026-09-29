import React from 'react';
import { Sliders, Users, FileText, Globe, Clock, AlertTriangle } from 'lucide-react';
import { STTOptionsState, STTModelMetadata } from '../../types/stt';

interface STTOptionsProps {
  options: STTOptionsState;
  onChange: (updated: Partial<STTOptionsState>) => void;
  availableModels: STTModelMetadata[];
}

export const STTOptions: React.FC<STTOptionsProps> = ({
  options,
  onChange,
  availableModels,
}) => {
  const isSmartMode = options.mode === 'smart';
  const hasCustomVocab = Boolean(options.customVocabulary.trim().length > 0);
  const hasDiarization = options.enableDiarization;
  const hasTimestamps = options.enableWordTimestamps;

  // Compatibility flags
  const diarizationDisabled = isSmartMode || hasCustomVocab;
  const timestampsDisabled = isSmartMode || hasCustomVocab;
  const customVocabDisabled = hasDiarization || hasTimestamps;
  const smartModeDisabled = hasDiarization || hasTimestamps;

  return (
    <div className="options-panel">
      <div className="options-header">
        <Sliders className="w-4 h-4 mr-2 text-indigo-400" />
        <h3 className="options-title">STT Configuration</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Model Selection */}
        <div className="form-group">
          <label className="form-label" htmlFor="stt-model">
            STT Model
          </label>
          <select
            id="stt-model"
            className="form-select"
            value={options.model}
            onChange={(e) => onChange({ model: e.target.value })}
          >
            {availableModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.id})
              </option>
            ))}
          </select>
          <span className="form-hint">Official <code>gemini-3.5-transcribe</code> model</span>
        </div>

        {/* Language Selection */}
        <div className="form-group">
          <label className="form-label" htmlFor="stt-lang">
            <Globe className="w-3.5 h-3.5 mr-1 inline" /> Spoken Language
          </label>
          <select
            id="stt-lang"
            className="form-select"
            value={options.language}
            onChange={(e) => onChange({ language: e.target.value })}
          >
            <option value="auto">Auto Detect (Dynamic Code-Switching)</option>
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="es-ES">Spanish</option>
            <option value="fr-FR">French</option>
            <option value="de-DE">German</option>
            <option value="ja-JP">Japanese</option>
            <option value="hi-IN">Hindi</option>
            <option value="zh-CN">Chinese (Mandarin)</option>
            <option value="pt-BR">Portuguese (Brazil)</option>
            <option value="it-IT">Italian</option>
            <option value="ko-KR">Korean</option>
          </select>
          <span className="form-hint">Explicit code improves accuracy, or leave auto</span>
        </div>

        {/* Transcription Mode */}
        <div className="form-group">
          <label className="form-label" htmlFor="stt-mode">
            <FileText className="w-3.5 h-3.5 mr-1 inline" /> Transcription Mode
          </label>
          <select
            id="stt-mode"
            className="form-select"
            value={options.mode}
            onChange={(e) => onChange({ mode: e.target.value as 'verbatim' | 'smart' })}
          >
            <option value="verbatim">Verbatim (Exact words, pauses, disfluencies)</option>
            <option value="smart" disabled={smartModeDisabled}>
              Smart (Cleaned text, disfluency removal) {smartModeDisabled ? '(Incompatible with Diarization/Timestamps)' : ''}
            </option>
          </select>
          {smartModeDisabled ? (
            <span className="form-hint-warning">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              Smart mode disabled while Diarization or Word Timestamps is active
            </span>
          ) : (
            <span className="form-hint">
              {isSmartMode
                ? 'Smart mode formats dates/numbers and removes filler words'
                : 'Verbatim preserves raw spoken words'}
            </span>
          )}
        </div>

        {/* Speaker Diarization */}
        <div className="form-group">
          <label className="form-label">
            <Users className="w-3.5 h-3.5 mr-1 inline" /> Speaker Diarization
          </label>
          <div className="toggle-container">
            <label className={`switch ${diarizationDisabled ? 'disabled' : ''}`}>
              <input
                type="checkbox"
                disabled={diarizationDisabled}
                checked={options.enableDiarization}
                onChange={(e) => onChange({ enableDiarization: e.target.checked })}
              />
              <span className="slider round"></span>
            </label>
            <span className="toggle-label">
              {options.enableDiarization ? 'Enabled (Identifies speakers)' : 'Disabled'}
            </span>
          </div>
          {isSmartMode ? (
            <span className="form-hint-warning">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              Incompatible with Smart mode (switch to Verbatim)
            </span>
          ) : hasCustomVocab ? (
            <span className="form-hint-warning">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              Incompatible with Custom Vocabulary
            </span>
          ) : (
            <span className="form-hint">Detects and tags distinct speaker turns</span>
          )}
        </div>

        {/* Word-Level Timestamps */}
        <div className="form-group">
          <label className="form-label">
            <Clock className="w-3.5 h-3.5 mr-1 inline" /> Word Timestamps
          </label>
          <div className="toggle-container">
            <label className={`switch ${timestampsDisabled ? 'disabled' : ''}`}>
              <input
                type="checkbox"
                disabled={timestampsDisabled}
                checked={options.enableWordTimestamps}
                onChange={(e) => onChange({ enableWordTimestamps: e.target.checked })}
              />
              <span className="slider round"></span>
            </label>
            <span className="toggle-label">
              {options.enableWordTimestamps ? 'Enabled (Start & End offsets)' : 'Disabled'}
            </span>
          </div>
          {isSmartMode ? (
            <span className="form-hint-warning">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              Incompatible with Smart mode (switch to Verbatim)
            </span>
          ) : hasCustomVocab ? (
            <span className="form-hint-warning">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              Incompatible with Custom Vocabulary
            </span>
          ) : (
            <span className="form-hint">Outputs exact time offsets for each word</span>
          )}
        </div>

        {/* Custom Vocabulary */}
        <div className="form-group">
          <label className="form-label" htmlFor="custom-vocab">
            Custom Vocabulary
          </label>
          <input
            id="custom-vocab"
            type="text"
            className="form-input"
            disabled={customVocabDisabled}
            placeholder={
              customVocabDisabled
                ? 'Disabled when Diarization or Timestamps is enabled'
                : 'e.g. Gemini, FastAPI, Kubernetes, CRISPR'
            }
            value={options.customVocabulary}
            onChange={(e) => onChange({ customVocabulary: e.target.value })}
          />
          {customVocabDisabled ? (
            <span className="form-hint-warning">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              Incompatible with Diarization or Word Timestamps
            </span>
          ) : (
            <span className="form-hint">Comma-separated keywords to bias recognition</span>
          )}
        </div>
      </div>
    </div>
  );
};
