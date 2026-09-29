import React from 'react';
import { Mic, Volume2, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';

interface HeaderProps {
  apiKeyConfigured: boolean | null;
}

export const Header: React.FC<HeaderProps> = ({ apiKeyConfigured }) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="logo-icon">
          <Cpu className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="header-title">Gemini Audio POC</h1>
          <p className="header-subtitle">
            Independent STT &amp; TTS Evaluation Studio
          </p>
        </div>
      </div>

      <div className="header-right">
        <div className="module-badges">
          <span className="badge badge-stt">
            <Mic className="w-3.5 h-3.5 mr-1 inline" /> STT: gemini-3.5-transcribe
          </span>
          <span className="badge badge-tts">
            <Volume2 className="w-3.5 h-3.5 mr-1 inline" /> TTS: gemini-3.8-flash-tts
          </span>
        </div>

        <div className="api-status">
          {apiKeyConfigured === null ? (
            <span className="status-pill status-checking">Checking Backend...</span>
          ) : apiKeyConfigured ? (
            <span className="status-pill status-ok" title="GEMINI_API_KEY configured securely in backend">
              <ShieldCheck className="w-4 h-4 mr-1 text-emerald-400 inline" /> Backend Ready
            </span>
          ) : (
            <span className="status-pill status-warning" title="Configure GEMINI_API_KEY in backend/.env">
              <ShieldAlert className="w-4 h-4 mr-1 text-amber-400 inline" /> Key Missing in .env
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
