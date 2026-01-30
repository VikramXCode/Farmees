import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  DollarSign,
  Leaf,
  Droplets,
  AlertTriangle,
  ChevronDown,
  RefreshCw,
  Download,
  ArrowUpRight,
  Target,
  Zap,
  Award,
  ThermometerSun,
} from 'lucide-react';
import { useFarm } from '../contexts/FarmContext';
import Sidebar, { MobileHeader } from '../components/layout/Sidebar';
import {
  StatCard,
  DashboardCard,
  ChartCard,
  ProgressCard,
  InfoCard,
  Badge,
  DataTable,
} from '../components/dashboard/DashboardComponents';

export default function AnalyticsPageNew() {
  const { lands } = useFarm();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [timeRange, setTimeRange] = useState('6months');
  const [selectedLandId] = useState<string | null>(location.state?.landId || null);

  // Clear location state after reading and optionally filter analytics by land
  useEffect(() => {
    if (location.state?.landId) {
      window.history.replaceState({}, document.title);
      // Here you can filter or customize analytics based on selectedLandId
      console.log('Showing analytics for land:', selectedLandId);
    }
  }, [location.state, selectedLandId]);

  // Calculate totals
  const totalArea = lands.reduce((sum: number, l: any) => sum + (l.landSize?.value || 0), 0);
  const activeCrops = lands.filter((l: any) => l.currentCrop).length;

  // Mock data for analytics
  const yieldData = {
    current: 42,
    previous: 38,
    target: 50,
    unit: 'quintals/acre',
  };

  const revenueData = {
    current: 245000,
    previous: 210000,
    growth: 16.7,
  };

  const expenseCategories = [
    { name: 'Seeds & Fertilizers', amount: 45000, percentage: 35, color: 'emerald' as const },
    { name: 'Labor Costs', amount: 35000, percentage: 27, color: 'blue' as const },
    { name: 'Irrigation', amount: 25000, percentage: 19, color: 'amber' as const },
    { name: 'Equipment', amount: 15000, percentage: 12, color: 'red' as const },
    { name: 'Other', amount: 9000, percentage: 7, color: 'green' as const },
  ];

  const cropPerformance = [
    { crop: 'Rice', yield: '45 q/acre', revenue: '₹1,80,000', status: 'excellent', trend: 12 },
    { crop: 'Wheat', yield: '38 q/acre', revenue: '₹95,000', status: 'good', trend: 5 },
    { crop: 'Cotton', yield: '22 q/acre', revenue: '₹1,10,000', status: 'average', trend: -3 },
    { crop: 'Sugarcane', yield: '350 q/acre', revenue: '₹2,45,000', status: 'excellent', trend: 8 },
  ];

  const insights = [
    {
      icon: TrendingUp,
      title: 'Yield Improving',
      description: 'Your rice yield has improved by 12% compared to last season. Keep up the good irrigation practices.',
      variant: 'success' as const,
    },
    {
      icon: AlertTriangle,
      title: 'Fertilizer Optimization',
      description: 'Consider reducing nitrogen application by 10%. Soil tests show adequate nitrogen levels.',
      variant: 'warning' as const,
    },
    {
      icon: Zap,
      title: 'Best Performing Crop',
      description: 'Sugarcane shows the highest revenue per acre. Consider expanding cultivation area.',
      variant: 'info' as const,
    },
  ];

  const columns = [
    { key: 'crop', header: 'Crop' },
    { key: 'yield', header: 'Yield' },
    { key: 'revenue', header: 'Revenue' },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => (
        <Badge variant={item.status === 'excellent' ? 'success' : item.status === 'good' ? 'info' : 'warning'}>
          {item.status}
        </Badge>
      ),
    },
    {
      key: 'trend',
      header: 'Trend',
      render: (item: any) => (
        <div className={`flex items-center gap-1 ${item.trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {item.trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span className="font-semibold">{Math.abs(item.trend)}%</span>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Header */}
      <MobileHeader onMenuClick={() => setMobileMenuOpen(true)} />

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64'}`}>
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-slate-200">
          <div className="px-4 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Farm Analytics</h1>
                <p className="text-slate-500">Track your farm performance and insights</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Time Range Selector */}
                <div className="relative">
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="1month">Last Month</option>
                    <option value="3months">Last 3 Months</option>
                    <option value="6months">Last 6 Months</option>
                    <option value="1year">Last Year</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <button className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  <RefreshCw className="w-5 h-5 text-slate-600" />
                </button>
                <button className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <StatCard
                title="Total Revenue"
                value={`₹${(revenueData.current / 1000).toFixed(0)}K`}
                subtitle="This season"
                icon={DollarSign}
                trend={{ value: revenueData.growth }}
                variant="success"
              />
              <StatCard
                title="Average Yield"
                value={`${yieldData.current}`}
                subtitle={yieldData.unit}
                icon={BarChart3}
                trend={{ value: ((yieldData.current - yieldData.previous) / yieldData.previous * 100) }}
              />
              <StatCard
                title="Total Area"
                value={`${totalArea.toFixed(1)} acres`}
                subtitle={`${lands.length} lands`}
                icon={Target}
              />
              <StatCard
                title="Active Crops"
                value={activeCrops}
                subtitle="Currently growing"
                icon={Leaf}
                variant="info"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend Chart */}
              <ChartCard
                title="Revenue Trend"
                subtitle="Monthly revenue over time"
                action={
                  <button className="text-sm font-medium text-slate-500 hover:text-slate-700">
                    View Details
                  </button>
                }
              >
                {/* Placeholder Chart */}
                <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl">
                  <BarChart3 className="w-16 h-16 text-emerald-300 mb-4" />
                  <p className="text-slate-500 text-sm">Revenue chart visualization</p>
                  <div className="flex items-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-xs text-slate-600">This Year</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-200" />
                      <span className="text-xs text-slate-600">Last Year</span>
                    </div>
                  </div>
                </div>
              </ChartCard>

              {/* Yield Comparison Chart */}
              <ChartCard
                title="Yield Comparison"
                subtitle="Current vs target yield"
                action={
                  <Badge variant="success">On Track</Badge>
                }
              >
                <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                  <Activity className="w-16 h-16 text-blue-300 mb-4" />
                  <p className="text-slate-500 text-sm">Yield comparison visualization</p>
                  <div className="w-full max-w-xs mt-6 space-y-3 px-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">Current</span>
                        <span className="font-semibold text-slate-900">{yieldData.current} q/acre</span>
                      </div>
                      <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(yieldData.current / yieldData.target) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">Target</span>
                        <span className="font-semibold text-slate-900">{yieldData.target} q/acre</span>
                      </div>
                      <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full w-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </ChartCard>
            </div>

            {/* Expense Breakdown & Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Expense Breakdown */}
              <DashboardCard title="Expense Breakdown" subtitle="Current season spending">
                <div className="space-y-4">
                  {expenseCategories.map((category, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-slate-700">{category.name}</span>
                        <span className="text-sm font-semibold text-slate-900">₹{(category.amount / 1000).toFixed(0)}K</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            category.color === 'emerald' ? 'bg-emerald-500' :
                            category.color === 'blue' ? 'bg-blue-500' :
                            category.color === 'amber' ? 'bg-amber-500' :
                            category.color === 'red' ? 'bg-red-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-600">Total Expenses</span>
                    <span className="text-xl font-bold text-slate-900">₹1,29,000</span>
                  </div>
                </div>
              </DashboardCard>

              {/* AI Insights */}
              <div className="lg:col-span-2">
                <DashboardCard title="AI Insights" subtitle="Personalized recommendations">
                  <div className="space-y-4">
                    {insights.map((insight, idx) => (
                      <InfoCard
                        key={idx}
                        icon={insight.icon}
                        title={insight.title}
                        description={insight.description}
                        variant={insight.variant}
                      />
                    ))}
                  </div>
                </DashboardCard>
              </div>
            </div>

            {/* Crop Performance Table */}
            <DashboardCard
              title="Crop Performance"
              subtitle="Season-wise crop analysis"
              action={
                <button className="flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                  View All
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              }
              noPadding
            >
              <DataTable
                columns={columns}
                data={cropPerformance}
                emptyMessage="No crop data available"
              />
            </DashboardCard>

            {/* Progress Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ProgressCard
                title="Yield Target"
                value={yieldData.current}
                max={yieldData.target}
                label="84% of season target achieved"
                color="green"
              />
              <ProgressCard
                title="Water Usage"
                value={72}
                max={100}
                label="Efficient water management"
                color="blue"
              />
              <ProgressCard
                title="Fertilizer Applied"
                value={85}
                max={100}
                label="Optimal application rate"
                color="amber"
              />
              <ProgressCard
                title="Pest Control"
                value={95}
                max={100}
                label="Excellent pest management"
                color="green"
              />
            </div>

            {/* Weather Impact Section */}
            <DashboardCard title="Weather Impact Analysis" subtitle="How weather affects your crops">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                      <ThermometerSun className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-amber-700">Temperature</p>
                      <p className="text-2xl font-bold text-amber-900">32°C avg</p>
                    </div>
                  </div>
                  <p className="text-sm text-amber-700">Optimal range for rice cultivation. No heat stress expected.</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Droplets className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-700">Rainfall</p>
                      <p className="text-2xl font-bold text-blue-900">125mm</p>
                    </div>
                  </div>
                  <p className="text-sm text-blue-700">Adequate rainfall this month. Reduce irrigation frequency.</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-5 border border-emerald-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Award className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-emerald-700">Conditions</p>
                      <p className="text-2xl font-bold text-emerald-900">Excellent</p>
                    </div>
                  </div>
                  <p className="text-sm text-emerald-700">Ideal growing conditions for the next 2 weeks.</p>
                </div>
              </div>
            </DashboardCard>
          </div>
        </div>
      </main>
    </div>
  );
}
