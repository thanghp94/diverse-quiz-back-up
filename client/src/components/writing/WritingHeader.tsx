import React from 'react';
import { PenTool } from 'lucide-react';
import { LiveClassPanel } from '@/components/live-class';
import { SimpleContentProgressPanel } from '@/components/content-management/interactions/progress/SimpleContentProgressPanel';
import { AssignmentPanel } from '@/components/shared';
import { PersonalContentPanel } from '@/components/content-management/activities/personal/PersonalContentPanel';
import { LeaderboardPanel } from '@/components/shared';
import { Content } from '@/hooks/useContent';

interface WritingHeaderProps {
  onContentClick: (info: { content: Content; contextList: Content[] }) => void;
}

export const WritingHeader: React.FC<WritingHeaderProps> = ({
  onContentClick
}) => {
  return (
    <div className="text-center mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1"></div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <PenTool className="h-8 w-8" />
          Writing & Creative Expression
        </h1>
        <div className="flex-1 flex justify-end gap-3">
          <LiveClassPanel />
          <SimpleContentProgressPanel />
          <AssignmentPanel />
          <PersonalContentPanel onContentClick={onContentClick} />
          <LeaderboardPanel />
        </div>
      </div>
      <p className="text-lg text-white/80">
        Explore writing topics and develop your creative expression skills
      </p>
    </div>
  );
};