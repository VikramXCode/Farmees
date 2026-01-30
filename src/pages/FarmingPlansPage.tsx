import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sprout, Calendar, DollarSign, TrendingUp, Plus, CheckCircle2, 
  Clock, AlertCircle, Loader2, Edit, Trash2, Eye, Target,
  Activity, BarChart3, Bell
} from 'lucide-react';
import { PageContainer, Section } from '../components/layout/AppShell';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';
import { getApiHeaders } from '../services/api';
import NotificationPanel from '../components/farming-plans/NotificationPanel';
import { getNotificationStats } from '../services/farmingPlanService';

interface FarmingPlan {
  _id: string;
  planName: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  cropName: string;
  totalBudget: number;
  plannedAreaHectares: number;
  startDate: string;
  expectedHarvestDate: string;
  progress: {
    percentage: number;
    currentStage: string;
  };
  actualCosts: {
    totalSpent: number;
  };
  activities: any[];
  aiSuggestions: any[];
  createdAt: string;
}

export default function FarmingPlansPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [plans, setPlans] = useState<FarmingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      fetchPlans();
      fetchNotificationCount();
    }
  }, [user?.id, filter]);

  const fetchNotificationCount = async () => {
    if (!user?.id) return;
    try {
      const stats = await getNotificationStats(user.id);
      setNotificationCount(stats.stats.pending + stats.stats.delivered);
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const queryParam = filter !== 'all' ? `?status=${filter}` : '';
      const response = await fetch(`${API_BASE_URL}/farming-plans/user/${user?.id}${queryParam}`, {
        headers: getApiHeaders()
      });
      
      if (!response.ok) throw new Error('Failed to fetch plans');
      
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-300';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'planning': return <Target className="w-4 h-4" />;
      case 'preparation': return <Activity className="w-4 h-4" />;
      case 'sowing': return <Sprout className="w-4 h-4" />;
      case 'growth': return <TrendingUp className="w-4 h-4" />;
      case 'maintenance': return <CheckCircle2 className="w-4 h-4" />;
      case 'harvesting': return <BarChart3 className="w-4 h-4" />;
      case 'sale': return <DollarSign className="w-4 h-4" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <PageContainer>
      <Section>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Sprout className="w-8 h-8 text-green-600" />
                <h1 className="text-2xl font-bold text-gray-800">
                  {language === 'english' ? 'My Farming Plans' : 'என் விவசாய திட்டங்கள்'}
                </h1>
              </div>
              <p className="text-gray-600">
                {language === 'english' 
                  ? 'Track your farming activities, costs, and get AI-powered suggestions for next steps.' 
                  : 'உங்கள் விவசாய செயல்பாடுகள், செலவுகளைக் கண்காணித்து அடுத்த படிகளுக்கான AI பரிந்துரைகளைப் பெறுங்கள்.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Notification Button */}
              <button
                onClick={() => setShowNotifications(true)}
                className="relative px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                    {notificationCount}
                  </span>
                )}
                <span className="hidden sm:inline">
                  {language === 'english' ? 'Notifications' : 'அறிவிப்புகள்'}
                </span>
              </button>
              
              <button
                onClick={() => navigate('/crop-recommendation')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                {language === 'english' ? 'New Plan' : 'புதிய திட்டம்'}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex gap-2">
            {['all', 'active', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === f
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {f === 'all' ? (language === 'english' ? 'All' : 'அனைத்தும்') :
                 f === 'active' ? (language === 'english' ? 'Active' : 'செயலில்') :
                 (language === 'english' ? 'Completed' : 'முடிந்தது')}
              </button>
            ))}
          </div>

          {/* Plans List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : plans.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Sprout className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {language === 'english' ? 'No Farming Plans Yet' : 'இன்னும் விவசாய திட்டங்கள் இல்லை'}
              </h3>
              <p className="text-gray-600 mb-6">
                {language === 'english' 
                  ? 'Create your first farming plan to start tracking your crop cultivation journey.' 
                  : 'உங்கள் பயிர் சாகுபடி பயணத்தைக் கண்காணிக்க உங்கள் முதல் விவசாய திட்டத்தை உருவாக்கவும்.'}
              </p>
              <button
                onClick={() => navigate('/crop-recommendation')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                {language === 'english' ? 'Create Plan' : 'திட்டத்தை உருவாக்கு'}
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {plans.map((plan) => (
                <div key={plan._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-800">{plan.cropName}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(plan.status)}`}>
                          {plan.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{plan.planName}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/farming-plans/${plan._id}`)}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-colors flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      {language === 'english' ? 'View Details' : 'விவரங்களைக் காண்க'}
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        {getStageIcon(plan.progress.currentStage)}
                        {plan.progress.currentStage}
                      </span>
                      <span className="text-sm font-semibold text-gray-800">{plan.progress.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          plan.progress.percentage === 100 ? 'bg-green-600' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${plan.progress.percentage}%` }}
                      />
                    </div>
                    {plan.progress.percentage >= 95 && plan.progress.percentage < 100 && (
                      <p className="text-xs text-yellow-700 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {language === 'english' 
                          ? 'Record crop sale to complete plan (reach 100%)'
                          : 'திட்டத்தை முடிக்க பயிர் விற்பனையைப் பதிவு செய்யவும் (100% அடைய)'}
                      </p>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{language === 'english' ? 'Area' : 'பரப்பு'}</p>
                      <p className="font-semibold text-gray-800">{plan.plannedAreaHectares} acres</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{language === 'english' ? 'Budget' : 'பட்ஜெட்'}</p>
                      <p className="font-semibold text-gray-800">₹{plan.totalBudget.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{language === 'english' ? 'Spent' : 'செலவு'}</p>
                      <p className={`font-semibold ${
                        plan.actualCosts.totalSpent > plan.totalBudget ? 'text-red-600' : 'text-green-600'
                      }`}>
                        ₹{plan.actualCosts.totalSpent.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{language === 'english' ? 'Start Date' : 'தொடக்க தேதி'}</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(plan.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </div>

                  {/* Activity Status */}
                  {(() => {
                    const lastCompleted = plan.activities
                      .filter(a => a.status === 'completed')
                      .sort((a, b) => new Date(b.completedDate || 0).getTime() - new Date(a.completedDate || 0).getTime())[0];
                    
                    const nextPending = plan.activities
                      .filter(a => a.status === 'pending' || a.status === 'in_progress')
                      .sort((a, b) => new Date(a.scheduledDate || new Date()).getTime() - new Date(b.scheduledDate || new Date()).getTime())[0];

                    if (nextPending) {
                      return (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-blue-600 font-medium mb-0.5">
                                {language === 'english' ? 'Next Activity' : 'அடுத்த செயல்பாடு'}
                              </p>
                              <p className="text-sm font-semibold text-blue-900 truncate">
                                {nextPending.description || nextPending.activityType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </p>
                              {nextPending.scheduledDate && (
                                <p className="text-xs text-blue-700 mt-1">
                                  {language === 'english' ? 'Due: ' : 'நிலுவை: '}
                                  {new Date(nextPending.scheduledDate).toLocaleDateString('en-GB', { 
                                    day: 'numeric', 
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    } else if (lastCompleted) {
                      return (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-green-600 font-medium mb-0.5">
                                {language === 'english' ? 'Last Completed' : 'கடைசியாக முடிந்தது'}
                              </p>
                              <p className="text-sm font-semibold text-green-900 truncate">
                                {lastCompleted.description || lastCompleted.activityType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </p>
                              {lastCompleted.completedDate && (
                                <p className="text-xs text-green-700 mt-1">
                                  {new Date(lastCompleted.completedDate).toLocaleDateString('en-GB', { 
                                    day: 'numeric', 
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* AI Suggestions Count */}
                  {plan.aiSuggestions.filter(s => !s.dismissed).length > 0 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center gap-2 mt-3">
                      <AlertCircle className="w-5 h-5 text-purple-600" />
                      <span className="text-sm text-purple-800">
                        {plan.aiSuggestions.filter(s => !s.dismissed).length} {language === 'english' ? 'new suggestions available' : 'புதிய பரிந்துரைகள் உள்ளன'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onNotificationUpdate={() => {
          fetchPlans();
          fetchNotificationCount();
        }}
      />
    </PageContainer>
  );
}
