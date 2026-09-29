import { request } from './apiClient';
import { STTModelMetadata, STTOptionsState, STTResponse } from '../types/stt';

export interface LanguageOption {
  code: string;
  name: string;
}

/**
 * Independent STT frontend service.
 * Handles STT-specific backend interactions.
 */
export const sttService = {
  /** Fetch available STT models */
  async getModels(): Promise<STTModelMetadata[]> {
    return request<STTModelMetadata[]>('/stt/models');
  },

  /** Fetch supported STT languages */
  async getLanguages(): Promise<LanguageOption[]> {
    return request<LanguageOption[]>('/stt/languages');
  },

  /** Send audio recording or uploaded file to STT endpoint */
  async transcribeAudio(
    audioBlob: Blob,
    fileName: string,
    options: STTOptionsState
  ): Promise<STTResponse> {
    const formData = new FormData();
    formData.append('file', audioBlob, fileName);
    formData.append('model', options.model);
    formData.append('language', options.language);
    formData.append('mode', options.mode);
    formData.append('enable_diarization', String(options.enableDiarization));
    formData.append('enable_word_timestamps', String(options.enableWordTimestamps));
    
    if (options.customVocabulary.trim()) {
      formData.append('custom_vocabulary', options.customVocabulary.trim());
    }

    return request<STTResponse>('/stt/transcribe', {
      method: 'POST',
      body: formData,
    });
  },
};
