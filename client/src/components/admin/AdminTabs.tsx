import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, FileText, HelpCircle, Target, Plus, Calendar, PenTool, ClipboardList, TreePine, Layers } from 'lucide-react';
import { ActiveTab } from './types';

interface AdminTabsProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const AdminTabs: React.FC<AdminTabsProps> = ({
  activeTab,
  setActiveTab
}) => {
  const tabs = [
    { id: 'students', label: 'Students', icon: Users, color: 'bg-blue-500' },
    { id: 'topics', label: 'Topics', icon: BookOpen, color: 'bg-green-500' },
    { id: 'content', label: 'Content', icon: FileText, color: 'bg-purple-500' },
    { id: 'content-hierarchy', label: 'Content Hierarchy', icon: TreePine, color: 'bg-amber-500' },
    { id: 'collections', label: 'Collections', icon: Layers, color: 'bg-cyan-500' },
    { id: 'assignments', label: 'Assignments', icon: ClipboardList, color: 'bg-teal-500' },
    { id: 'questions', label: 'Questions', icon: HelpCircle, color: 'bg-orange-500' },
    { id: 'matching', label: 'Matching', icon: Target, color: 'bg-red-500' },
    { id: 'writing-submissions', label: 'Writing Submissions', icon: PenTool, color: 'bg-indigo-500' },
    { id: 'team', label: 'Team Management', icon: Users, color: 'bg-emerald-500' },
    { id: 'debates', label: 'Debate Scheduler', icon: Calendar, color: 'bg-purple-500' }
  ];

  return (
    <div className="flex flex-wrap gap-1 mb-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <Button
            key={tab.id}
            variant={isActive ? "default" : "outline"}
            onClick={() => setActiveTab(tab.id as ActiveTab)}
            className="justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-primary/90 flex items-center gap-1.5 px-3 py-1.5 h-8 bg-blue-500 text-white pl-[5px] pr-[5px] pt-[4px] pb-[4px]"
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Button>
        );
      })}
    </div>
  );
};