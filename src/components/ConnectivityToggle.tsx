import { Wifi, WifiOff } from 'lucide-react';
import { useConnectivity } from '../contexts/ConnectivityContext';

export default function ConnectivityToggle() {
  const { online, toggle } = useConnectivity();
  return (
    <button
      onClick={toggle}
      title={online ? 'Online mode: using Groq/APIs' : 'Offline mode: cached/mocked data'}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
        online ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
      }`}
    >
      {online ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
      <span className="hidden sm:inline">{online ? 'Online' : 'Offline'}</span>
    </button>
  );
}
