import React from 'react';
import { LiveClassPanel } from '@/components/LiveClassPanel';
import SimpleContentProgressPanel from '@/components/SimpleContentProgressPanel';
import { AssignmentPanel } from '@/components/AssignmentPanel';
import { PersonalContentPanel } from '@/components/PersonalContentPanel';
import { LeaderboardPanel } from '@/components/LeaderboardPanel';
import { Content } from '@/hooks/useContent';

interface TopicsHeaderProps {
  activeTab?: string | null;
  onContentClick: (info: { content: Content; contextList: Content[] }) => void;
}

export const TopicsHeader: React.FC<TopicsHeaderProps> = ({
  activeTab,
  onContentClick
}) => {
  const getTitle = () => {
    if (activeTab) {
      return `Quiz Mode: ${activeTab.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
    }
    return 'Bowl & Challenge Topics';
  };

  const getSubtitle = () => {
    if (activeTab) {
      return `Select a topic below to start your ${activeTab.replace('-', ' ')} quiz`;
    }
    return null;
  };

  return (
    <div className="text-center mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1"></div>
        <h1 className="text-3xl font-bold text-white">
          {getTitle()}
        </h1>
        <div className="flex-1 flex justify-end gap-3">
          <LiveClassPanel />
          <SimpleContentProgressPanel />
          <AssignmentPanel />
          <PersonalContentPanel onContentClick={onContentClick} />
          <LeaderboardPanel />
        </div>
      </div>
      {getSubtitle() && (
        <p className="text-lg text-white/80">
          {getSubtitle()}
        </p>
      )}
    </div>
  );
};