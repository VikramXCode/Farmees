import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useFarm } from '../../contexts/FarmContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { fetchKeralaMarketDataBackend, MarketRecord } from '../../services/marketService';

export default function MarketAnalysis() {
  const { lands, selectedLandId } = useFarm();
  const { t } = useLanguage();
  const selectedLand = lands.find(land => land.id === selectedLandId);

  const [marketData, setMarketData] = useState<Array<any>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // Using backend as the only data source

  const processRecords = (records: MarketRecord[]) => {
    const grouped: Record<string, any> = {};
    records.forEach(r => {
      const key = `${r.commodity}||${r.market}`;
      if (!grouped[key]) {
        grouped[key] = {
          crop: r.commodity,
          market: r.market,
          district: r.district,
          priceHistory: [],
          currentPrice: r.modal_price ?? r.max_price ?? r.min_price ?? 0,
          previousPrice: null,
          trend: 'stable',
          change: '0.0%',
          demand: 'medium',
          forecast: '',
          volume: 0,
          avgPrice: r.modal_price ?? r.max_price ?? r.min_price ?? 0,
        };
      }

      const item = grouped[key];
      item.volume = (item.volume || 0) + 1;
      if (r.modal_price) item.priceHistory.push(r.modal_price);
      if (r.min_price) item.priceHistory.push(r.min_price);
      if (r.max_price) item.priceHistory.push(r.max_price);
    });

    const transformed = Object.values(grouped).map((g: any) => {
      const history = Array.from(new Set(g.priceHistory || [])).slice(-4);
      const lastRaw = history[history.length - 1] ?? g.currentPrice;
      const prevRaw = history[history.length - 2] ?? null;
      let trend = 'stable';
      let change = '0.0%';
      if (prevRaw != null) {
        const lastNum = Number(lastRaw || 0);
        const prevNum = Number(prevRaw || 0);
        const diff = lastNum - prevNum;
        const pct = prevNum > 0 ? (diff / prevNum) * 100 : 0;
        change = (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
        trend = pct > 0.5 ? 'up' : pct < -0.5 ? 'down' : 'stable';
      }

      const historyNums = history.map((v: any) => Number(v)).filter((n: number) => Number.isFinite(n));
      const currentPrice = Number(lastRaw || g.currentPrice || 0);
      const previousPrice = prevRaw != null ? Number(prevRaw) : null;

      return {
        ...g,
        priceHistory: historyNums.length ? historyNums : [currentPrice],
        previousPrice,
        currentPrice,
        change,
        trend,
      };
    });

    setMarketData(transformed);
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(null);
      setLoading(true);
      try {
        const commodity = (selectedLand && selectedLand.currentCrop) ? selectedLand.currentCrop : undefined;
        const records: MarketRecord[] = await fetchKeralaMarketDataBackend(commodity);
        if (cancelled) return;
        processRecords(records);
      } catch (e: any) {
        if (e.name === 'AbortError') return;
        if (!cancelled) setError(e?.message || 'Failed to load market data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [selectedLand]);

  // Show only selected land's crop if provided; otherwise show all
  const filteredMarketData = selectedLand && selectedLand.currentCrop
    ? marketData.filter((item: any) => String(item.crop || '').toLowerCase().includes(String(selectedLand.currentCrop || '').toLowerCase()))
    : marketData;

  const visibleData = filteredMarketData;

  // Pagination: show 5 initially with Load More
  const [visibleCount, setVisibleCount] = useState<number>(5);
  useEffect(() => { setVisibleCount(5); }, [selectedLand, marketData]);
  const pagedData = visibleData.slice(0, visibleCount);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-100';
      case 'down':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case 'high':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Deterministic color + stroke style per series (commodity||market)
  const hashString = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  };
  const palette = ['#16a34a', '#2563eb', '#f59e0b', '#9333ea', '#14b8a6', '#e11d48', '#4f46e5', '#10b981'];
  const getSeriesStyle = (key: string) => {
    const h = hashString(key);
    const color = palette[h % palette.length];
    const dashStyles = ['', '4 3', '2 2'];
    const dash = dashStyles[h % dashStyles.length];
    return { color, dash };
  };

  // Neat SVG sparkline with subtle grid
  const PriceChart = ({ data }: { data: any }) => {
  const history: number[] = (data.priceHistory || []).map(Number).filter((n: number) => Number.isFinite(n));
    if (!history.length) return <div className="h-24 bg-gray-50 rounded-lg p-2 flex items-center justify-center text-gray-500 text-sm">No data</div>;
    const w = 260, h = 96, pad = 8;
    const max = Math.max(...history);
    const min = Math.min(...history);
    const range = max - min || 1;
    const stepX = history.length > 1 ? (w - pad * 2) / (history.length - 1) : 0;
    const points = history.map((v, i) => {
      const x = pad + i * stepX;
      const y = pad + (1 - (v - min) / range) * (h - pad * 2);
      return `${x},${y}`;
    }).join(' ');
    const gridY = [0.25, 0.5, 0.75].map(f => pad + f * (h - pad * 2));
    const currentPrice = data.currentPrice;
    const seriesKey = `${data.crop || ''}||${data.market || ''}`;
    const { color, dash } = getSeriesStyle(seriesKey);
    const lastX = pad + (history.length - 1) * stepX;
    const areaPoints = `${points} ${lastX},${h - pad} ${pad},${h - pad}`;
    return (
      <div className="h-24 bg-white rounded-lg p-2 border border-gray-200 relative">
        <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} className="text-gray-300">
          {gridY.map((gy, idx) => (
            <line key={idx} x1={pad} x2={w - pad} y1={gy} y2={gy} stroke="currentColor" strokeWidth="0.5" />
          ))}
          <polygon points={areaPoints} fill={color} opacity="0.08" />
          <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeDasharray={dash} />
          {history.map((v, i) => {
            const x = pad + i * stepX;
            const y = pad + (1 - (v - min) / range) * (h - pad * 2);
            const isLast = i === history.length - 1;
            return (
              <circle key={i} cx={x} cy={y} r={isLast ? 3 : 2} fill={isLast ? color : '#fff'} stroke={color} strokeWidth="1.5" />
            );
          })}
        </svg>
        <div className="absolute top-1 right-2 text-xs font-medium text-blue-600">₹{formatNum(currentPrice)}</div>
      </div>
    );
  };

  // Market KPIs for the visible page
  const priceValues = pagedData
    .map((i: any) => Number(i.currentPrice))
    .filter((n: number) => Number.isFinite(n));
  const avgPrice = priceValues.length ? Math.round(priceValues.reduce((a: number, b: number) => a + b, 0) / priceValues.length) : null;
  const highestPrice = priceValues.length ? Math.max(...priceValues) : null;
  const lowestPrice = priceValues.length ? Math.min(...priceValues) : null;
  const marketsCount = pagedData.length ? pagedData.length : null;
  const trendingUpCount = pagedData.length ? pagedData.filter((item: any) => item.trend === 'up').length : null;

  const formatNum = (v: any) => {
    if (v == null) return '—';
    const n = Number(v);
    return Number.isFinite(n) ? n.toLocaleString() : '—';
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <TrendingUp className="w-6 h-6 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-green-800">{t('market_analysis')}</h3>
        </div>
      </div>

      {selectedLand && (
        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <p className="text-green-800 text-sm font-medium">
            📊 Showing market data for: {selectedLand.name} ({selectedLand.currentCrop})
          </p>
        </div>
      )}

      {loading && (
        <div className="p-4 bg-yellow-50 rounded-lg mb-6">Loading market data...</div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-6">Error: {error}</div>
      )}

      {/* Source is backend; no CSV upload */}

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{avgPrice != null ? `₹${formatNum(avgPrice)}` : '—'}</div>
            <div className="text-sm text-gray-600">Average Price</div>
            <div className="text-xs text-green-600 flex items-center justify-center mt-1">
              {trendingUpCount != null ? `${trendingUpCount} trending up` : 'Awaiting data'}
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{highestPrice != null ? `₹${formatNum(highestPrice)}` : '—'}</div>
            <div className="text-sm text-gray-600">Highest Price</div>
            <div className="text-xs text-blue-600">{highestPrice != null ? 'Across selected view' : 'Awaiting data'}</div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{lowestPrice != null ? `₹${formatNum(lowestPrice)}` : '—'}</div>
            <div className="text-sm text-gray-600">Lowest Price</div>
            <div className="text-xs text-purple-600">{lowestPrice != null ? 'Across selected view' : 'Awaiting data'}</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{marketsCount != null ? marketsCount : '—'}</div>
            <div className="text-sm text-gray-600">Markets Listed</div>
            <div className="text-xs text-orange-600">{marketsCount != null ? 'In this view' : 'Awaiting data'}</div>
          </div>
        </div>
      </div>

      {/* Market Listings */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-800">{t('market_prices')}</h4>
        <p className="text-sm text-gray-500 mb-2">Filtered by: {selectedLand && selectedLand.currentCrop ? selectedLand.currentCrop : 'All Crops'}</p>
        {pagedData.length > 0 && (
          <div className="space-y-4">
            {pagedData.map((item, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="font-semibold text-gray-800">{item.crop}</h5>
                    <p className="text-sm text-gray-600">{item.market}{item.district ? `, ${item.district}` : ''}</p>
                    {/* Demand indicator */}
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDemandColor(item.demand)}`}>
                        {item.demand} demand
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-800">₹{formatNum(item.currentPrice)}</div>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(item.trend)}`}>
                      {getTrendIcon(item.trend)}
                      <span className="ml-1">{item.change}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Prev: {item.previousPrice != null ? `₹${formatNum(item.previousPrice)}` : '—'}</div>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Price Trend Analysis</span>
                    <span className="text-xs text-gray-500">Last {item.priceHistory?.length || 0} records</span>
                  </div>
                  <PriceChart data={item} />
                </div>
              </div>
            ))}
            {visibleCount < visibleData.length && (
              <div className="flex justify-center">
                <button
                  onClick={() => setVisibleCount(c => c + 5)}
                  className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors rounded text-sm font-medium"
                >
                  Load more ({visibleData.length - visibleCount} more)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}