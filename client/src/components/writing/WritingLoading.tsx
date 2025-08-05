import React from 'react';
import { Loader2 } from 'lucide-react';
import { Header } from "@/components/shared";

export const WritingLoading: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-blue-600 to-purple-700">
      <Header />
      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-3">Writing</h1>
            <p className="text-lg text-white/80">Loading writing topics...</p>
          </div>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-white" />
            <span className="ml-3 text-white text-lg">
              Loading writing content...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};