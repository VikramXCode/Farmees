import { useState } from 'react';
import { createEscalation } from '../../services/escalationService';

type Props = {
  userId: string;
  landId?: string;
  getQueryContext: () => { query: string; context?: any; suggestions?: string[] };
};

export default function EscalateButton({ userId, landId, getQueryContext }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
      <button onClick={onClick} disabled={loading} className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded disabled:opacity-60 disabled:cursor-not-allowed">
        {loading ? 'Escalating…' : 'Escalate to Agri Officer'}
      </button>
      {message && <div className="text-sm mt-2 text-green-700">{message}</div>}
    </div>
  );
}
