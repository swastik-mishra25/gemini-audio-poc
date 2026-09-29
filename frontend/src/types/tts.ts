export interface VoiceMetadata {
  id: string;
  name: string;
  gender?: string;
  description?: string;
}

export interface TTSModelMetadata {
  id: string;
  name: string;
  description: string;
  supported_voices: VoiceMetadata[];
  supports_style_prompting: boolean;
}

export interface TTSRequestPayload {
  text: string;
  model: string;
  voice?: string;
  language?: string;
  speech_style?: string;
}

export interface TTSResponse {
  audio_base64: string;
  mime_type: string;
  character_count: number;
  latency_ms: number;
  model_used: string;
  voice_used?: string;
}
