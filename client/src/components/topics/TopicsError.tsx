import React from 'react';
import Header from '@/components/Header';

export const TopicsError: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
      <Header />
      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-3">Topics</h1>
            <p className="text-lg text-white/80">
              Error loading topics
            </p>
          </div>
          <div className="text-center py-12">
            <p className="text-white">Error loading topics. Please try again later.</p>
          </div>
        </div>
      </div>
    </div>
  );
};