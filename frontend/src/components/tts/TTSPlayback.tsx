import React from 'react';
import { Volume2, Music, CheckCircle2 } from 'lucide-react';
import { TTSResponse } from '../../types/tts';
import { LatencyCard } from '../common/LatencyCard';
import { AudioPlayer } from '../common/AudioPlayer';

interface TTSPlaybackProps {
  result: TTSResponse | null;
  isLoading: boolean;
}

export const TTSPlayback: React.FC<TTSPlaybackProps> = ({ result, isLoading }) => {
  if (isLoading) {
    return (
      <div className="transcript-panel loading">
        <div className="spinner"></div>
        <p className="loading-text">Synthesizing audio with Gemini TTS...</p>
        <p className="loading-sub">Generating expressive audio and measuring latency</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="transcript-panel empty">
        <Volume2 className="w-10 h-10 text-slate-500 mb-2" />
        <p className="empty-text">No audio generated yet</p>
        <p className="empty-sub">
          Type or select text and click &quot;Generate Speech Audio&quot; to evaluate text-to-speech synthesis
        </p>
      </div>
    );
  }

  const audioSrc = `data:${result.mime_type || 'audio/wav'};base64,${result.audio_base64}`;

  return (
    <div className="transcript-panel filled">
      <div className="transcript-header">
        <div className="flex items-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 mr-2" />
          <h3 className="section-title">Synthesized Audio Result</h3>
        </div>
        <div className="flex items-center text-xs text-slate-400 font-mono">
          <Music className="w-3.5 h-3.5 mr-1" />
          <span>{result.character_count} characters</span>
        </div>
      </div>

      {/* Latency Measurement Display */}
      <LatencyCard
        latencyMs={result.latency_ms}
        label="TTS Synthesis Latency"
        model={result.model_used}
      />

      {/* Audio Playback & Download */}
      <div className="tts-player-wrapper">
        <div className="tts-player-meta">
          <span>Voice: <strong>{result.voice_used || 'Default'}</strong></span>
          <span>Format: <strong>{result.mime_type}</strong></span>
        </div>
        <AudioPlayer
          src={audioSrc}
          mimeType={result.mime_type}
          downloadFilename={`gemini-tts-${result.model_used}-${Date.now()}.wav`}
        />
      </div>
    </div>
  );
};
