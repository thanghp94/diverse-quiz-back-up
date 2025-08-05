
import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, FileText, HelpCircle, Target, PenTool } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface AdminTabNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const tabs: Tab[] = [
  { id: 'students', label: 'Students', icon: Users, color: 'bg-blue-500' },
  { id: 'topics', label: 'Topics', icon: BookOpen, color: 'bg-green-500' },
  { id: 'content', label: 'Content', icon: FileText, color: 'bg-purple-500' },
  { id: 'questions', label: 'Questions', icon: HelpCircle, color: 'bg-orange-500' },
  { id: 'matching', label: 'Matching', icon: Target, color: 'bg-red-500' },
  { id: 'writing-submissions', label: 'Writing Submissions', icon: PenTool, color: 'bg-indigo-500' }
];

export const AdminTabNavigation: React.FC<AdminTabNavigationProps> = ({
  activeTab,
  setActiveTab
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <Button
            key={tab.id}
            variant={isActive ? "default" : "outline"}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 ${isActive ? `${tab.color} text-white` : 'bg-white text-gray-700 border-gray-300'}`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Button>
        );
      })}
    </div>
  );
};
