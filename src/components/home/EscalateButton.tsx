import { useState } from 'react';
import { useConnectivity } from '../../contexts/ConnectivityContext';
import { createEscalation } from '../../services/escalationService';

type Props = {
  userId: string;
  landId?: string;
  getQueryContext: () => { query: string; context?: any; suggestions?: string[] };
};

export default function EscalateButton({ userId, landId, getQueryContext }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { online } = useConnectivity();

  const onClick = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const { query, context, suggestions } = getQueryContext();
      const res = await createEscalation({ userId, landId, query, context, suggestions, status: 'pending' });
      if (res?.success) setMessage('Escalated to local officer. They will contact you.');
      else setMessage('Escalation failed.');
    } catch (e) {
      setMessage('Escalation error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2">
      <button onClick={onClick} disabled={loading || !online} className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded disabled:opacity-60 disabled:cursor-not-allowed">
        {loading ? 'Escalating…' : (online ? 'Escalate to Agri Officer' : 'Go Online to Escalate')}
      </button>
      {!online && (
        <div className="text-xs mt-2 text-amber-700">Offline mode: escalation requires internet</div>
      )}
      {message && <div className="text-sm mt-2 text-green-700">{message}</div>}
    </div>
  );
}
