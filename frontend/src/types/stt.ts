export type TranscriptionMode = 'verbatim' | 'smart';

export interface WordTimestamp {
  word: string;
  start_offset?: string;
  end_offset?: string;
  speaker?: string;
}

export interface DiarizedSegment {
  speaker: string;
  start_offset?: string;
  end_offset?: string;
  text: string;
}

export interface STTModelMetadata {
  id: string;
  name: string;
  description: string;
  supported_modes: string[];
  supports_diarization: boolean;
  supports_custom_vocabulary: boolean;
  supports_word_timestamps: boolean;
}

export interface STTOptionsState {
  model: string;
  language: string;
  mode: TranscriptionMode;
  customVocabulary: string;
  enableDiarization: boolean;
  enableWordTimestamps: boolean;
}

export interface STTResponse {
  transcript: string;
  detected_language?: string;
  diarized_segments?: DiarizedSegment[];
  word_timestamps?: WordTimestamp[];
  latency_ms: number;
  model_used: string;
  audio_duration_seconds?: number;
}
