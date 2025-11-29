import React, { useState, useEffect } from 'react';
import { Cpu, Wifi, WifiOff } from 'lucide-react';
import { lightweightOllamaService } from '../services/lightweightOllamaService';

export default function OllamaStatusIndicator() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [model, setModel] = useState<string>('');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const health = await lightweightOllamaService.healthCheck();
        if (health.status === 'healthy') {
          setStatus('online');
          const stats = lightweightOllamaService.getStats();
          setModel(stats.model);
        } else {
          setStatus('offline');
        }
      } catch (error) {
        setStatus('offline');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'offline': return 'text-red-600';
      case 'checking': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'online': return <Cpu className="w-4 h-4" />;
      case 'offline': return <WifiOff className="w-4 h-4" />;
      case 'checking': return <Wifi className="w-4 h-4" />;
      default: return <WifiOff className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online': return `Ollama (${model})`;
      case 'offline': return 'Ollama Offline';
      case 'checking': return 'Checking...';
      default: return 'Ollama Unknown';
    }
  };

  return (
    <div className={`flex items-center gap-2 text-xs ${getStatusColor()}`} title={getStatusText()}>
      {getStatusIcon()}
      <span className="hidden sm:inline">{getStatusText()}</span>
    </div>
  );
}
