import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/common/Header';
import { TabNavigation, TabId } from './components/common/TabNavigation';
import { STTSection } from './components/stt/STTSection';
import { TTSSection } from './components/tts/TTSSection';
import { ConfigSection } from './components/config/ConfigSection';
import { configService } from './services/configService';
import { sttService } from './services/sttService';
import { ttsService } from './services/ttsService';
import { ConfigStatusResponse } from './types/config';
import { STTModelMetadata } from './types/stt';
import { TTSModelMetadata, VoiceMetadata } from './types/tts';

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('stt');

  const [configStatus, setConfigStatus] = useState<ConfigStatusResponse | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState<boolean>(false);

  const [sttModels, setSttModels] = useState<STTModelMetadata[]>([
    {
      id: 'gemini-3.5-transcribe',
      name: 'Gemini 3.5 Transcribe',
      description: 'Speech-to-text with smart and verbatim modes',
      supported_modes: ['smart', 'verbatim'],
      supports_diarization: true,
      supports_custom_vocabulary: true,
      supports_word_timestamps: true,
    },
  ]);

  const [ttsModels, setTtsModels] = useState<TTSModelMetadata[]>([
    {
      id: 'gemini-3.8-flash-tts',
      name: 'Gemini 3.8 Flash TTS',
      description: 'High fidelity expressive speech synthesis',
      supported_voices: [],
      supports_style_prompting: true,
    },
    {
      id: 'gemini-3.8-flash-lite-tts',
      name: 'Gemini 3.8 Flash-Lite TTS',
      description: 'Ultra fast lightweight speech synthesis',
      supported_voices: [],
      supports_style_prompting: true,
    },
  ]);

  const [ttsVoices, setTtsVoices] = useState<VoiceMetadata[]>([
    { id: 'Aoede', name: 'Aoede', gender: 'Female', description: 'Warm and clear' },
    { id: 'Charon', name: 'Charon', gender: 'Male', description: 'Deep and steady' },
    { id: 'Fenrir', name: 'Fenrir', gender: 'Male', description: 'Energetic and direct' },
    { id: 'Kore', name: 'Kore', gender: 'Female', description: 'Calm and conversational' },
    { id: 'Puck', name: 'Puck', gender: 'Neutral', description: 'Friendly and animated' },
  ]);

  const fetchConfig = useCallback(async () => {
    setIsConfigLoading(true);
    try {
      const status = await configService.getStatus();
      setConfigStatus(status);
      if (status.available_stt_models?.length) {
        setSttModels(status.available_stt_models);
      }
      if (status.available_tts_models?.length) {
        setTtsModels(status.available_tts_models);
      }
    } catch {
      // Backend may be offline during initial scaffolding
      setConfigStatus(null);
    } finally {
      setIsConfigLoading(false);
    }
  }, []);

  const fetchMetadata = useCallback(async () => {
    try {
      const [modelsSTT, modelsTTS, voices] = await Promise.allSettled([
        sttService.getModels(),
        ttsService.getModels(),
        ttsService.getVoices(),
      ]);

      if (modelsSTT.status === 'fulfilled' && modelsSTT.value.length) {
        setSttModels(modelsSTT.value);
      }
      if (modelsTTS.status === 'fulfilled' && modelsTTS.value.length) {
        setTtsModels(modelsTTS.value);
      }
      if (voices.status === 'fulfilled' && voices.value.length) {
        setTtsVoices(voices.value);
      }
    } catch {
      // Backend may be offline during initial scaffolding
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchMetadata();
  }, [fetchConfig, fetchMetadata]);

  return (
    <div className="app-layout">
      {/* Top Header */}
      <Header apiKeyConfigured={configStatus?.api_key_configured ?? null} />

      {/* Main Navigation Tabs: STT, TTS, Configuration */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Section Content */}
      <main className="app-main-content">
        {activeTab === 'stt' && <STTSection availableModels={sttModels} />}

        {activeTab === 'tts' && (
          <TTSSection availableModels={ttsModels} availableVoices={ttsVoices} />
        )}

        {activeTab === 'config' && (
          <ConfigSection
            status={configStatus}
            isLoading={isConfigLoading}
            onRefresh={fetchConfig}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          Gemini Audio Evaluation POC &bull; Non-Live API Architecture &bull; Official{' '}
          <code>google-genai</code> SDK
        </p>
      </footer>
    </div>
  );
}

export default App;
