import React from 'react';
import { Type, Sparkles } from 'lucide-react';

interface TextInputProps {
  value: string;
  onChange: (val: string) => void;
  maxLength?: number;
}

const PRESET_SNIPPETS = [
  {
    title: 'Customer Service',
    text: 'Thank you for calling Gemini Support! My name is Aoede, and I would be delighted to assist you with your account today.',
  },
  {
    title: 'Storytelling',
    text: 'Deep within the ancient forest, beneath the canopy of glowing silver trees, the whispers of the forgotten travelers could still be heard.',
  },
  {
    title: 'Technical Summary',
    text: 'The model architecture utilizes dual-stream cross-attention with optimized quantization, delivering sub-second synthesis latencies.',
  },
  {
    title: 'Urgent Alert',
    text: 'Attention all personnel: system maintenance will commence in fifteen minutes. Please save your work immediately.',
  },
];

export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  maxLength = 5000,
}) => {
  return (
    <div className="text-input-panel">
      <div className="text-input-header">
        <div className="flex items-center">
          <Type className="w-4 h-4 mr-1.5 text-indigo-400" />
          <label htmlFor="tts-text-area" className="text-input-title">
            Text to Synthesize
          </label>
        </div>
        <span className={`char-count ${value.length > maxLength * 0.9 ? 'limit-near' : ''}`}>
          {value.length} / {maxLength} chars
        </span>
      </div>

      <textarea
        id="tts-text-area"
        className="tts-textarea"
        rows={5}
        maxLength={maxLength}
        placeholder="Enter text here to generate natural speech audio with Gemini TTS..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {/* Preset Snippets */}
      <div className="preset-snippets">
        <span className="preset-label">
          <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-400 inline" /> Quick Samples:
        </span>
        <div className="preset-buttons">
          {PRESET_SNIPPETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              className="preset-btn"
              onClick={() => onChange(preset.text)}
              title={preset.text}
            >
              {preset.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
