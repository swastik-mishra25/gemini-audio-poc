import React from 'react';
import { Timer, Zap } from 'lucide-react';

interface LatencyCardProps {
  latencyMs: number;
  label?: string;
  model?: string;
}

export const LatencyCard: React.FC<LatencyCardProps> = ({
  latencyMs,
  label = 'Processing Latency',
  model,
}) => {
  const getSpeedCategory = (ms: number) => {
    if (ms < 1000) return { text: 'Fast', color: 'badge-fast' };
    if (ms < 3000) return { text: 'Moderate', color: 'badge-moderate' };
    return { text: 'Elevated', color: 'badge-slow' };
  };

  const speed = getSpeedCategory(latencyMs);

  return (
    <div className="latency-card">
      <div className="latency-header">
        <span className="latency-title">
          <Timer className="w-4 h-4 mr-1 text-slate-400 inline" /> {label}
        </span>
        <span className={`latency-speed-tag ${speed.color}`}>
          <Zap className="w-3 h-3 mr-1 inline" /> {speed.text}
        </span>
      </div>

      <div className="latency-value-container">
        <span className="latency-number">{latencyMs.toFixed(1)}</span>
        <span className="latency-unit">ms</span>
        <span className="latency-sec">({(latencyMs / 1000).toFixed(2)}s)</span>
      </div>

      {model && (
        <div className="latency-model">
          Evaluated on: <code>{model}</code>
        </div>
      )}
    </div>
  );
};
