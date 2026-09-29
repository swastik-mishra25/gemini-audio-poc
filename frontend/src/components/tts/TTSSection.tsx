import React, { useState } from 'react';
import { PlayCircle, AlertCircle } from 'lucide-react';
import { TextInput } from './TextInput';
import { TTSOptions } from './TTSOptions';
import { TTSPlayback } from './TTSPlayback';
import { TTSModelMetadata, VoiceMetadata, TTSResponse } from '../../types/tts';
import { ttsService } from '../../services/ttsService';

interface TTSSectionProps {
  availableModels: TTSModelMetadata[];
  availableVoices: VoiceMetadata[];
}

export const TTSSection: React.FC<TTSSectionProps> = ({
  availableModels,
  availableVoices,
}) => {
  const [text, setText] = useState<string>(
    'Welcome to the Gemini Audio Evaluation Studio. You can test high-fidelity speech synthesis across voices and styles.'
  );
  const [model, setModel] = useState<string>('gemini-3.8-flash-tts');
  const [voice, setVoice] = useState<string>('Aoede');
  const [language, setLanguage] = useState<string>('en-US');
  const [speechStyle, setSpeechStyle] = useState<string>('Warm, engaging and natural');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<TTSResponse | null>(null);

  const handleSynthesize = async () => {
    if (!text.trim()) {
      setErrorMessage('Please enter text to synthesize.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await ttsService.synthesizeSpeech({
        text: text.trim(),
        model,
        voice,
        language,
        speech_style: speechStyle.trim() || undefined,
      });
      setResult(response);
    } catch (err: unknown) {
      console.error('TTS Synthesis error:', err);
      const msg = err instanceof Error ? err.message : 'Speech synthesis failed. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="section-container">
      <div className="section-header">
        <div>
          <h2 className="section-main-title">Text-to-Speech (TTS) Module</h2>
          <p className="section-description">
            Evaluate Text &rarr; Speech synthesis using <code>gemini-3.8-flash-tts</code> and <code>gemini-3.8-flash-lite-tts</code> with customizable voices, Director&apos;s Chair style prompts, and latency measurement.
          </p>
        </div>
      </div>

      <div className="module-layout">
        {/* Left Column: Text Input & Configuration */}
        <div className="module-column">
          <TextInput value={text} onChange={setText} />

          <TTSOptions
            model={model}
            voice={voice}
            language={language}
            speechStyle={speechStyle}
            onModelChange={setModel}
            onVoiceChange={setVoice}
            onLanguageChange={setLanguage}
            onSpeechStyleChange={setSpeechStyle}
            availableModels={availableModels}
            availableVoices={availableVoices}
          />

          {/* Synthesize Button */}
          <div className="action-row">
            <button
              type="button"
              className="primary-action-btn tts-btn"
              disabled={!text.trim() || isLoading}
              onClick={handleSynthesize}
            >
              <PlayCircle className="w-5 h-5 mr-2" />
              <span>{isLoading ? 'Synthesizing Audio...' : 'Generate Speech Audio'}</span>
            </button>
          </div>

          {errorMessage && (
            <div className="error-alert">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Right Column: Audio Playback & Latency */}
        <div className="module-column">
          <TTSPlayback result={result} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};
