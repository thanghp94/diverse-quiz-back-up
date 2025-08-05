import { LiveClassMonitor } from '@/components/LiveClassMonitor';

export default function LiveClass() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Live Class Monitor</h1>
          <p className="text-gray-600 mt-2">
            Monitor assignments within 3 hours of current Vietnam time and track student progress in real-time.
          </p>
        </div>
        
        <LiveClassMonitor />
      </div>
    </div>
  );
}