
import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const SocketTest: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);

  const addMessage = (message: string) => {
    setMessages(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev.slice(0, 9)]);
  };

  const connectSocket = () => {
    if (socket) {
      socket.disconnect();
    }

    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected');
      setIsConnected(true);
      addMessage('✅ Connected to WebSocket');
      newSocket.emit('join-monitor', { test: true });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
      addMessage(`❌ Disconnected: ${reason}`);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      setIsConnected(false);
      addMessage(`❌ Connection error: ${error.message}`);
    });

    newSocket.on('quiz-activity', (data) => {
      addMessage(`📝 Quiz activity: ${JSON.stringify(data)}`);
    });

    newSocket.on('content-activity', (data) => {
      addMessage(`📚 Content activity: ${JSON.stringify(data)}`);
    });

    setSocket(newSocket);
  };

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      addMessage('🔌 Manually disconnected');
    }
  };

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔌 Socket Connection Test
          <Badge className={isConnected ? 'bg-green-500' : 'bg-red-500'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={connectSocket} disabled={isConnected}>
            Connect
          </Button>
          <Button onClick={disconnectSocket} disabled={!isConnected} variant="destructive">
            Disconnect
          </Button>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium">Connection Log:</h3>
          <div className="bg-gray-50 p-3 rounded max-h-64 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500">No messages yet...</p>
            ) : (
              messages.map((message, index) => (
                <div key={index} className="text-sm font-mono">
                  {message}
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
