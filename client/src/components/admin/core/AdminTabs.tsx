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
            variant="outline"
            onClick={() => setActiveTab(tab.id as ActiveTab)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 h-8 text-sm font-medium transition-all duration-200
              ${isActive 
                ? `${tab.color} text-white border-transparent shadow-md` 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900'
              }
            `}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Button>
        );
      })}
    </div>
  );
};