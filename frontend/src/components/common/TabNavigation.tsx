import React from 'react';
import { Mic, Volume2, Settings } from 'lucide-react';

export type TabId = 'stt' | 'tts' | 'config';

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="tab-nav">
      <button
        type="button"
        className={`tab-btn ${activeTab === 'stt' ? 'active' : ''}`}
        onClick={() => onTabChange('stt')}
      >
        <Mic className="w-5 h-5 mr-2" />
        <span className="tab-text">Speech-to-Text (STT)</span>
        <span className="tab-tag">Input: Audio</span>
      </button>

      <button
        type="button"
        className={`tab-btn ${activeTab === 'tts' ? 'active' : ''}`}
        onClick={() => onTabChange('tts')}
      >
        <Volume2 className="w-5 h-5 mr-2" />
        <span className="tab-text">Text-to-Speech (TTS)</span>
        <span className="tab-tag">Input: Text</span>
      </button>

      <button
        type="button"
        className={`tab-btn ${activeTab === 'config' ? 'active' : ''}`}
        onClick={() => onTabChange('config')}
      >
        <Settings className="w-5 h-5 mr-2" />
        <span className="tab-text">Configuration</span>
      </button>
    </nav>
  );
};
