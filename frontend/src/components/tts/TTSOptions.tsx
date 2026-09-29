import React from 'react';
import { Sliders, Volume2, Globe, Wand2 } from 'lucide-react';
import { TTSModelMetadata, VoiceMetadata } from '../../types/tts';

interface TTSOptionsProps {
  model: string;
  voice: string;
  language: string;
  speechStyle: string;
  onModelChange: (model: string) => void;
  onVoiceChange: (voice: string) => void;
  onLanguageChange: (language: string) => void;
  onSpeechStyleChange: (style: string) => void;
  availableModels: TTSModelMetadata[];
  availableVoices: VoiceMetadata[];
}

const STYLE_PRESETS = [
  'Warm, friendly and welcoming',
  'Whispering excitedly, mysterious tone',
  'Authoritative news anchor, formal cadence',
  'Empathetic customer support specialist',
  'Energetic, fast-paced commercial pitch',
  'Calm, soothing bedtime meditation guide',
];

export const TTSOptions: React.FC<TTSOptionsProps> = ({
  model,
  voice,
  language,
  speechStyle,
  onModelChange,
  onVoiceChange,
  onLanguageChange,
  onSpeechStyleChange,
  availableModels,
  availableVoices,
}) => {
  return (
    <div className="options-panel">
      <div className="options-header">
        <Sliders className="w-4 h-4 mr-2 text-indigo-400" />
        <h3 className="options-title">TTS Configuration</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* TTS Model Selection */}
        <div className="form-group">
          <label className="form-label" htmlFor="tts-model-select">
            TTS Model
          </label>
          <select
            id="tts-model-select"
            className="form-select"
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
          >
            {availableModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.id})
              </option>
            ))}
          </select>
          <span className="form-hint">
            {model.includes('lite')
              ? 'Optimized for lowest latency'
              : 'Highest fidelity and expressive modulation'}
          </span>
        </div>

        {/* Voice Selection */}
        <div className="form-group">
          <label className="form-label" htmlFor="tts-voice-select">
            <Volume2 className="w-3.5 h-3.5 mr-1 inline" /> Voice Selection
          </label>
          <select
            id="tts-voice-select"
            className="form-select"
            value={voice}
            onChange={(e) => onVoiceChange(e.target.value)}
          >
            {availableVoices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.gender || 'Standard'}) - {v.description || ''}
              </option>
            ))}
          </select>
          <span className="form-hint">Selected Gemini voice persona</span>
        </div>

        {/* Language Selection */}
        <div className="form-group">
          <label className="form-label" htmlFor="tts-lang-select">
            <Globe className="w-3.5 h-3.5 mr-1 inline" /> Language
          </label>
          <select
            id="tts-lang-select"
            className="form-select"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
          >
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="es-ES">Spanish</option>
            <option value="fr-FR">French</option>
            <option value="de-DE">German</option>
            <option value="ja-JP">Japanese</option>
            <option value="hi-IN">Hindi</option>
          </select>
          <span className="form-hint">Target synthesis accent and pronunciation</span>
        </div>

        {/* Style Prompting / Director's Chair */}
        <div className="form-group">
          <label className="form-label" htmlFor="tts-style-input">
            <Wand2 className="w-3.5 h-3.5 mr-1 inline" /> Speech Style (Director&apos;s Chair)
          </label>
          <input
            id="tts-style-input"
            type="text"
            className="form-input"
            placeholder="e.g. whispering excitedly, sarcastic, warm and reassuring"
            value={speechStyle}
            onChange={(e) => onSpeechStyleChange(e.target.value)}
          />
          <span className="form-hint">Style directions guide cadence, mood, and inflection</span>
        </div>
      </div>

      {/* Style Presets */}
      <div className="style-preset-container">
        <span className="style-preset-label">Suggested Styles:</span>
        <div className="style-chips">
          {STYLE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              className="style-chip"
              onClick={() => onSpeechStyleChange(preset)}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
