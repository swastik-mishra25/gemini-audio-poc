import React, { useState } from 'react';
import { Copy, Check, User, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { STTResponse } from '../../types/stt';
import { LatencyCard } from '../common/LatencyCard';

interface TranscriptDisplayProps {
  result: STTResponse | null;
  isLoading: boolean;
}

export const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  result,
  isLoading,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<'text' | 'words'>('text');

  const handleCopy = () => {
    if (!result?.transcript) return;
    navigator.clipboard.writeText(result.transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="transcript-panel loading">
        <div className="spinner"></div>
        <p className="loading-text">Transcribing audio with Gemini STT...</p>
        <p className="loading-sub">
          Uploading via Files API &rarr; Evaluating <code>gemini-3.5-transcribe</code>
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="transcript-panel empty">
        <FileText className="w-10 h-10 text-slate-500 mb-2" />
        <p className="empty-text">No transcript generated yet</p>
        <p className="empty-sub">
          Record your microphone audio or upload an audio file to evaluate speech-to-text
        </p>
      </div>
    );
  }

  const hasWordTimestamps = Boolean(result.word_timestamps && result.word_timestamps.length > 0);

  return (
    <div className="transcript-panel filled">
      <div className="transcript-header">
        <div className="flex items-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 mr-2" />
          <h3 className="section-title">Transcription Result</h3>
        </div>

        <div className="header-actions">
          {hasWordTimestamps && (
            <div className="view-toggle mr-2">
              <button
                type="button"
                className={`view-toggle-btn ${activeView === 'text' ? 'active' : ''}`}
                onClick={() => setActiveView('text')}
              >
                Text
              </button>
              <button
                type="button"
                className={`view-toggle-btn ${activeView === 'words' ? 'active' : ''}`}
                onClick={() => setActiveView('words')}
              >
                Timestamps ({result.word_timestamps?.length})
              </button>
            </div>
          )}

          <button
            type="button"
            className="action-btn"
            onClick={handleCopy}
            title="Copy transcript"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400 mr-1" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" /> Copy Text
              </>
            )}
          </button>
        </div>
      </div>

      {/* Latency Measurement Display */}
      <LatencyCard
        latencyMs={result.latency_ms}
        label="STT Processing Latency"
        model={result.model_used}
      />

      {/* Main Transcript Text View */}
      {activeView === 'text' && (
        <div className="transcript-content-box">
          <div className="transcript-label">Transcript:</div>
          <p className="transcript-text">{result.transcript}</p>
        </div>
      )}

      {/* Word-Level Timestamps View */}
      {activeView === 'words' && hasWordTimestamps && (
        <div className="words-box">
          <div className="words-title">
            <Clock className="w-4 h-4 mr-1.5 text-indigo-400 inline" /> Word-Level Timestamps
          </div>
          <div className="words-table-wrapper">
            <table className="words-table">
              <thead>
                <tr>
                  <th>Word</th>
                  {result.word_timestamps?.some((w) => w.speaker) && <th>Speaker</th>}
                  <th>Start</th>
                  <th>End</th>
                </tr>
              </thead>
              <tbody>
                {result.word_timestamps?.map((w, idx) => (
                  <tr key={idx}>
                    <td className="font-semibold text-white">{w.word}</td>
                    {result.word_timestamps?.some((item) => item.speaker) && (
                      <td>
                        <span className="speaker-tag">{w.speaker || '-'}</span>
                      </td>
                    )}
                    <td className="font-mono text-slate-400">{w.start_offset || '-'}</td>
                    <td className="font-mono text-slate-400">{w.end_offset || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Speaker Diarization Breakdown */}
      {result.diarized_segments && result.diarized_segments.length > 0 && (
        <div className="diarization-box">
          <div className="diarization-title">
            <User className="w-4 h-4 mr-1.5 text-indigo-400 inline" /> Speaker Diarization Breakdown
          </div>
          <div className="diarization-list">
            {result.diarized_segments.map((seg, idx) => (
              <div key={idx} className="diarization-item">
                <div className="speaker-badge">
                  <span>{seg.speaker}</span>
                  {(seg.start_offset || seg.end_offset) && (
                    <span className="timestamp">
                      [{seg.start_offset || '0s'} &rarr; {seg.end_offset || ''}]
                    </span>
                  )}
                </div>
                <div className="speaker-text">{seg.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
