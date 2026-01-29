import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Plus,
  Leaf,
  TrendingUp,
  Droplets,
  Thermometer,
  Wind,
  Sun,
  CloudRain,
  Cloud,
  Camera,
  Sparkles,
  FlaskConical,
  ChevronRight,
  Bell,
  ArrowUpRight,
  Sprout,
  AlertTriangle,
  CheckCircle2,
  Coins,
  Activity,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFarm } from '../contexts/FarmContext';
import weatherService, { type WeatherData } from '../services/weatherService';
import Sidebar, { MobileHeader } from '../components/layout/Sidebar';
import {
  StatCard,
  DashboardCard,
  QuickAction,
  Badge,
  EmptyState,
  SearchInput,
} from '../components/dashboard/DashboardComponents';

export default function FarmerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lands, selectedLandId, selectLand, isLoading } = useFarm();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedLand = lands.find((l: any) => l.id === selectedLandId) || lands[0] || null;

  // Auto-select first land
  useEffect(() => {
    if (lands.length > 0 && !selectedLandId) {
      selectLand(lands[0].id);
    }
  }, [lands, selectedLandId, selectLand]);

  // Fetch weather
  useEffect(() => {
    const fetchWeather = async () => {
      if (!selectedLand?.latitude || !selectedLand?.longitude) {
        setWeatherData(null);
        return;
      }
      setWeatherLoading(true);
      try {
        const response = await weatherService.getCurrentWeather(
          selectedLand.latitude,
          selectedLand.longitude,
          selectedLand.location
        );
        if (response.success) {
          setWeatherData(response.weather);
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error);
      } finally {
        setWeatherLoading(false);
      }
    };
    fetchWeather();
  }, [selectedLandId, selectedLand?.latitude, selectedLand?.longitude, selectedLand?.location]);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getWeatherIcon = () => {
    if (!weatherData) return <Sun className="w-10 h-10" />;
    const desc = weatherData.current.description?.toLowerCase() || '';
    if (desc.includes('rain')) return <CloudRain className="w-10 h-10" />;
    if (desc.includes('cloud')) return <Cloud className="w-10 h-10" />;
    return <Sun className="w-10 h-10" />;
  };

  // Quick actions for the dashboard
  const quickActions = [
    { icon: Leaf, label: 'Get Crop Advice', description: 'AI-powered recommendations', path: '/crop-recommendation', variant: 'gradient' as const },
    { icon: FlaskConical, label: 'Analyze Soil', description: 'Upload soil report', path: '/soil-analyzer', variant: 'default' as const },
    { icon: Camera, label: 'Diagnose Disease', description: 'Scan your crops', path: '/diagnose', variant: 'default' as const },
    { icon: Sparkles, label: 'Ask AI', description: 'Chat with assistant', path: '/ai', variant: 'default' as const },
  ];

  // Recent activities (mock data)
  const recentActivities = [
    { icon: Leaf, title: 'Crop recommendation received', time: '2 hours ago', type: 'success' },
    { icon: AlertTriangle, title: 'Pest alert: Watch for aphids', time: '5 hours ago', type: 'warning' },
    { icon: CheckCircle2, title: 'Soil report uploaded', time: 'Yesterday', type: 'info' },
    { icon: Coins, title: 'Rice price increased by 5%', time: '2 days ago', type: 'success' },
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
        {/* Top Header */}
        <header className="hidden lg:block sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-slate-200">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{getTimeGreeting()}</p>
                <h1 className="text-2xl font-bold text-slate-900">
                  Welcome back, {user?.name?.split(' ')[0] || 'Farmer'} 👋
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search..."
                  className="w-72"
                />
                <button className="relative p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                  <Bell className="w-5 h-5 text-slate-600" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-32">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-600">Loading your farm data...</p>
              </div>
            </div>
          )}

          {/* No Lands State */}
          {!isLoading && lands.length === 0 && (
            <DashboardCard className="max-w-2xl mx-auto">
              <EmptyState
                icon={MapPin}
                title="No lands registered yet"
                description="Add your first farmland to get personalized crop recommendations, weather updates, and smart farming insights."
                action={{
                  label: 'Add Your First Land',
                  onClick: () => navigate('/add-land'),
                }}
              />
            </DashboardCard>
          )}

          {/* Main Dashboard */}
          {!isLoading && lands.length > 0 && (
            <div className="space-y-6">
              {/* Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <StatCard
                  title="Total Lands"
                  value={lands.length}
                  subtitle="Registered farms"
                  icon={MapPin}
                  variant="success"
                />
                <StatCard
                  title="Total Area"
                  value={`${lands.reduce((sum: number, l: any) => sum + (l.area || l.size || 0), 0).toFixed(1)} acres`}
                  subtitle="Under cultivation"
                  icon={Sprout}
                  trend={{ value: 12, label: 'vs last year' }}
                />
                <StatCard
                  title="Active Crops"
                  value={lands.filter((l: any) => l.currentCrop).length}
                  subtitle="Currently growing"
                  icon={Leaf}
                  variant="info"
                />
                <StatCard
                  title="Health Score"
                  value="Good"
                  subtitle="Overall farm health"
                  icon={Activity}
                  trend={{ value: 8 }}
                />
              </div>

              {/* Main Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - 2 cols on large screens */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Weather Card */}
                  <DashboardCard className="overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      {/* Current Weather */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                            {weatherLoading ? (
                              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              getWeatherIcon()
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Current Weather</p>
                            {weatherData ? (
                              <>
                                <p className="text-4xl font-bold text-slate-900">
                                  {Math.round(weatherData.current.temperature)}°C
                                </p>
                                <p className="text-slate-600 capitalize">
                                  {weatherData.current.description}
                                </p>
                              </>
                            ) : (
                              <p className="text-slate-400">Weather data unavailable</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Weather Details */}
                      {weatherData && (
                        <div className="flex gap-6 md:gap-8">
                          <div className="text-center">
                            <Droplets className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                            <p className="text-sm font-semibold text-slate-900">{weatherData.current.humidity}%</p>
                            <p className="text-xs text-slate-500">Humidity</p>
                          </div>
                          <div className="text-center">
                            <Wind className="w-6 h-6 text-slate-500 mx-auto mb-1" />
                            <p className="text-sm font-semibold text-slate-900">{weatherData.current.windSpeed} km/h</p>
                            <p className="text-xs text-slate-500">Wind</p>
                          </div>
                          <div className="text-center">
                            <Thermometer className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                            <p className="text-sm font-semibold text-slate-900">
                              {Math.round(weatherData.current.feelsLike || weatherData.current.temperature)}°C
                            </p>
                            <p className="text-xs text-slate-500">Feels Like</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Location */}
                    {selectedLand && (
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">{selectedLand.location || selectedLand.name}</span>
                      </div>
                    )}
                  </DashboardCard>

                  {/* Quick Actions */}
                  <DashboardCard title="Quick Actions" subtitle="Common farming tasks">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {quickActions.map((action, idx) => (
                        <QuickAction
                          key={idx}
                          icon={action.icon}
                          label={action.label}
                          description={action.description}
                          onClick={() => navigate(action.path)}
                          variant={action.variant}
                        />
                      ))}
                    </div>
                  </DashboardCard>

                  {/* Lands Overview */}
                  <DashboardCard
                    title="Your Lands"
                    subtitle={`${lands.length} registered farms`}
                    action={
                      <button
                        onClick={() => navigate('/add-land')}
                        className="flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                      >
                        <Plus className="w-4 h-4" />
                        Add Land
                      </button>
                    }
                    noPadding
                  >
                    <div className="divide-y divide-slate-100">
                      {lands.slice(0, 4).map((land: any) => (
                        <div
                          key={land.id || land._id}
                          className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors"
                          onClick={() => selectLand(land.id)}
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            selectedLand?.id === land.id 
                              ? 'bg-emerald-100 text-emerald-600' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            <MapPin className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{land.name}</p>
                            <p className="text-sm text-slate-500 truncate">{land.location}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-900">{land.size || land.area || '--'} acres</p>
                            {land.currentCrop && (
                              <Badge variant="success" size="sm">
                                <Leaf className="w-3 h-3" />
                                {land.currentCrop}
                              </Badge>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        </div>
                      ))}
                    </div>
                    {lands.length > 4 && (
                      <div className="px-6 py-3 border-t border-slate-100">
                        <button
                          onClick={() => navigate('/add-land')}
                          className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                          View all {lands.length} lands →
                        </button>
                      </div>
                    )}
                  </DashboardCard>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Current Crop Info */}
                  {selectedLand?.currentCrop && (
                    <DashboardCard>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                          <Sprout className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Currently Growing</p>
                          <p className="text-xl font-bold text-slate-900">{selectedLand.currentCrop}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-xs text-slate-500">Soil Type</p>
                          <p className="font-semibold text-slate-900">{selectedLand.soilType || '--'}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-xs text-slate-500">Water Source</p>
                          <p className="font-semibold text-slate-900">{selectedLand.waterAvailability || '--'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate('/crop-recommendation')}
                        className="w-full mt-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                      >
                        Get Recommendations
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </DashboardCard>
                  )}

                  {/* Recent Activity */}
                  <DashboardCard title="Recent Activity" noPadding>
                    <div className="divide-y divide-slate-100">
                      {recentActivities.map((activity, idx) => (
                        <div key={idx} className="flex items-center gap-3 px-6 py-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            activity.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                            activity.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            <activity.icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{activity.title}</p>
                            <p className="text-xs text-slate-500">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DashboardCard>

                  {/* Quick Stats */}
                  <DashboardCard title="Today's Insights">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                            <Droplets className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Irrigation Status</p>
                            <p className="font-semibold text-slate-900">Optimal</p>
                          </div>
                        </div>
                        <Badge variant="success">Good</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Pest Risk</p>
                            <p className="font-semibold text-slate-900">Low</p>
                          </div>
                        </div>
                        <Badge variant="success">Low</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Market Trend</p>
                            <p className="font-semibold text-slate-900">Favorable</p>
                          </div>
                        </div>
                        <Badge variant="success" dot>+5%</Badge>
                      </div>
                    </div>
                  </DashboardCard>

                  {/* AI Assistant CTA */}
                  <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl shadow-purple-500/30">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">AI Assistant</h3>
                        <p className="text-purple-200 text-sm">Ask anything about farming</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/ai')}
                      className="w-full mt-4 py-3 bg-white text-purple-700 font-semibold rounded-xl hover:bg-purple-50 transition-colors"
                    >
                      Start Chat
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
