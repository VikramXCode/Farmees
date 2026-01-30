import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, DollarSign, TrendingUp, Plus, CheckCircle2, 
  Clock, AlertCircle, Loader2, Trash2, Target, Activity, Camera,
  Sprout, Edit, X, Check, Sparkles
} from 'lucide-react';
import { PageContainer, Section } from '../components/layout/AppShell';
import { useLanguage } from '../contexts/LanguageContext';
import { API_BASE_URL } from '../config/api';
import { getApiHeaders } from '../services/api';
import AutoPlanReviewModal from '../components/farming-plans/AutoPlanReviewModal';
import ActivitySuggestionCard from '../components/farming-plans/ActivitySuggestionCard';
import WeatherAlertBanner from '../components/farming-plans/WeatherAlertBanner';
import ExpenseEntryModal from '../components/expenses/ExpenseEntryModal';
import ExpenseList from '../components/expenses/ExpenseList';
import BudgetProgressBar from '../components/expenses/BudgetProgressBar';
import CategoryBreakdownChart from '../components/expenses/CategoryBreakdownChart';
import BudgetAlertBanner from '../components/expenses/BudgetAlertBanner';
import { getBudgetStatus, type Expense, type BudgetStatus } from '../services/expenseService';

export default function FarmingPlanDetailPage() {
  const { planId } = useParams();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAutoPlan, setShowAutoPlan] = useState(false);
  const [selectedActivityForSuggestion, setSelectedActivityForSuggestion] = useState<string | null>(null);
  
  // Expense tracking state
  const [activeTab, setActiveTab] = useState<'activities' | 'expenses'>('activities');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus | null>(null);
  const [loadingBudget, setLoadingBudget] = useState(false);
  const [expenseRefreshTrigger, setExpenseRefreshTrigger] = useState(0);
  
  const [activityForm, setActivityForm] = useState({
    activityType: '',
    description: '',
    cost: '',
    status: 'completed' as const,
    completedDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchPlan();
    
    // Check if opened from notification
    const tab = searchParams.get('tab');
    if (tab === 'expenses') {
      setActiveTab('expenses');
    }
  }, [planId, searchParams]);

  // Fetch budget status when on expenses tab
  useEffect(() => {
    if (activeTab === 'expenses' && planId) {
      fetchBudgetStatus();
    }
  }, [activeTab, planId, expenseRefreshTrigger]);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/farming-plans/${planId}`, {
        headers: getApiHeaders()
      });
      
      if (!response.ok) throw new Error('Failed to fetch plan');
      
      const data = await response.json();
      setPlan(data);
    } catch (error) {
      console.error('Error fetching plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBudgetStatus = async () => {
    if (!planId) return;
    
    try {
      setLoadingBudget(true);
      const status = await getBudgetStatus(planId);
      setBudgetStatus(status);
    } catch (error) {
      console.error('Error fetching budget status:', error);
    } finally {
      setLoadingBudget(false);
    }
  };

  const handleExpenseSuccess = () => {
    setExpenseRefreshTrigger(prev => prev + 1);
    fetchBudgetStatus();
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowExpenseModal(true);
  };

  const handleCloseExpenseModal = () => {
    setShowExpenseModal(false);
    setEditingExpense(null);
  };

  const handleViewExpenses = () => {
    setActiveTab('expenses');
    // Scroll to expenses section
    setTimeout(() => {
      document.getElementById('expenses-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!activityForm.activityType) {
      alert(language === 'english' ? 'Please select an activity type' : 'செயல்பாடு வகையைத் தேர்ந்தெடுக்கவும்');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Prepare payload with proper data types
      const payload = {
        activityType: activityForm.activityType,
        description: activityForm.description,
        cost: parseFloat(activityForm.cost) || 0,
        status: activityForm.status,
        completedDate: new Date(activityForm.completedDate),
        notes: activityForm.notes
      };
      
      console.log('Adding activity:', payload);
      
      const response = await fetch(`${API_BASE_URL}/farming-plans/${planId}/activities`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error:', errorData);
        throw new Error(errorData.error || 'Failed to add activity');
      }
      
      const updatedPlan = await response.json();
      setPlan(updatedPlan);
      setShowAddActivity(false);
      setActivityForm({
        activityType: '',
        description: '',
        cost: '',
        status: 'completed',
        completedDate: new Date().toISOString().split('T')[0],
        notes: ''
      });
    } catch (error) {
      console.error('Error adding activity:', error);
      alert(language === 'english' 
        ? `Failed to add activity: ${error instanceof Error ? error.message : 'Unknown error'}` 
        : 'செயல்பாட்டைச் சேர்க்க முடியவில்லை');
    } finally {
      setSubmitting(false);
    }
  };

  const dismissSuggestion = async (suggestionId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/farming-plans/${planId}/suggestions/${suggestionId}/dismiss`,
        {
          method: 'PUT',
          headers: getApiHeaders()
        }
      );
      
      if (!response.ok) throw new Error('Failed to dismiss suggestion');
      
      const updatedPlan = await response.json();
      setPlan(updatedPlan);
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Section>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        </Section>
      </PageContainer>
    );
  }

  if (!plan) {
    return (
      <PageContainer>
        <Section>
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-800">
              {language === 'english' ? 'Plan not found' : 'திட்டம் காணப்படவில்லை'}
            </h2>
          </div>
        </Section>
      </PageContainer>
    );
  }

  const activityTypes = [
    { value: 'land_preparation', label: language === 'english' ? 'Land Preparation' : 'நில தயாரிப்பு' },
    { value: 'ploughing', label: language === 'english' ? 'Ploughing' : 'உழவு' },
    { value: 'seed_sowing', label: language === 'english' ? 'Seed Sowing' : 'விதை விதைத்தல்' },
    { value: 'fertilizer_application', label: language === 'english' ? 'Fertilizer Application' : 'உர பயன்பாடு' },
    { value: 'irrigation', label: language === 'english' ? 'Irrigation' : 'பாசனம்' },
    { value: 'weeding', label: language === 'english' ? 'Weeding' : 'களை எடுத்தல்' },
    { value: 'pest_control', label: language === 'english' ? 'Pest Control' : 'பூச்சி கட்டுப்பாடு' },
    { value: 'harvesting', label: language === 'english' ? 'Harvesting' : 'அறுவடை' },
    { value: 'other', label: language === 'english' ? 'Other' : 'மற்றவை' }
  ];

  const activeSuggestions = plan.aiSuggestions?.filter((s: any) => !s.dismissed) || [];
  const budgetRemaining = plan.totalBudget - plan.actualCosts.totalSpent;
  const budgetUtilization = ((plan.actualCosts.totalSpent / plan.totalBudget) * 100).toFixed(1);

  return (
    <PageContainer>
      <Section>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/farming-plans')}
              className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
              {language === 'english' ? 'Back to Plans' : 'திட்டங்களுக்குத் திரும்பு'}
            </button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{plan.planName}</h1>
                <p className="text-gray-600">{plan.cropName} • {plan.plannedAreaHectares} hectares</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium border ${
                plan.status === 'active' ? 'bg-green-100 text-green-800 border-green-300' :
                plan.status === 'completed' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                'bg-gray-100 text-gray-800 border-gray-300'
              }`}>
                {plan.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Progress Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {language === 'english' ? 'Progress' : 'முன்னேற்றம்'}
              </h2>
              <span className="text-2xl font-bold text-green-600">{plan.progress.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className="bg-green-600 h-3 rounded-full transition-all"
                style={{ width: `${plan.progress.percentage}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">
              {language === 'english' ? 'Current Stage:' : 'தற்போதைய நிலை:'} <span className="font-medium capitalize">{plan.progress.currentStage}</span>
            </p>
          </div>

          {/* Budget Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-6 h-6 text-blue-600" />
                <h3 className="font-semibold text-gray-700">{language === 'english' ? 'Total Budget' : 'மொத்த பட்ஜெட்'}</h3>
              </div>
              <p className="text-2xl font-bold text-gray-800">₹{plan.totalBudget.toLocaleString()}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-green-600" />
                <h3 className="font-semibold text-gray-700">{language === 'english' ? 'Total Spent' : 'மொத்த செலவு'}</h3>
              </div>
              <p className="text-2xl font-bold text-gray-800">₹{plan.actualCosts.totalSpent.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{budgetUtilization}% utilized</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-6 h-6 text-purple-600" />
                <h3 className="font-semibold text-gray-700">{language === 'english' ? 'Remaining' : 'மீதம்'}</h3>
              </div>
              <p className={`text-2xl font-bold ${budgetRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{Math.abs(budgetRemaining).toLocaleString()}
              </p>
              {budgetRemaining < 0 && (
                <p className="text-xs text-red-500 mt-1">{language === 'english' ? 'Over budget' : 'பட்ஜெட்டை மீறியது'}</p>
              )}
            </div>
          </div>

          {/* AI Suggestions */}
          {activeSuggestions.length > 0 && (
            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                <Target className="w-6 h-6" />
                {language === 'english' ? 'AI Suggestions for Next Steps' : 'அடுத்த படிகளுக்கான AI பரிந்துரைகள்'}
              </h2>
              <div className="space-y-3">
                {activeSuggestions.map((suggestion: any) => (
                  <div key={suggestion._id} className="bg-white rounded-lg p-4 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          suggestion.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          suggestion.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {suggestion.priority.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">{suggestion.category}</span>
                      </div>
                      <p className="text-sm text-gray-800">{suggestion.suggestionText}</p>
                      {suggestion.dueDate && (
                        <p className="text-xs text-gray-500 mt-1">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {new Date(suggestion.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => dismissSuggestion(suggestion._id)}
                      className="ml-4 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex gap-8">
                <button
                  onClick={() => setActiveTab('activities')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'activities'
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {language === 'english' ? 'Activities' : 'செயல்பாடுகள்'}
                </button>
                <button
                  onClick={() => setActiveTab('expenses')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'expenses'
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {language === 'english' ? 'Expenses' : 'செலவுகள்'}
                </button>
              </nav>
            </div>
          </div>

          {/* Activities Tab */}
          {activeTab === 'activities' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {language === 'english' ? 'Activities Log' : 'செயல்பாடு பதிவு'}
              </h2>
              <div className="flex items-center gap-2">
                {plan.activities && plan.activities.length === 0 && (
                  <button
                    onClick={() => setShowAutoPlan(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    {language === 'english' ? 'Generate Plan' : 'திட்டம் உருவாக்கு'}
                  </button>
                )}
                <button
                  onClick={() => setShowAddActivity(!showAddActivity)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  {showAddActivity ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {showAddActivity 
                    ? (language === 'english' ? 'Cancel' : 'ரத்து')
                    : (language === 'english' ? 'Add Activity' : 'செயல்பாட்டைச் சேர்')}
                </button>
              </div>
            </div>

            {/* AI Activity Suggestions for Next Pending */}
            {(() => {
              const nextPending = plan.activities
                ?.filter((a: any) => a.status === 'pending')
                .sort((a: any, b: any) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())[0];
              
              return nextPending && selectedActivityForSuggestion !== nextPending.activityType ? (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">
                      {language === 'english' ? 'AI Tips for Next Activity:' : 'அடுத்த செயல்பாட்டிற்கான AI குறிப்புகள்:'}
                    </p>
                    <button
                      onClick={() => setSelectedActivityForSuggestion(nextPending.activityType)}
                      className="text-xs text-purple-600 hover:text-purple-700"
                    >
                      {language === 'english' ? 'View Suggestions' : 'பரிந்துரைகளைக் காண்க'}
                    </button>
                  </div>
                  {selectedActivityForSuggestion === nextPending.activityType && (
                    <ActivitySuggestionCard planId={plan._id} activityType={nextPending.activityType} />
                  )}
                </div>
              ) : null;
            })()}

            {/* Add Activity Form */}
            {showAddActivity && (
              <form onSubmit={handleAddActivity} className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'english' ? 'Activity Type' : 'செயல்பாடு வகை'} *
                    </label>
                    <select
                      value={activityForm.activityType}
                      onChange={(e) => setActivityForm({ ...activityForm, activityType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      required
                    >
                      <option value="">{language === 'english' ? 'Select type' : 'வகையைத் தேர்ந்தெடுக்கவும்'}</option>
                      {activityTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'english' ? 'Cost (₹)' : 'செலவு (₹)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={activityForm.cost}
                      onChange={(e) => setActivityForm({ ...activityForm, cost: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'english' ? 'Completion Date' : 'முடிவு தேதி'} *
                    </label>
                    <input
                      type="date"
                      value={activityForm.completedDate}
                      onChange={(e) => setActivityForm({ ...activityForm, completedDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'english' ? 'Description' : 'விளக்கம்'}
                    </label>
                    <input
                      type="text"
                      value={activityForm.description}
                      onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder={language === 'english' ? 'Brief description' : 'சுருக்க விளக்கம்'}
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'english' ? 'Notes' : 'குறிப்புகள்'}
                  </label>
                  <textarea
                    value={activityForm.notes}
                    onChange={(e) => setActivityForm({ ...activityForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    rows={3}
                    placeholder={language === 'english' ? 'Additional notes...' : 'கூடுதல் குறிப்புகள்...'}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {submitting 
                    ? (language === 'english' ? 'Adding...' : 'சேர்க்கப்படுகிறது...')
                    : (language === 'english' ? 'Add Activity' : 'செயல்பாட்டைச் சேர்')}
                </button>
              </form>
            )}

            {/* Activities List */}
            <div className="space-y-3">
              {plan.activities.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {language === 'english' ? 'No activities recorded yet' : 'இன்னும் செயல்பாடுகள் பதிவு செய்யப்படவில்லை'}
                </p>
              ) : (
                plan.activities
                  .sort((a: any, b: any) => new Date(b.completedDate || b.createdAt).getTime() - new Date(a.completedDate || a.createdAt).getTime())
                  .map((activity: any) => (
                    <div key={activity._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      {/* Weather Alert for Pending Activities */}
                      {activity.status === 'pending' && (
                        <WeatherAlertBanner 
                          planId={plan._id}
                          activityId={activity._id}
                          activityType={activity.activityType}
                          scheduledDate={activity.scheduledDate}
                        />
                      )}
                      
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {activity.status === 'completed' ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : activity.status === 'skipped' ? (
                              <X className="w-5 h-5 text-gray-400" />
                            ) : (
                              <Clock className="w-5 h-5 text-orange-500" />
                            )}
                            <h4 className="font-semibold text-gray-800 capitalize">
                              {activity.activityType.replace(/_/g, ' ')}
                            </h4>
                            {activity.cost > 0 && (
                              <span className="text-sm text-gray-600">₹{activity.cost.toLocaleString()}</span>
                            )}
                            {activity.status === 'pending' && (
                              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                {language === 'english' ? 'Pending' : 'நிலுவையில்'}
                              </span>
                            )}
                          </div>
                          {activity.description && (
                            <p className="text-sm text-gray-600 mb-1">{activity.description}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {activity.status === 'pending' && activity.scheduledDate 
                              ? `${language === 'english' ? 'Scheduled:' : 'திட்டமிடப்பட்டது:'} ${new Date(activity.scheduledDate).toLocaleDateString()}`
                              : new Date(activity.completedDate || activity.createdAt).toLocaleDateString()}
                          </p>
                          {activity.notes && (
                            <p className="text-xs text-gray-500 mt-2 italic">{activity.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
          )}

          {/* Expenses Tab */}
          {activeTab === 'expenses' && (
            <div id="expenses-section">
              {/* Budget Alert Banner */}
              {budgetStatus && budgetStatus.alertLevel !== 'ok' && (
                <BudgetAlertBanner
                  planId={planId!}
                  alertLevel={budgetStatus.alertLevel}
                  percentageUsed={budgetStatus.percentageUsed}
                  totalSpent={budgetStatus.totalSpent}
                  remaining={budgetStatus.remaining}
                  totalBudget={budgetStatus.totalBudget}
                  onViewExpenses={handleViewExpenses}
                />
              )}

              {/* Budget Progress Bar */}
              {loadingBudget ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center mb-6">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">
                    {language === 'english' ? 'Loading budget...' : 'பட்ஜெட் ஏற்றப்படுகிறது...'}
                  </p>
                </div>
              ) : budgetStatus ? (
                <>
                  <div className="mb-6">
                    <BudgetProgressBar
                      totalBudget={budgetStatus.totalBudget}
                      totalSpent={budgetStatus.totalSpent}
                      percentageUsed={budgetStatus.percentageUsed}
                      alertLevel={budgetStatus.alertLevel}
                    />
                  </div>

                  {/* Category Breakdown */}
                  {budgetStatus.categoryBreakdown.length > 0 && (
                    <div className="mb-6">
                      <CategoryBreakdownChart
                        categoryBreakdown={budgetStatus.categoryBreakdown}
                        totalSpent={budgetStatus.totalSpent}
                      />
                    </div>
                  )}
                </>
              ) : null}

              {/* Expense List */}
              <ExpenseList
                planId={planId!}
                onEdit={handleEditExpense}
                refreshTrigger={expenseRefreshTrigger}
              />

              {/* Floating Add Expense Button */}
              <button
                onClick={() => {
                  setEditingExpense(null);
                  setShowExpenseModal(true);
                }}
                className="fixed bottom-8 right-8 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all hover:scale-110 flex items-center justify-center z-40"
                aria-label={language === 'english' ? 'Add Expense' : 'செலவு சேர்'}
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      </Section>

      {/* Auto Plan Generation Modal */}
      <AutoPlanReviewModal
        isOpen={showAutoPlan}
        onClose={() => setShowAutoPlan(false)}
        planId={plan._id}
        cropName={plan.cropName}
        onAccept={() => {
          setShowAutoPlan(false);
          fetchPlan();
        }}
      />

      {/* Expense Entry Modal */}
      <ExpenseEntryModal
        isOpen={showExpenseModal}
        onClose={handleCloseExpenseModal}
        planId={planId!}
        expense={editingExpense}
        onSuccess={handleExpenseSuccess}
        activities={plan?.activities || []}
      />
    </PageContainer>
  );
}
