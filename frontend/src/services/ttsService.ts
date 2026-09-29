import { request } from './apiClient';
import { TTSModelMetadata, VoiceMetadata, TTSRequestPayload, TTSResponse } from '../types/tts';

/**
 * Independent TTS frontend service.
 * Handles TTS-specific backend interactions.
 */
export const ttsService = {
  /** Fetch available TTS models */
  async getModels(): Promise<TTSModelMetadata[]> {
    return request<TTSModelMetadata[]>('/tts/models');
  },

  /** Fetch available voices */
  async getVoices(): Promise<VoiceMetadata[]> {
    return request<VoiceMetadata[]>('/tts/voices');
  },

  /** Synthesize text into speech */
  async synthesizeSpeech(payload: TTSRequestPayload): Promise<TTSResponse> {
    return request<TTSResponse>('/tts/synthesize', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
