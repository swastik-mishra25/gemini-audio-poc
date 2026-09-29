import React from 'react';
import { ShieldCheck, ShieldAlert, Cpu, Settings, CheckCircle2, Lock } from 'lucide-react';
import { ConfigStatusResponse } from '../../types/config';

interface ConfigSectionProps {
  status: ConfigStatusResponse | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const ConfigSection: React.FC<ConfigSectionProps> = ({
  status,
  isLoading,
  onRefresh,
}) => {
  return (
    <div className="section-container">
      <div className="section-header">
        <div>
          <h2 className="section-main-title">System &amp; Architecture Configuration</h2>
          <p className="section-description">
            Backend environment settings, model definitions, and security status.
          </p>
        </div>
        <button
          type="button"
          className="refresh-btn"
          onClick={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? 'Checking...' : 'Refresh Status'}
        </button>
      </div>

      {/* Security Banner */}
      <div className="config-card security-card">
        <div className="security-icon-box">
          <Lock className="w-6 h-6 text-emerald-400" />
        </div>
        <div className="security-content">
          <h3 className="card-heading">Backend-Only Key Security</h3>
          <p className="card-description">
            Your <code>GEMINI_API_KEY</code> is stored securely on the backend server environment and is never transmitted to or stored within the browser frontend. All client interactions pass through sanitized FastAPI proxy routes.
          </p>
          <div className="security-status-row">
            <span className="status-label">API Key Configuration:</span>
            {status?.api_key_configured ? (
              <span className="security-pill success">
                <ShieldCheck className="w-4 h-4 mr-1 inline" /> Configured in backend/.env
              </span>
            ) : (
              <span className="security-pill warning">
                <ShieldAlert className="w-4 h-4 mr-1 inline" /> Not Configured (Set in backend/.env)
              </span>
            )}
            <span className="status-label ml-4">Environment:</span>
            <span className="security-pill neutral">{status?.environment || 'development'}</span>
          </div>
        </div>
      </div>

      <div className="config-grid">
        {/* STT Module Configuration Card */}
        <div className="config-card">
          <div className="config-card-header">
            <Cpu className="w-5 h-5 text-indigo-400 mr-2" />
            <h3 className="card-heading">Speech-to-Text (STT) Module</h3>
          </div>
          <p className="card-sub">Independent evaluation parameters</p>

          <div className="spec-list">
            <div className="spec-item">
              <span className="spec-name">Primary Model</span>
              <span className="spec-val">
                <code>{status?.default_stt_model || 'gemini-3.5-transcribe'}</code>
              </span>
            </div>
            <div className="spec-item">
              <span className="spec-name">Supported Modes</span>
              <span className="spec-val">Smart, Verbatim</span>
            </div>
            <div className="spec-item">
              <span className="spec-name">Speaker Diarization</span>
              <span className="spec-val text-emerald-400 flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Supported
              </span>
            </div>
            <div className="spec-item">
              <span className="spec-name">Custom Vocabulary</span>
              <span className="spec-val text-emerald-400 flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Supported
              </span>
            </div>
            <div className="spec-item">
              <span className="spec-name">SDK Integration</span>
              <span className="spec-val">Official <code>google-genai</code> (Python)</span>
            </div>
          </div>
        </div>

        {/* TTS Module Configuration Card */}
        <div className="config-card">
          <div className="config-card-header">
            <Settings className="w-5 h-5 text-indigo-400 mr-2" />
            <h3 className="card-heading">Text-to-Speech (TTS) Module</h3>
          </div>
          <p className="card-sub">Independent evaluation parameters</p>

          <div className="spec-list">
            <div className="spec-item">
              <span className="spec-name">High-Fidelity Model</span>
              <span className="spec-val">
                <code>gemini-3.8-flash-tts</code>
              </span>
            </div>
            <div className="spec-item">
              <span className="spec-name">Low-Latency Model</span>
              <span className="spec-val">
                <code>gemini-3.8-flash-lite-tts</code>
              </span>
            </div>
            <div className="spec-item">
              <span className="spec-name">Voice Personas</span>
              <span className="spec-val">Aoede, Charon, Fenrir, Kore, Puck</span>
            </div>
            <div className="spec-item">
              <span className="spec-name">Director&apos;s Chair Prompting</span>
              <span className="spec-val text-emerald-400 flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Supported
              </span>
            </div>
            <div className="spec-item">
              <span className="spec-name">Output Formats</span>
              <span className="spec-val">Audio WAV / Base64 Payload</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
