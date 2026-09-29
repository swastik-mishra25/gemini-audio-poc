import { STTModelMetadata } from './stt';
import { TTSModelMetadata } from './tts';

export interface ConfigStatusResponse {
  api_key_configured: boolean;
  environment: string;
  default_stt_model: string;
  default_tts_model: string;
  available_stt_models: STTModelMetadata[];
  available_tts_models: TTSModelMetadata[];
}
