import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, AlertCircle, CheckCircle2, Play, Pause } from 'lucide-react';

interface AudioRecorderProps {
  onAudioReady: (blob: Blob, url: string) => void;
  onClear: () => void;
  hasAudio: boolean;
}

interface RecordingMeta {
  durationSeconds: number;
  sizeBytes: number;
  mimeType: string;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onAudioReady,
  onClear,
  hasAudio,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState<number>(0); // 0 to 100%
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recordingMeta, setRecordingMeta] = useState<RecordingMeta | null>(null);

  // Playback state for recorded preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    setErrorMsg(null);
    setRecordingMeta(null);
    setAudioLevel(0);

    try {
      // 1. Request microphone access with audio enhancement constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const audioTracks = stream.getAudioTracks();
      if (!audioTracks || audioTracks.length === 0) {
        throw new Error('No audio input devices were detected.');
      }

      const activeTrack = audioTracks[0];
      if (!activeTrack.enabled) {
        activeTrack.enabled = true;
      }

      console.log(`[AudioRecorder] Active track: ${activeTrack.label}, readyState: ${activeTrack.readyState}`);

      // 2. Set up Web Audio API volume visualizer
      try {
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkLevel = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          // Scale to percentage (0 - 100)
          const levelPct = Math.min(100, Math.round((avg / 128) * 100));
          setAudioLevel(levelPct);
          animFrameRef.current = requestAnimationFrame(checkLevel);
        };
        checkLevel();
      } catch (audioErr) {
        console.warn('[AudioRecorder] Could not initialize volume visualizer:', audioErr);
      }

      // 3. Determine best supported MIME type
      let chosenMime = '';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        chosenMime = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        chosenMime = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        chosenMime = 'audio/mp4';
      }

      chunksRef.current = [];
      const recorder = chosenMime
        ? new MediaRecorder(stream, { mimeType: chosenMime })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        // Clean up audio level analyzer
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(() => {});
        }
        setAudioLevel(0);

        // Stop all microphone tracks to release device
        stream.getTracks().forEach((track) => track.stop());

        if (chunksRef.current.length === 0) {
          setErrorMsg('No audio data was captured. Please ensure your microphone is unmuted and functional.');
          return;
        }

        const actualMime = recorder.mimeType || chosenMime || 'audio/webm';
        const audioBlob = new Blob(chunksRef.current, { type: actualMime });

        console.log(`[AudioRecorder] Completed: size=${audioBlob.size} bytes, type=${actualMime}`);

        if (audioBlob.size === 0) {
          setErrorMsg('Recorded audio is empty (0 bytes). Microphone produced no data.');
          return;
        }

        const url = URL.createObjectURL(audioBlob);
        setPreviewUrl(url);
        setRecordingMeta({
          durationSeconds: recordingSeconds,
          sizeBytes: audioBlob.size,
          mimeType: actualMime,
        });

        onAudioReady(audioBlob, url);
      };

      // Collect audio chunks every 100ms
      recorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      console.error('[AudioRecorder] getUserMedia error:', err);
      const msg = err instanceof Error ? err.message : 'Microphone access denied or unavailable.';
      setErrorMsg(`Microphone error: ${msg}`);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        // Flush remaining buffer data before stopping
        mediaRecorderRef.current.requestData();
      } catch (err) {
        console.warn('[AudioRecorder] requestData warning:', err);
      }
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setRecordingMeta(null);
    setErrorMsg(null);
    setAudioLevel(0);
    onClear();
  };

  const togglePreviewPlay = () => {
    if (!previewAudioRef.current) return;
    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.play().then(() => setIsPlayingPreview(true)).catch(console.error);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="audio-card">
      <div className="recording-controls">
        {!isRecording ? (
          <button
            type="button"
            className="record-btn start"
            onClick={startRecording}
          >
            <Mic className="w-5 h-5 mr-2" />
            <span>Start Recording</span>
          </button>
        ) : (
          <button
            type="button"
            className="record-btn stop pulsing"
            onClick={stopRecording}
          >
            <Square className="w-5 h-5 mr-2 fill-current" />
            <span>Stop Recording</span>
          </button>
        )}

        <div className="recording-status">
          {isRecording ? (
            <div className="recording-active-box">
              <div className="recording-indicator">
                <span className="rec-dot"></span>
                <span className="rec-text">Recording: {formatTime(recordingSeconds)}</span>
              </div>
              {/* Live Volume Meter */}
              <div className="audio-meter-container" title={`Mic input level: ${audioLevel}%`}>
                <div
                  className="audio-meter-bar"
                  style={{ width: `${Math.max(4, audioLevel)}%` }}
                />
              </div>
              <span className="audio-meter-label">
                {audioLevel > 5 ? 'Mic receiving sound' : 'Speak into mic...'}
              </span>
            </div>
          ) : hasAudio && recordingMeta ? (
            <div className="recording-ready-box">
              <div className="flex items-center text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4 mr-1.5 inline" />
                <span>Recording ready ({formatTime(recordingSeconds || recordingMeta.durationSeconds)})</span>
              </div>
              <div className="recording-meta-tags">
                <span className="meta-tag">Size: {formatSize(recordingMeta.sizeBytes)}</span>
                <span className="meta-tag">Format: {recordingMeta.mimeType.split(';')[0]}</span>
              </div>
            </div>
          ) : (
            <span className="text-slate-400 text-sm">Click Start Recording and speak into your microphone</span>
          )}
        </div>

        {hasAudio && !isRecording && (
          <button
            type="button"
            className="clear-btn"
            onClick={handleClear}
            title="Discard recording"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* In-Card Recorded Audio Preview */}
      {previewUrl && (
        <div className="recorder-preview-player">
          <audio
            ref={previewAudioRef}
            src={previewUrl}
            onEnded={() => setIsPlayingPreview(false)}
          />
          <button
            type="button"
            className="preview-play-btn"
            onClick={togglePreviewPlay}
          >
            {isPlayingPreview ? (
              <>
                <Pause className="w-3.5 h-3.5 mr-1" /> Pause Preview
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 mr-1" /> Listen to Your Recording
              </>
            )}
          </button>
          <span className="preview-hint">
            Confirm your voice is clear and audible before transcribing
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="error-banner mt-3">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
