import React from 'react';
import { LiveClassMonitor } from '@/components/LiveClassMonitor';
import Header from '@/components/Header';

const LiveClassPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Live Class Monitor Component */}
        <LiveClassMonitor />
      </div>
    </div>
  );
};

export default LiveClassPage;