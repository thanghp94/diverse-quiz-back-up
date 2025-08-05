import React from 'react';
import Header from '@/components/Header';

export const WritingError: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-blue-600 to-purple-700">
      <Header />
      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-3">Writing</h1>
            <p className="text-lg text-white/80">
              Error loading writing topics
            </p>
          </div>
          <div className="text-center py-12">
            <p className="text-white">
              Error loading writing topics. Please try again later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};