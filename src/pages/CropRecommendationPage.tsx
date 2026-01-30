import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Sprout, MapPin, ThermometerSun, Loader2, TrendingUp, Calendar, DollarSign, AlertCircle, Upload, ChevronDown, Check, CheckCircle2 } from 'lucide-react';
import { PageContainer, Section } from '../components/layout/AppShell';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import weatherService from '../services/weatherService';
import { getCropRecommendation, type CropRecommendationResponse } from '../services/cropRecommendationProxy';
import { landService } from '../services/landService';
import type { LandData as Land } from '../types/land';
import { API_BASE_URL } from '../config/api';
import { getApiHeaders } from '../services/api';

export default function CropRecommendationPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const [lands, setLands] = useState<Land[]>([]);
  const [selectedLandId, setSelectedLandId] = useState<string>('');
  const [selectedLand, setSelectedLand] = useState<Land | null>(null);
  const [landsLoading, setLandsLoading] = useState(false);
  const [showSoilWarning, setShowSoilWarning] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    state: '',
    district: '',
    landAreaAcre: '',
    budgetInr: '',
    includeFertilizers: false,
    planningMonths: '6',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [temperatureC, setTemperatureC] = useState<number | null>(null);
  const [tempLoading, setTempLoading] = useState(false);
  
  const [recommendation, setRecommendation] = useState<CropRecommendationResponse | null>(null);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedCropsForComparison, setSelectedCropsForComparison] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<CropRecommendationResponse[]>([]);
  const [finalizingPlan, setFinalizingPlan] = useState(false);
  const [detailedBudgetPlan, setDetailedBudgetPlan] = useState<any>(null);
  const [loadingBudgetPlan, setLoadingBudgetPlan] = useState(false);

  // Fetch user's lands on mount
  useEffect(() => {
    const fetchLands = async () => {
      if (!user?.id) return;
      setLandsLoading(true);
      try {
        const userLands = await landService.getAllUserLands(user.id);
        setLands(userLands);
        
        // Priority 1: Check if land was passed via location state (from LandDetailsPage)
        const landIdFromState = location.state?.landId;
        if (landIdFromState) {
          setSelectedLandId(landIdFromState);
          // Clear the state to prevent re-selection on subsequent renders
          window.history.replaceState({}, document.title);
          return;
        }
        
        // Priority 2: Check if returning from add-land page with a new landId
        const landIdFromUrl = searchParams.get('landId');
        const returningFromAddLand = sessionStorage.getItem('crop_recommendation_return');
        
        if (returningFromAddLand === 'true' && landIdFromUrl) {
          setSelectedLandId(landIdFromUrl);
          sessionStorage.removeItem('crop_recommendation_return');
          navigate('/crop-recommendation', { replace: true });
        } else if (returningFromAddLand === 'true' && userLands.length > 0) {
          const newestLand = userLands[userLands.length - 1];
          setSelectedLandId(newestLand.landId);
          sessionStorage.removeItem('crop_recommendation_return');
        }
      } catch (error) {
        console.error('Failed to fetch lands:', error);
      } finally {
        setLandsLoading(false);
      }
    };
    fetchLands();
  }, [user, searchParams, navigate, location.state]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update form when land is selected
  useEffect(() => {
    if (selectedLandId) {
      const land = lands.find(l => l.landId === selectedLandId);
      setSelectedLand(land || null);
      
      if (land) {
        // Check if land has soil data
        if (!land.soilData || !land.soilData.soilType) {
          setShowSoilWarning(true);
        } else {
          setShowSoilWarning(false);
        }
        
        // Auto-fill state and district from soil data or land data
        setFormData(prev => ({
          ...prev,
          state: land.soilData?.state || land.district || '',
          district: land.soilData?.district || land.location || '',
          landAreaAcre:
            land.landSize?.unit === 'acres' && land.landSize?.value != null
              ? String(land.landSize.value)
              : ''
        }));
        
        // Set map location if land has coordinates
        if (land.coordinates?.lat && land.coordinates?.lng) {
          fetchTemperature(land.coordinates.lat, land.coordinates.lng, land.location);
        } else if (land.boundary?.centroid && Array.isArray(land.boundary.centroid) && land.boundary.centroid.length === 2) {
          // Use centroid if available
          fetchTemperature(land.boundary.centroid[1] as number, land.boundary.centroid[0] as number, land.location);
        }
      }
    } else {
      setSelectedLand(null);
      setShowSoilWarning(false);
    }
  }, [selectedLandId, lands]);

  const fetchTemperature = useCallback(async (lat?: number, lon?: number, label?: string) => {
    if (lat == null || lon == null) return;
    setTempLoading(true);
    try {
      const weather = await weatherService.getCurrentWeather(lat, lon, label);
      const temp = weather?.weather?.current?.temperature;
      if (typeof temp === 'number') {
        setTemperatureC(temp);
      }
    } catch (error) {
      console.error('Weather fetch error:', error);
    } finally {
      setTempLoading(false);
    }
  }, []);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGetRecommendation = async () => {
    setRecommendationError(null);
    setRecommendation(null);

    // Check if land is selected
    if (!selectedLandId || !selectedLand) {
      setRecommendationError('Please select a land first.');
      return;
    }

    // Check if land has soil data
    if (showSoilWarning) {
      setRecommendationError('Please upload a soil report for this land first.');
      return;
    }

    const {
      state,
      district,
      landAreaAcre,
      budgetInr,
      planningMonths,
      date
    } = formData;

    if (!state || !district || !landAreaAcre || !budgetInr || !planningMonths || !date) {
      setRecommendationError('Please fill all required fields.');
      return;
    }

    // Convert acres to hectares (1 acre = 0.404686 hectares)
    const landAreaHectare = parseFloat(landAreaAcre) * 0.404686;

    const payload = {
      state: state.trim(),
      district: district.trim(),
      land_area_hectare: landAreaHectare,
      budget_inr: parseFloat(budgetInr),
      planning_months: parseInt(planningMonths, 10),
      date,
      soil_type: selectedLand.soilData?.soilType || selectedLand.soilType || null,
      ph: selectedLand.soilData?.pH || null,
      temperature: temperatureC,
      soil_report_uploaded: !!selectedLand.soilData
    };

    setRecommendationLoading(true);
    try {
      const data = await getCropRecommendation(payload);
      setRecommendation(data);
      
      // After getting the recommendation, fetch detailed budget plan from Groq
      if (data.recommended_crop) {
        fetchDetailedBudgetPlan(data.recommended_crop, parseFloat(budgetInr), parseFloat(landAreaAcre));
      }
    } catch (error: any) {
      setRecommendationError(error?.message || 'Failed to fetch crop recommendation');
    } finally {
      setRecommendationLoading(false);
    }
  };

  const fetchDetailedBudgetPlan = async (cropName: string, totalBudget: number, availableLandAcres: number) => {
    setLoadingBudgetPlan(true);
    setDetailedBudgetPlan(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/crop-recommendations/budget-plan`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          cropName,
          totalBudget,
          availableLandAcres,
          soilType: selectedLand?.soilData?.soilType || selectedLand?.soilType || 'Loamy',
          state: formData.state,
          district: formData.district,
          includeFertilizers: formData.includeFertilizers,
          season: getCurrentSeason()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch detailed budget plan');
      }

      const data = await response.json();
      setDetailedBudgetPlan(data.budgetPlan);
    } catch (error) {
      console.error('Error fetching detailed budget plan:', error);
      // Don't show error to user, budget breakdown is supplementary info
    } finally {
      setLoadingBudgetPlan(false);
    }
  };

  const getCurrentSeason = () => {
    const month = new Date().getMonth() + 1; // 1-12
    if (month >= 6 && month <= 9) return 'kharif';
    if (month >= 10 || month <= 2) return 'rabi';
    return 'zaid';
  };

  const handleFinalizePlan = async () => {
    if (!recommendation || !selectedLand || !user) return;

    setFinalizingPlan(true);
    try {
      // Calculate planned area in acres - use AI breakdown if available, else API value
      const plannedAreaAcres = detailedBudgetPlan 
        ? detailedBudgetPlan.landAllocation.recommendedAcres 
        : (recommendation.planned_area_hectare / 0.404686);
      
      // Calculate yield per acre
      const yieldPerAcre = recommendation.expected_yield_ton_per_hectare / 0.404686;
      
      const planData = {
        userId: user.id,
        landId: selectedLand.landId,
        planName: `${recommendation.recommended_crop} Cultivation Plan - ${new Date().toLocaleDateString()}`,
        cropName: recommendation.recommended_crop,
        totalBudget: parseFloat(formData.budgetInr),
        includeFertilizers: formData.includeFertilizers,
        plannedAreaHectares: plannedAreaAcres, // Already in acres
        budgetAllocation: {
          seedCost: recommendation.budget_summary.seed_cost || 0,
          fertilizerCost: recommendation.budget_summary.fertilizer_cost || 0,
          laborCost: recommendation.budget_summary.labor_cost || 0,
          otherCosts: recommendation.budget_summary.other_costs || 0,
          totalAllocated: recommendation.budget_summary.estimated_cost
        },
        seedDetails: {
          variety: recommendation.recommended_crop,
          quantityKg: 0, // To be filled
          costPerKg: 0,
          totalCost: recommendation.budget_summary.seed_cost || 0
        },
        fertilizerDetails: formData.includeFertilizers ? [
          {
            name: 'NPK Fertilizer',
            type: 'Compound',
            quantityKg: 0,
            costPerKg: 0,
            totalCost: recommendation.budget_summary.fertilizer_cost || 0,
            applicationStage: 'basal'
          }
        ] : [],
        expectedYield: recommendation.financials ? {
          tonsPerHectare: yieldPerAcre, // Yield per acre
          totalTons: yieldPerAcre * plannedAreaAcres, // Total production
          marketPricePerTon: recommendation.financials.market_price_per_ton,
          expectedRevenue: recommendation.financials.gross_revenue,
          expectedProfit: recommendation.financials.net_profit,
          roi: recommendation.financials.roi_percentage
        } : undefined,
        startDate: new Date(formData.date),
        planningMonths: parseInt(formData.planningMonths),
        expectedHarvestDate: new Date(new Date(formData.date).setMonth(new Date(formData.date).getMonth() + parseInt(formData.planningMonths))),
        progress: {
          currentStage: 'planning',
          percentage: 0
        },
        notes: recommendation.explanation
      };

      const response = await fetch(`${API_BASE_URL}/farming-plans`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify(planData)
      });

      if (!response.ok) {
        throw new Error('Failed to create farming plan');
      }

      const createdPlan = await response.json();

      // Finalize the plan to activate it
      const finalizeResponse = await fetch(`${API_BASE_URL}/farming-plans/${createdPlan._id}/finalize`, {
        method: 'POST',
        headers: getApiHeaders()
      });

      if (!finalizeResponse.ok) {
        throw new Error('Failed to finalize plan');
      }

      alert(language === 'english' 
        ? 'Plan created successfully! You can now track your farming activities in the Plans section.' 
        : 'திட்டம் வெற்றிகரமாக உருவாக்கப்பட்டது! திட்டங்கள் பிரிவில் உங்கள் விவசாய செயல்பாடுகளைக் கண்காணிக்கலாம்.');
      
      navigate('/farming-plans');
    } catch (error) {
      console.error('Error finalizing plan:', error);
      alert(language === 'english' 
        ? 'Failed to create plan. Please try again.' 
        : 'திட்டத்தை உருவாக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.');
    } finally {
      setFinalizingPlan(false);
    }
  };

  return (
    <PageContainer>
      <Section>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Sprout className="w-8 h-8 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-800">
                {language === 'english' ? 'Crop Recommendation' : 'பயிர் பரிந்துரை'}
              </h1>
            </div>
            <p className="text-gray-600">
              {language === 'english' 
                ? 'Get AI-powered crop recommendations based on your location, soil, budget, and weather conditions.' 
                : 'உங்கள் இருப்பிடம், மண், பட்ஜெட் மற்றும் வானிலை நிலைமைகளின் அடிப்படையில் AI-சக்தி பெற்ற பயிர் பரிந்துரைகளைப் பெறுங்கள்.'}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {language === 'english' ? 'Select Your Land' : 'உங்கள் நிலத்தைத் தேர்ந்தெடுக்கவும்'}
            </h2>

            <div className="space-y-4">
              {/* Land Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  {language === 'english' ? 'Select Land' : 'நிலத்தைத் தேர்ந்தெடுக்கவும்'} *
                </label>
                {landsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                    <span className="ml-2 text-gray-600">
                      {language === 'english' ? 'Loading lands...' : 'நிலங்களை ஏற்றுகிறது...'}
                    </span>
                  </div>
                ) : lands.length === 0 ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      {language === 'english' 
                        ? 'No lands found. Please add a land first from the Lands page.' 
                        : 'நிலங்கள் எதுவும் இல்லை. முதலில் நிலங்கள் பக்கத்திலிருந்து ஒரு நிலத்தைச் சேர்க்கவும்.'}
                    </p>
                  </div>
                ) : (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="w-full px-5 py-4 bg-white border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-left text-gray-800 font-medium shadow-sm hover:border-gray-400 cursor-pointer flex items-center justify-between"
                      style={{ minHeight: '3.5rem' }}
                    >
                      <span className={selectedLandId ? 'text-gray-800' : 'text-gray-500'}>
                        {selectedLandId 
                          ? lands.find(l => l.landId === selectedLandId)
                            ? `${lands.find(l => l.landId === selectedLandId)?.name} - ${lands.find(l => l.landId === selectedLandId)?.location}`
                            : (language === 'english' ? '-- Select a land --' : '-- நிலத்தைத் தேர்ந்தெடுக்கவும் --')
                          : (language === 'english' ? '-- Select a land --' : '-- நிலத்தைத் தேர்ந்தெடுக்கவும் --')
                        }
                      </span>
                      <ChevronDown className={`w-5 h-5 text-green-600 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {dropdownOpen && (
                      <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                        {lands.map((land) => (
                          <div
                            key={land.landId}
                            onClick={() => {
                              setSelectedLandId(land.landId);
                              setDropdownOpen(false);
                            }}
                            className={`px-5 py-3.5 cursor-pointer transition-colors flex items-center justify-between hover:bg-green-50 border-b border-gray-100 last:border-b-0 ${
                              selectedLandId === land.landId ? 'bg-green-50 text-green-700' : 'text-gray-800'
                            }`}
                          >
                            <div>
                              <p className="font-medium">{land.name}</p>
                              <p className="text-sm text-gray-500 mt-0.5">{land.location}</p>
                            </div>
                            {selectedLandId === land.landId && (
                              <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                            )}
                          </div>
                        ))}
                        <div
                          onClick={() => {
                            sessionStorage.setItem('crop_recommendation_return', 'true');
                            navigate('/add-land?returnTo=crop-recommendation');
                          }}
                          className="px-5 py-3.5 cursor-pointer transition-colors border-t-2 border-gray-200 hover:bg-green-50 text-green-600 font-semibold flex items-center gap-2"
                        >
                          <span className="text-lg">➕</span>
                          <span>{language === 'english' ? 'Add New Land' : 'புதிய நிலத்தைச் சேர்க்கவும்'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Soil Warning */}
              {showSoilWarning && selectedLand && (
                <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-amber-900 font-semibold text-sm mb-2">
                        {language === 'english' 
                          ? 'Soil Report Not Found' 
                          : 'மண் அறிக்கை காணப்படவில்லை'}
                      </p>
                      <p className="text-amber-800 text-sm mb-3">
                        {language === 'english'
                          ? 'Upload a government soil report to get more accurate crop recommendations based on your actual soil nutrients and properties.'
                          : 'உங்கள் உண்மையான மண் ஊட்டச்சத்துக்கள் மற்றும் பண்புகளின் அடிப்படையில் மிகவும் துல்லியமான பயிர் பரிந்துரைகளைப் பெற அரசு மண் அறிக்கையைப் பதிவேற்றவும்.'}
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            // Store selected land ID and set return flag for soil analyzer
                            sessionStorage.setItem('crop_recommendation_selected_land', selectedLandId);
                            sessionStorage.setItem('crop_recommendation_return', 'true');
                            navigate('/soil-analyzer', { state: { landId: selectedLandId, returnTo: 'crop-recommendation' } });
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
                        >
                          <Upload className="w-4 h-4" />
                          {language === 'english' ? 'Analyze Soil Report' : 'மண் அறிக்கையை பகுப்பாய்வு செய்யவும்'}
                        </button>
                        <button
                          onClick={() => {
                            // Continue without soil data - user can still get recommendations
                            setShowSoilWarning(false);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors text-sm font-medium"
                        >
                          {language === 'english' ? 'Continue Without' : 'இல்லாமல் தொடரவும்'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Show land details when selected and has soil data */}
              {selectedLand && !showSoilWarning && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">
                        {language === 'english' ? 'Soil Type:' : 'மண் வகை:'}
                      </span>
                      <span className="ml-2 font-medium text-gray-800">
                        {selectedLand.soilData?.soilType || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">
                        {language === 'english' ? 'pH Level:' : 'pH அளவு:'}
                      </span>
                      <span className="ml-2 font-medium text-gray-800">
                        {selectedLand.soilData?.pH || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">
                        {language === 'english' ? 'Health Status:' : 'ஆரோக்கிய நிலை:'}
                      </span>
                      <span className="ml-2 font-medium text-gray-800">
                        {selectedLand.soilData?.healthStatus || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">
                        {language === 'english' ? 'Last Updated:' : 'கடைசியாக புதுப்பிக்கப்பட்டது:'}
                      </span>
                      <span className="ml-2 font-medium text-gray-800">
                        {selectedLand.lastSoilUpdate 
                          ? new Date(selectedLand.lastSoilUpdate).toLocaleDateString() 
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Card - Only show if land is selected and has soil data */}
          {selectedLand && !showSoilWarning && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {language === 'english' ? 'Enter Additional Details' : 'கூடுதல் விவரங்களை உள்ளிடவும்'}
              </h2>

              <div className="space-y-4">
                {/* Location Display (State & District) */}
                {formData.state && formData.district && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900">
                          {language === 'english' ? 'Location' : 'இருப்பிடம்'}
                        </p>
                        <p className="text-blue-800 mt-1">
                          {formData.district}, {formData.state}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Temperature Display (if fetched) */}
                {temperatureC !== null && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <ThermometerSun className="w-4 h-4 text-green-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-green-900">
                          {language === 'english' ? 'Current Temperature' : 'தற்போதைய வெப்பநிலை'}
                        </p>
                        <p className="text-green-800 mt-1">
                          {temperatureC}°C
                          {tempLoading && <Loader2 className="w-3 h-3 animate-spin inline ml-2" />}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Land Area & Budget */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <TrendingUp className="w-4 h-4 inline mr-1" />
                      {language === 'english' ? 'Land Area (acres)' : 'நில பரப்பளவு (ஏக்கர்)'} *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.landAreaAcre}
                      onChange={(e) => handleInputChange('landAreaAcre', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="e.g., 5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      {language === 'english' ? 'Budget (INR)' : 'பட்ஜெட் (INR)'} *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.budgetInr}
                      onChange={(e) => handleInputChange('budgetInr', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="e.g., 200000"
                    />
                  </div>
                  
                  {/* Include Fertilizers Checkbox */}
                  <div className="flex items-center">
                    <label className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.includeFertilizers}
                        onChange={(e) => handleInputChange('includeFertilizers', e.target.checked)}
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-green-600 transition-colors">
                        <Sprout className="w-4 h-4 inline mr-1" />
                        {language === 'english' ? 'Include Fertilizers in Budget' : 'பட்ஜெட்டில் உரங்களை சேர்க்கவும்'}
                      </span>
                    </label>
                    <div className="ml-2 relative group">
                      <AlertCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                      <div className="hidden group-hover:block absolute left-0 bottom-full mb-2 w-64 bg-gray-800 text-white text-xs rounded p-2 z-10">
                        {language === 'english' 
                          ? 'Check this to get fertilizer recommendations and cost breakdown based on your budget'
                          : 'உங்கள் பட்ஜெட்டின் அடிப்படையில் உர பரிந்துரைகள் மற்றும் செலவு விவரங்களைப் பெற இதை தேர்ந்தெடுக்கவும்'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Planning Months & Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {language === 'english' ? 'Planning Duration (months)' : 'திட்டமிடல் காலம் (மாதங்கள்)'} *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={formData.planningMonths}
                      onChange={(e) => handleInputChange('planningMonths', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="e.g., 6"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'english' ? 'Planting Date' : 'நடவு தேதி'} *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">
                    {language === 'english' ? 'About this recommendation' : 'இந்த பரிந்துரையைப் பற்றி'}
                  </p>
                  <p className="text-blue-700">
                    {language === 'english'
                      ? 'This recommendation is based on historical crop data, soil conditions, weather, and budget constraints. For best results, provide accurate soil information.'
                      : 'இந்த பரிந்துரை வரலாற்று பயிர் தரவு, மண் நிலைமைகள், வானிலை மற்றும் பட்ஜெட் கட்டுப்பாடுகளின் அடிப்படையில் அமைந்துள்ளது. சிறந்த முடிவுகளுக்கு, துல்லியமான மண் தகவலை வழங்கவும்.'}
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleGetRecommendation}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-medium"
                disabled={recommendationLoading}
              >
                {recommendationLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {language === 'english' ? 'Getting Recommendation...' : 'பரிந்துரையைப் பெறுகிறது...'}
                  </>
                ) : (
                  <>
                    <Sprout className="w-5 h-5" />
                    {language === 'english' ? 'Get Crop Recommendation' : 'பயிர் பரிந்துரையைப் பெறுங்கள்'}
                  </>
                )}
              </button>
            </div>
          </div>
          )}

          {/* Error Display */}
          {recommendationError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">
                    {language === 'english' ? 'Error' : 'பிழை'}
                  </p>
                  <p className="text-sm text-red-700">{recommendationError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Recommendation Result */}
          {recommendation && (
            <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-green-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Sprout className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500">
                      {language === 'english' ? 'Recommended Crop' : 'பரிந்துரைக்கப்பட்ட பயிர்'}
                    </p>
                    <h2 className="text-2xl font-bold text-green-700">{recommendation.recommended_crop}</h2>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  recommendation.confidence === 'High' ? 'bg-green-100 text-green-700' :
                  recommendation.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {recommendation.confidence} {language === 'english' ? 'Confidence' : 'நம்பிக்கை'}
                </span>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">
                    {language === 'english' ? 'Season' : 'பருவம்'}
                  </p>
                  <p className="text-lg font-semibold text-green-700">{recommendation.season}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">
                    {language === 'english' ? 'Planned Area' : 'திட்டமிடப்பட்ட பரப்பு'}
                  </p>
                  <p className="text-lg font-semibold text-blue-700">
                    {detailedBudgetPlan 
                      ? `${detailedBudgetPlan.landAllocation.recommendedAcres} acres`
                      : `${(recommendation.planned_area_hectare / 0.404686).toFixed(2)} acres`
                    }
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">
                    {language === 'english' ? 'Yield per Acre' : 'ஏக்கருக்கு விளைச்சல்'}
                  </p>
                  <p className="text-lg font-semibold text-purple-700">{(recommendation.expected_yield_ton_per_hectare / 0.404686).toFixed(2)} tons</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">
                    {language === 'english' ? 'Total Production' : 'மொத்த உற்பத்தி'}
                  </p>
                  <p className="text-lg font-semibold text-orange-700">
                    {detailedBudgetPlan 
                      ? ((recommendation.expected_yield_ton_per_hectare / 0.404686) * detailedBudgetPlan.landAllocation.recommendedAcres).toFixed(2)
                      : ((recommendation.expected_yield_ton_per_hectare / 0.404686) * (recommendation.planned_area_hectare / 0.404686)).toFixed(2)
                    } tons
                  </p>
                </div>
              </div>

              {/* Budget Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">
                  {language === 'english' ? 'Budget Summary' : 'பட்ஜெட் சுருக்கம்'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">
                      {language === 'english' ? 'Status:' : 'நிலை:'}
                    </span>
                    <span className={`ml-2 font-medium ${
                      recommendation.budget_summary.status === 'fits' ? 'text-green-600' :
                      recommendation.budget_summary.status === 'reduce_area' ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {recommendation.budget_summary.status === 'fits' ? 'Budget Fits' :
                       recommendation.budget_summary.status === 'reduce_area' ? 'Area Reduced' :
                       'Budget Increase Needed'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">
                      {language === 'english' ? 'Cost/Acre:' : 'ஏக்கருக்கு செலவு:'}
                    </span>
                    <span className="ml-2 font-medium text-gray-800">
                      ₹{detailedBudgetPlan 
                        ? detailedBudgetPlan.budgetBreakdown.perAcre.totalPerAcre.toLocaleString()
                        : (recommendation.budget_summary.cost_per_hectare * 0.404686).toLocaleString()
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">
                      {language === 'english' ? 'Estimated Cost:' : 'மதிப்பிடப்பட்ட செலவு:'}
                    </span>
                    <span className="ml-2 font-medium text-gray-800">
                      ₹{recommendation.budget_summary.estimated_cost.toLocaleString()}
                    </span>
                  </div>
                  {recommendation.budget_summary.budget_remaining != null && (
                    <div>
                      <span className="text-gray-600">
                        {language === 'english' ? 'Remaining:' : 'மீதி:'}
                      </span>
                      <span className="ml-2 font-medium text-green-600">
                        ₹{recommendation.budget_summary.budget_remaining.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {recommendation.budget_summary.required_extra_budget != null && (
                    <div>
                      <span className="text-gray-600">
                        {language === 'english' ? 'Extra Needed:' : 'கூடுதல் தேவை:'}
                      </span>
                      <span className="ml-2 font-medium text-red-600">
                        ₹{recommendation.budget_summary.required_extra_budget.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Cost Breakdown */}
              {recommendation.budget_summary && (
                <div className="mb-4 bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    {language === 'english' ? 'Detailed Cost Breakdown' : 'விரிவான செலவு விவரம்'}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {recommendation.budget_summary.fertilizer_cost && (
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-gray-600 text-xs mb-1">
                          {language === 'english' ? 'Fertilizers' : 'உரங்கள்'}
                        </p>
                        <p className="font-semibold text-gray-800">
                          ₹{recommendation.budget_summary.fertilizer_cost.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {recommendation.budget_summary.seed_cost && (
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-gray-600 text-xs mb-1">
                          {language === 'english' ? 'Seeds' : 'விதைகள்'}
                        </p>
                        <p className="font-semibold text-gray-800">
                          ₹{recommendation.budget_summary.seed_cost.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {recommendation.budget_summary.labor_cost && (
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-gray-600 text-xs mb-1">
                          {language === 'english' ? 'Labor' : 'தொழிலாளர்'}
                        </p>
                        <p className="font-semibold text-gray-800">
                          ₹{recommendation.budget_summary.labor_cost.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {recommendation.budget_summary.other_costs && (
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-gray-600 text-xs mb-1">
                          {language === 'english' ? 'Other Costs' : 'பிற செலவுகள்'}
                        </p>
                        <p className="font-semibold text-gray-800">
                          ₹{recommendation.budget_summary.other_costs.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Financial Projections */}
              {recommendation.financials && (
                <div className="mb-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    {language === 'english' ? 'Financial Projections' : 'நிதி கணிப்புகள்'}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">
                        {language === 'english' ? 'Total Investment' : 'மொத்த முதலீடு'}
                      </p>
                      <p className="text-lg font-bold text-gray-800">
                        ₹{recommendation.financials.total_investment.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">
                        {language === 'english' ? 'Expected Yield' : 'எதிர்பார்க்கப்படும் மகசூல்'}
                      </p>
                      <p className="text-lg font-bold text-gray-800">
                        {recommendation.financials.expected_yield_tons} {language === 'english' ? 'tons' : 'டன்கள்'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">
                        {language === 'english' ? 'Market Price/Ton' : 'டன் விலை'}
                      </p>
                      <p className="text-lg font-bold text-gray-800">
                        ₹{recommendation.financials.market_price_per_ton.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">
                        {language === 'english' ? 'Gross Revenue' : 'மொத்த வருமானம்'}
                      </p>
                      <p className="text-lg font-bold text-blue-600">
                        ₹{recommendation.financials.gross_revenue.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">
                        {language === 'english' ? 'Net Profit' : 'நிகர லாபம்'}
                      </p>
                      <p className="text-lg font-bold text-green-600">
                        ₹{recommendation.financials.net_profit.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">
                        {language === 'english' ? 'ROI' : 'முதலீட்டு வருவாய்'}
                      </p>
                      <p className="text-lg font-bold text-green-600">
                        {recommendation.financials.roi_percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Insights */}
              {recommendation.ai_insights && (
                <div className="mb-4 bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                    <Sprout className="w-5 h-5" />
                    {language === 'english' ? 'AI Insights & Recommendations' : 'AI நுண்ணறிவு மற்றும் பரிந்துரைகள்'}
                  </h3>
                  <p className="text-purple-800 leading-relaxed text-sm">
                    {recommendation.ai_insights}
                  </p>
                </div>
              )}

              {/* Detailed Budget Plan from Groq AI */}
              {detailedBudgetPlan && (
                <div className="mb-4 border-2 border-blue-300 rounded-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
                    <h3 className="font-bold text-xl flex items-center gap-2">
                      <DollarSign className="w-6 h-6" />
                      {language === 'english' ? 'Detailed Budget & Land Allocation Plan (AI Generated)' : 'விரிவான பட்ஜெட் மற்றும் நில ஒதுக்கீடு திட்டம் (AI உருவாக்கியது)'}
                    </h3>
                  </div>

                  <div className="p-5 bg-white">
                    {/* Land Allocation Alert */}
                    {!detailedBudgetPlan.landAllocation.isFullLand && (
                      <div className="mb-4 bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-bold text-orange-900 mb-1">
                              {language === 'english' ? '⚠️ Budget Limitation Alert' : '⚠️ பட்ஜெட் வரம்பு எச்சரிக்கை'}
                            </h4>
                            <p className="text-orange-800 text-sm mb-2">
                              {language === 'english' 
                                ? `Your budget can only cover ${detailedBudgetPlan.landAllocation.recommendedAcres} acres out of ${formData.landAreaAcre} available acres.`
                                : `உங்கள் பட்ஜெட் ${formData.landAreaAcre} கிடைக்கக்கூடிய ஏக்கரில் ${detailedBudgetPlan.landAllocation.recommendedAcres} ஏக்கர் மட்டுமே உள்ளடக்கும்.`}
                            </p>
                            <p className="text-orange-700 text-sm font-medium">
                              {detailedBudgetPlan.landAllocation.reasoning}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {detailedBudgetPlan.landAllocation.isFullLand && (
                      <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-bold text-green-900 mb-1">
                              {language === 'english' ? '✓ Budget is Sufficient' : '✓ பட்ஜெட் போதுமானது'}
                            </h4>
                            <p className="text-green-800 text-sm">
                              {language === 'english' 
                                ? `You can cultivate all ${formData.landAreaAcre} acres with your budget of ₹${formData.budgetInr}.`
                                : `உங்கள் ₹${formData.budgetInr} பட்ஜெட்டில் அனைத்து ${formData.landAreaAcre} ஏக்கரையும் சாகுபடி செய்யலாம்.`}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Land to Use */}
                    <div className="mb-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-700 mb-1">
                          {language === 'english' ? 'Land to Use' : 'பயன்படுத்த நிலம்'}
                        </p>
                        <p className="text-2xl font-bold text-blue-900">
                          {detailedBudgetPlan.landAllocation.recommendedAcres} acres
                        </p>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-700 mb-1">
                          {language === 'english' ? 'Total Budget' : 'மொத்த பட்ஜெட்'}
                        </p>
                        <p className="text-2xl font-bold text-green-900">
                          ₹{detailedBudgetPlan.budgetBreakdown.totalCosts.grandTotal.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <p className="text-sm text-purple-700 mb-1">
                          {language === 'english' ? 'Cost per Acre' : 'ஏக்கருக்கு செலவு'}
                        </p>
                        <p className="text-2xl font-bold text-purple-900">
                          ₹{detailedBudgetPlan.budgetBreakdown.perAcre.totalPerAcre.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Detailed Cost Breakdown */}
                    <div className="mb-5">
                      <h4 className="font-semibold text-gray-800 mb-3 text-lg">
                        {language === 'english' ? 'Cost Breakdown (Per Acre & Total)' : 'செலவு விவரம் (ஏக்கருக்கு மற்றும் மொத்தம்)'}
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-100 border-b-2 border-gray-300">
                              <th className="text-left p-3 font-semibold">
                                {language === 'english' ? 'Cost Category' : 'செலவு வகை'}
                              </th>
                              <th className="text-right p-3 font-semibold">
                                {language === 'english' ? 'Per Acre' : 'ஏக்கருக்கு'}
                              </th>
                              <th className="text-right p-3 font-semibold">
                                {language === 'english' ? 'Total (All Acres)' : 'மொத்தம் (அனைத்து ஏக்கர்)'}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b hover:bg-gray-50">
                              <td className="p-3 font-medium">
                                {language === 'english' ? 'Land Preparation' : 'நில தயாரிப்பு'}
                              </td>
                              <td className="text-right p-3">
                                ₹{detailedBudgetPlan.budgetBreakdown.perAcre.landPreparation.toLocaleString()}
                              </td>
                              <td className="text-right p-3">
                                ₹{detailedBudgetPlan.budgetBreakdown.totalCosts.landPreparation.toLocaleString()}
                              </td>
                            </tr>
                            <tr className="border-b hover:bg-gray-50">
                              <td className="p-3">
                                <div className="font-medium">
                                  {language === 'english' ? 'Seeds' : 'விதைகள்'}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {detailedBudgetPlan.budgetBreakdown.perAcre.seeds.variety} 
                                  ({detailedBudgetPlan.budgetBreakdown.perAcre.seeds.quantityKg} kg/acre)
                                </div>
                              </td>
                              <td className="text-right p-3">
                                ₹{detailedBudgetPlan.budgetBreakdown.perAcre.seeds.cost.toLocaleString()}
                              </td>
                              <td className="text-right p-3">
                                ₹{detailedBudgetPlan.budgetBreakdown.totalCosts.seeds.toLocaleString()}
                              </td>
                            </tr>
                            {detailedBudgetPlan.budgetBreakdown.perAcre.fertilizers && (
                              <tr className="border-b hover:bg-gray-50 bg-green-50">
                                <td className="p-3">
                                  <div className="font-medium text-green-900">
                                    {language === 'english' ? 'Fertilizers' : 'உரங்கள்'}
                                  </div>
                                  <div className="text-xs text-green-700 mt-1">
                                    DAP: {detailedBudgetPlan.budgetBreakdown.perAcre.fertilizers.basalDose.dap.kg}kg, 
                                    Urea: {detailedBudgetPlan.budgetBreakdown.perAcre.fertilizers.basalDose.urea.kg}kg, 
                                    Potash: {detailedBudgetPlan.budgetBreakdown.perAcre.fertilizers.basalDose.potash.kg}kg
                                  </div>
                                </td>
                                <td className="text-right p-3 text-green-900 font-medium">
                                  ₹{detailedBudgetPlan.budgetBreakdown.perAcre.fertilizers.totalCost.toLocaleString()}
                                </td>
                                <td className="text-right p-3 text-green-900 font-medium">
                                  ₹{detailedBudgetPlan.budgetBreakdown.totalCosts.fertilizers.toLocaleString()}
                                </td>
                              </tr>
                            )}
                            <tr className="border-b hover:bg-gray-50">
                              <td className="p-3">
                                <div className="font-medium">
                                  {language === 'english' ? 'Labor' : 'தொழிலாளர்'}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  Prep, Sowing, Weeding, Harvesting
                                </div>
                              </td>
                              <td className="text-right p-3">
                                ₹{detailedBudgetPlan.budgetBreakdown.perAcre.labor.totalCost.toLocaleString()}
                              </td>
                              <td className="text-right p-3">
                                ₹{detailedBudgetPlan.budgetBreakdown.totalCosts.labor.toLocaleString()}
                              </td>
                            </tr>
                            <tr className="border-b hover:bg-gray-50">
                              <td className="p-3 font-medium">
                                {language === 'english' ? 'Irrigation' : 'நீர்ப்பாசனம்'}
                              </td>
                              <td className="text-right p-3">
                                ₹{detailedBudgetPlan.budgetBreakdown.perAcre.irrigation.toLocaleString()}
                              </td>
                              <td className="text-right p-3">
                                ₹{detailedBudgetPlan.budgetBreakdown.totalCosts.irrigation.toLocaleString()}
                              </td>
                            </tr>
                            <tr className="border-b hover:bg-gray-50">
                              <td className="p-3 font-medium">
                                {language === 'english' ? 'Pesticides/Herbicides' : 'பூச்சிக்கொல்லிகள்'}
                              </td>
                              <td className="text-right p-3">
                                ₹{detailedBudgetPlan.budgetBreakdown.perAcre.pesticides.toLocaleString()}
                              </td>
                              <td className="text-right p-3">
                                ₹{detailedBudgetPlan.budgetBreakdown.totalCosts.pesticides.toLocaleString()}
                              </td>
                            </tr>
                            <tr className="border-b hover:bg-gray-50">
                              <td className="p-3 font-medium">
                                {language === 'english' ? 'Other Costs (10% contingency)' : 'பிற செலவுகள் (10% அவசர)'}
                              </td>
                              <td className="text-right p-3">
                                ₹{detailedBudgetPlan.budgetBreakdown.perAcre.otherCosts.toLocaleString()}
                              </td>
                              <td className="text-right p-3">
                                ₹{detailedBudgetPlan.budgetBreakdown.totalCosts.otherCosts.toLocaleString()}
                              </td>
                            </tr>
                            <tr className="bg-blue-100 border-t-2 border-blue-300 font-bold">
                              <td className="p-3 text-blue-900">
                                {language === 'english' ? 'GRAND TOTAL' : 'மொத்த செலவு'}
                              </td>
                              <td className="text-right p-3 text-blue-900">
                                ₹{detailedBudgetPlan.budgetBreakdown.perAcre.totalPerAcre.toLocaleString()}
                              </td>
                              <td className="text-right p-3 text-blue-900">
                                ₹{detailedBudgetPlan.budgetBreakdown.totalCosts.grandTotal.toLocaleString()}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Financial Projections from Budget Plan */}
                    <div className="mb-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-3 text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        {language === 'english' ? 'Expected Returns' : 'எதிர்பார்க்கப்படும் வருமானம்'}
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <p className="text-xs text-gray-600 mb-1">
                            {language === 'english' ? 'Yield/Acre' : 'ஏக்கருக்கு விளைச்சல்'}
                          </p>
                          <p className="text-lg font-bold text-gray-800">
                            {detailedBudgetPlan.financialProjections.expectedYieldPerAcre} quintals
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <p className="text-xs text-gray-600 mb-1">
                            {language === 'english' ? 'Total Yield' : 'மொத்த விளைச்சல்'}
                          </p>
                          <p className="text-lg font-bold text-gray-800">
                            {detailedBudgetPlan.financialProjections.totalYield} quintals
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <p className="text-xs text-gray-600 mb-1">
                            {language === 'english' ? 'Market Price' : 'சந்தை விலை'}
                          </p>
                          <p className="text-lg font-bold text-gray-800">
                            ₹{detailedBudgetPlan.financialProjections.marketPricePerQuintal}/quintal
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <p className="text-xs text-gray-600 mb-1">
                            {language === 'english' ? 'Gross Revenue' : 'மொத்த வருமானம்'}
                          </p>
                          <p className="text-lg font-bold text-blue-600">
                            ₹{detailedBudgetPlan.financialProjections.grossRevenue.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <p className="text-xs text-gray-600 mb-1">
                            {language === 'english' ? 'Net Profit' : 'நிகர லாபம்'}
                          </p>
                          <p className="text-lg font-bold text-green-600">
                            ₹{detailedBudgetPlan.financialProjections.netProfit.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <p className="text-xs text-gray-600 mb-1">
                            {language === 'english' ? 'ROI' : 'முதலீட்டு வருவாய்'}
                          </p>
                          <p className="text-lg font-bold text-green-600">
                            {detailedBudgetPlan.financialProjections.roi}%
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-yellow-200">
                          <p className="text-xs text-gray-600 mb-1">
                            {language === 'english' ? 'Break-even Yield' : 'சமநிலை விளைச்சல்'}
                          </p>
                          <p className="text-lg font-bold text-yellow-600">
                            {detailedBudgetPlan.financialProjections.breakEvenYield.toFixed(1)} quintals
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Seed & Fertilizer Recommendations */}
                    <div className="mb-5 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <h4 className="font-semibold text-indigo-900 mb-3 text-lg">
                        {language === 'english' ? 'Agricultural Recommendations' : 'விவசாய பரிந்துரைகள்'}
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium text-indigo-900 mb-1">
                            {language === 'english' ? '🌾 Seed Variety:' : '🌾 விதை வகை:'}
                          </p>
                          <p className="text-sm text-indigo-800">{detailedBudgetPlan.recommendations.seedVariety}</p>
                        </div>
                        {detailedBudgetPlan.recommendations.fertilizerSchedule && detailedBudgetPlan.recommendations.fertilizerSchedule.length > 0 && (
                          <div>
                            <p className="font-medium text-indigo-900 mb-2">
                              {language === 'english' ? '🌱 Fertilizer Schedule:' : '🌱 உர அட்டவணை:'}
                            </p>
                            <div className="space-y-2">
                              {detailedBudgetPlan.recommendations.fertilizerSchedule.map((schedule: any, idx: number) => (
                                <div key={idx} className="bg-white rounded p-2 text-sm">
                                  <p className="font-medium text-gray-800">{schedule.stage}</p>
                                  <p className="text-gray-700">{schedule.fertilizers} - {schedule.quantity}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-indigo-900 mb-1">
                            {language === 'english' ? '💧 Irrigation:' : '💧 நீர்ப்பாசனம்:'}
                          </p>
                          <p className="text-sm text-indigo-800">{detailedBudgetPlan.recommendations.irrigationSchedule}</p>
                        </div>
                      </div>
                    </div>

                    {/* Critical Alerts */}
                    {detailedBudgetPlan.recommendations.criticalAlerts && detailedBudgetPlan.recommendations.criticalAlerts.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">
                          {language === 'english' ? '⚡ Important Alerts' : '⚡ முக்கிய எச்சரிக்கைகள்'}
                        </h4>
                        <ul className="space-y-2">
                          {detailedBudgetPlan.recommendations.criticalAlerts.map((alert: string, idx: number) => (
                            <li key={idx} className="text-sm text-yellow-800 flex items-start gap-2">
                              <span className="flex-shrink-0 mt-0.5">•</span>
                              <span>{alert}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Cultivation Plan Timeline */}
                    <div className="mb-5 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-300 rounded-lg p-5">
                      <h4 className="font-semibold text-gray-800 mb-4 text-lg flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        {language === 'english' ? 'Cultivation Plan & Timeline' : 'சாகுபடி திட்டம் & காலவரிசை'}
                      </h4>
                      
                      {/* Timeline Overview */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                          <p className="text-xs text-blue-700 mb-1 font-medium">
                            {language === 'english' ? 'Start Date' : 'தொடக்க தேதி'}
                          </p>
                          <p className="text-lg font-bold text-blue-900">
                            {new Date(formData.date).toLocaleDateString(language === 'english' ? 'en-IN' : 'ta-IN', { 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-purple-200">
                          <p className="text-xs text-purple-700 mb-1 font-medium">
                            {language === 'english' ? 'Duration' : 'காலம்'}
                          </p>
                          <p className="text-lg font-bold text-purple-900">
                            {formData.planningMonths} {language === 'english' ? 'months' : 'மாதங்கள்'}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                          <p className="text-xs text-green-700 mb-1 font-medium">
                            {language === 'english' ? 'Expected Harvest' : 'எதிர்பார்க்கப்படும் அறுவடை'}
                          </p>
                          <p className="text-lg font-bold text-green-900">
                            {new Date(new Date(formData.date).setMonth(new Date(formData.date).getMonth() + parseInt(formData.planningMonths))).toLocaleDateString(language === 'english' ? 'en-IN' : 'ta-IN', { 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Key Activities Timeline */}
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <h5 className="font-semibold text-gray-800 mb-3">
                          {language === 'english' ? 'Key Activities & Milestones' : 'முக்கிய செயல்பாடுகள் & மைல்கற்கள்'}
                        </h5>
                        <div className="space-y-3">
                          {/* Week 1-2: Land Preparation */}
                          <div className="flex gap-3 items-start">
                            <div className="flex-shrink-0 w-24 text-xs font-medium text-blue-700 bg-blue-100 rounded px-2 py-1">
                              {language === 'english' ? 'Week 1-2' : 'வாரம் 1-2'}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-800 text-sm">
                                {language === 'english' ? '🚜 Land Preparation' : '🚜 நில தயாரிப்பு'}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {language === 'english' 
                                  ? 'Plowing, leveling, and preparing soil. Apply basal fertilizers.'
                                  : 'உழுதல், சமன் செய்தல், மண் தயாரித்தல். அடிப்படை உரம் பயன்படுத்துதல்.'}
                              </p>
                            </div>
                          </div>

                          {/* Week 3: Sowing/Planting */}
                          <div className="flex gap-3 items-start">
                            <div className="flex-shrink-0 w-24 text-xs font-medium text-green-700 bg-green-100 rounded px-2 py-1">
                              {language === 'english' ? 'Week 3' : 'வாரம் 3'}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-800 text-sm">
                                {language === 'english' ? '🌱 Sowing/Planting' : '🌱 விதைத்தல்/நடுதல்'}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {language === 'english' 
                                  ? `Plant ${recommendation.recommended_crop} seeds. Ensure proper spacing and depth.`
                                  : `${recommendation.recommended_crop} விதைகளை நடவு செய்யவும். சரியான இடைவெளி மற்றும் ஆழத்தை உறுதி செய்யவும்.`}
                              </p>
                            </div>
                          </div>

                          {/* Month 1-2: Growth & Maintenance */}
                          <div className="flex gap-3 items-start">
                            <div className="flex-shrink-0 w-24 text-xs font-medium text-yellow-700 bg-yellow-100 rounded px-2 py-1">
                              {language === 'english' ? 'Month 1-2' : 'மாதம் 1-2'}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-800 text-sm">
                                {language === 'english' ? '💧 Growth & Maintenance' : '💧 வளர்ச்சி & பராமரிப்பு'}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {language === 'english' 
                                  ? 'Regular irrigation, weeding, pest monitoring. Apply top-dress fertilizers.'
                                  : 'வழக்கமான நீர்ப்பாசனம், களை எடுத்தல், பூச்சி கண்காணிப்பு. மேல் உரம் பயன்படுத்துதல்.'}
                              </p>
                            </div>
                          </div>

                          {/* Mid-Season */}
                          {parseInt(formData.planningMonths) >= 4 && (
                            <div className="flex gap-3 items-start">
                              <div className="flex-shrink-0 w-24 text-xs font-medium text-purple-700 bg-purple-100 rounded px-2 py-1">
                                {language === 'english' ? `Month ${Math.floor(parseInt(formData.planningMonths) / 2)}` : `மாதம் ${Math.floor(parseInt(formData.planningMonths) / 2)}`}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-800 text-sm">
                                  {language === 'english' ? '🌿 Mid-Season Care' : '🌿 நடுப்பருவ பராமரிப்பு'}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {language === 'english' 
                                    ? 'Flowering/fruiting stage. Ensure adequate water. Monitor for diseases.'
                                    : 'பூக்கும்/பழக்கும் நிலை. போதுமான நீர் உறுதி. நோய்களைக் கண்காணி.'}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Pre-Harvest */}
                          <div className="flex gap-3 items-start">
                            <div className="flex-shrink-0 w-24 text-xs font-medium text-orange-700 bg-orange-100 rounded px-2 py-1">
                              {language === 'english' ? `Month ${parseInt(formData.planningMonths) - 1}` : `மாதம் ${parseInt(formData.planningMonths) - 1}`}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-800 text-sm">
                                {language === 'english' ? '📊 Pre-Harvest Prep' : '📊 அறுவடைக்கு முன் தயாரிப்பு'}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {language === 'english' 
                                  ? 'Stop irrigation. Arrange labor and equipment for harvesting.'
                                  : 'நீர்ப்பாசனம் நிறுத்துதல். அறுவடைக்கு தொழிலாளர் மற்றும் உபகரணங்களை ஏற்பாடு செய்தல்.'}
                              </p>
                            </div>
                          </div>

                          {/* Harvest */}
                          <div className="flex gap-3 items-start">
                            <div className="flex-shrink-0 w-24 text-xs font-medium text-red-700 bg-red-100 rounded px-2 py-1">
                              {language === 'english' ? `Month ${formData.planningMonths}` : `மாதம் ${formData.planningMonths}`}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-800 text-sm">
                                {language === 'english' ? '✂️ Harvesting' : '✂️ அறுவடை'}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {language === 'english' 
                                  ? 'Harvest at right maturity. Record actual yield. Store properly.'
                                  : 'சரியான முதிர்ச்சியில் அறுவடை. உண்மையான விளைச்சலைப் பதிவு செய்யவும். சரியாக சேமிக்கவும்.'}
                              </p>
                            </div>
                          </div>

                          {/* Sale & Marketing */}
                          <div className="flex gap-3 items-start">
                            <div className="flex-shrink-0 w-24 text-xs font-medium text-indigo-700 bg-indigo-100 rounded px-2 py-1">
                              {language === 'english' ? 'Final Step' : 'இறுதி படி'}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-800 text-sm">
                                {language === 'english' ? '💰 Sale & Marketing' : '💰 விற்பனை & சந்தைப்படுத்துதல்'}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {language === 'english' 
                                  ? 'Find best buyers. Negotiate prices. Complete sale. Record revenue. Plan reaches 100% on sale completion!'
                                  : 'சிறந்த வாங்குபவர்களைக் கண்டறியவும். விலைகளை பேசவும். விற்பனையை முடிக்கவும். வருவாயைப் பதிவு செய்யவும். விற்பனை முடியும்போது திட்டம் 100% அடையும்!'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Success Tips */}
                      <div className="mt-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border-l-4 border-green-500">
                        <p className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          {language === 'english' ? 'Success Tips' : 'வெற்றி குறிப்புகள்'}
                        </p>
                        <ul className="space-y-1 text-xs text-green-800">
                          <li className="flex items-start gap-2">
                            <span className="flex-shrink-0">✓</span>
                            <span>
                              {language === 'english' 
                                ? 'Keep daily records of all activities, costs, and observations'
                                : 'அனைத்து செயல்பாடுகள், செலவுகள் மற்றும் கவனிப்புகளின் தினசரி பதிவுகளை வைத்திருங்கள்'}
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="flex-shrink-0">✓</span>
                            <span>
                              {language === 'english' 
                                ? 'Monitor weather forecasts and adjust irrigation accordingly'
                                : 'வானிலை முன்னறிவிப்புகளைக் கண்காணித்து அதற்கேற்ப நீர்ப்பாசனத்தை சரிசெய்யவும்'}
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="flex-shrink-0">✓</span>
                            <span>
                              {language === 'english' 
                                ? 'Join local farmer groups for knowledge sharing and market information'
                                : 'அறிவு பகிர்வு மற்றும் சந்தை தகவலுக்காக உள்ளூர் விவசாயி குழுக்களில் சேரவும்'}
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="flex-shrink-0">✓</span>
                            <span>
                              {language === 'english' 
                                ? 'Use the AI assistant for real-time advice on pest/disease management'
                                : 'பூச்சி/நோய் மேலாண்மை குறித்த நேரடி ஆலோசனைக்கு AI உதவியாளரைப் பயன்படுத்தவும்'}
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {loadingBudgetPlan && (
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-blue-800 font-medium">
                    {language === 'english' 
                      ? 'Generating detailed budget plan with AI...' 
                      : 'AI மூலம் விரிவான பட்ஜெட் திட்டத்தை உருவாக்குகிறது...'}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    {language === 'english' 
                      ? 'Calculating optimal land allocation and cost breakdown' 
                      : 'உகந்த நில ஒதுக்கீடு மற்றும் செலவு விவரங்களை கணக்கிடுகிறது'}
                  </p>
                </div>
              )}

              {/* Finalize Plan Button */}
              <div className="mb-6 bg-gradient-to-r from-green-100 to-blue-100 border-2 border-green-300 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      {language === 'english' ? 'Ready to Implement This Plan?' : 'இந்த திட்டத்தை செயல்படுத்த தயாரா?'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {language === 'english' 
                        ? 'Finalize this plan to start tracking activities, costs, and get AI-powered suggestions for next steps.'
                        : 'செயல்பாடுகள், செலவுகளைக் கண்காணிக்க மற்றும் அடுத்த படிகளுக்கான AI பரிந்துரைகளைப் பெற இந்த திட்டத்தை இறுதி செய்யவும்.'}
                    </p>
                  </div>
                  <button
                    onClick={handleFinalizePlan}
                    disabled={finalizingPlan}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                  >
                    {finalizingPlan ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {language === 'english' ? 'Creating...' : 'உருவாக்கப்படுகிறது...'}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        {language === 'english' ? 'Finalize Plan' : 'திட்டத்தை இறுதி செய்'}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Alternative Crops */}
              {recommendation.alternative_crops && recommendation.alternative_crops.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">
                      {language === 'english' ? 'Alternative Crops' : 'மாற்று பயிர்கள்'}
                    </h3>
                    <button
                      onClick={() => setShowComparison(!showComparison)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      {showComparison 
                        ? (language === 'english' ? 'Hide Comparison' : 'ஒப்பீட்டை மறை')
                        : (language === 'english' ? 'Compare Crops' : 'பயிர்களை ஒப்பிடுங்கள்')}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recommendation.alternative_crops.map((crop, index) => (
                      <label
                        key={index}
                        className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors ${
                          selectedCropsForComparison.includes(crop)
                            ? 'bg-blue-600 text-white'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={selectedCropsForComparison.includes(crop)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (selectedCropsForComparison.length < 3) {
                                setSelectedCropsForComparison([...selectedCropsForComparison, crop]);
                              }
                            } else {
                              setSelectedCropsForComparison(selectedCropsForComparison.filter(c => c !== crop));
                            }
                          }}
                          disabled={!selectedCropsForComparison.includes(crop) && selectedCropsForComparison.length >= 3}
                        />
                        {crop}
                      </label>
                    ))}
                  </div>
                  {selectedCropsForComparison.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      {language === 'english' 
                        ? `${selectedCropsForComparison.length}/3 crops selected for comparison`
                        : `ஒப்பீட்டுக்கு ${selectedCropsForComparison.length}/3 பயிர்கள் தேர்ந்தெடுக்கப்பட்டன`}
                    </p>
                  )}
                </div>
              )}

              {/* Crop Comparison Table */}
              {showComparison && selectedCropsForComparison.length > 0 && (
                <div className="mb-6 bg-white rounded-lg border-2 border-blue-300 p-4 shadow-lg">
                  <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6" />
                    {language === 'english' ? 'Crop Financial Comparison' : 'பயிர் நிதி ஒப்பீடு'}
                  </h3>
                  
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-gray-300">
                          <th className="text-left p-3 font-semibold text-gray-700">
                            {language === 'english' ? 'Crop' : 'பயிர்'}
                          </th>
                          <th className="text-right p-3 font-semibold text-gray-700">
                            {language === 'english' ? 'Investment' : 'முதலீடு'}
                          </th>
                          <th className="text-right p-3 font-semibold text-gray-700">
                            {language === 'english' ? 'Yield (tons)' : 'மகசூல் (டன்)'}
                          </th>
                          <th className="text-right p-3 font-semibold text-gray-700">
                            {language === 'english' ? 'Revenue' : 'வருமானம்'}
                          </th>
                          <th className="text-right p-3 font-semibold text-gray-700">
                            {language === 'english' ? 'Net Profit' : 'நிகர லாபம்'}
                          </th>
                          <th className="text-right p-3 font-semibold text-gray-700">
                            {language === 'english' ? 'ROI' : 'ROI'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Recommended Crop Row */}
                        {recommendation.financials && (
                          <tr className="bg-green-50 border-b border-gray-200">
                            <td className="p-3 font-semibold text-green-800">
                              {recommendation.recommended_crop} ⭐
                            </td>
                            <td className="p-3 text-right text-gray-800">
                              ₹{recommendation.financials.total_investment.toLocaleString()}
                            </td>
                            <td className="p-3 text-right text-gray-800">
                              {recommendation.financials.expected_yield_tons}
                            </td>
                            <td className="p-3 text-right text-blue-600 font-medium">
                              ₹{recommendation.financials.gross_revenue.toLocaleString()}
                            </td>
                            <td className="p-3 text-right text-green-600 font-bold">
                              ₹{recommendation.financials.net_profit.toLocaleString()}
                            </td>
                            <td className="p-3 text-right text-green-600 font-bold">
                              {recommendation.financials.roi_percentage.toFixed(1)}%
                            </td>
                          </tr>
                        )}
                        {/* Alternative Crops Rows - Mock Data (Replace with real API call) */}
                        {selectedCropsForComparison.map((crop, idx) => {
                          // Mock data - In production, fetch from API
                          const mockInvestment = recommendation.financials ? recommendation.financials.total_investment * (0.85 + Math.random() * 0.3) : 0;
                          const mockYield = recommendation.financials ? recommendation.financials.expected_yield_tons * (0.8 + Math.random() * 0.4) : 0;
                          const mockRevenue = recommendation.financials ? recommendation.financials.gross_revenue * (0.75 + Math.random() * 0.5) : 0;
                          const mockProfit = mockRevenue - mockInvestment;
                          const mockROI = mockInvestment > 0 ? (mockProfit / mockInvestment) * 100 : 0;
                          
                          return (
                            <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="p-3 text-gray-800">{crop}</td>
                              <td className="p-3 text-right text-gray-800">
                                ₹{Math.round(mockInvestment).toLocaleString()}
                              </td>
                              <td className="p-3 text-right text-gray-800">
                                {mockYield.toFixed(1)}
                              </td>
                              <td className="p-3 text-right text-blue-600">
                                ₹{Math.round(mockRevenue).toLocaleString()}
                              </td>
                              <td className={`p-3 text-right font-bold ${mockProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{Math.round(mockProfit).toLocaleString()}
                              </td>
                              <td className={`p-3 text-right font-bold ${mockROI > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {mockROI.toFixed(1)}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-4">
                    {/* Recommended Crop Card */}
                    {recommendation.financials && (
                      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                        <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                          {recommendation.recommended_crop} ⭐
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-600 text-xs">{language === 'english' ? 'Investment' : 'முதலீடு'}</p>
                            <p className="font-semibold text-gray-800">₹{recommendation.financials.total_investment.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs">{language === 'english' ? 'Yield' : 'மகசூல்'}</p>
                            <p className="font-semibold text-gray-800">{recommendation.financials.expected_yield_tons} tons</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs">{language === 'english' ? 'Revenue' : 'வருமானம்'}</p>
                            <p className="font-semibold text-blue-600">₹{recommendation.financials.gross_revenue.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs">{language === 'english' ? 'Net Profit' : 'நிகர லாபம்'}</p>
                            <p className="font-bold text-green-600">₹{recommendation.financials.net_profit.toLocaleString()}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-gray-600 text-xs">{language === 'english' ? 'ROI' : 'ROI'}</p>
                            <p className="font-bold text-green-600 text-lg">{recommendation.financials.roi_percentage.toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Alternative Crop Cards */}
                    {selectedCropsForComparison.map((crop, idx) => {
                      // Mock data - In production, fetch from API
                      const mockInvestment = recommendation.financials ? recommendation.financials.total_investment * (0.85 + Math.random() * 0.3) : 0;
                      const mockYield = recommendation.financials ? recommendation.financials.expected_yield_tons * (0.8 + Math.random() * 0.4) : 0;
                      const mockRevenue = recommendation.financials ? recommendation.financials.gross_revenue * (0.75 + Math.random() * 0.5) : 0;
                      const mockProfit = mockRevenue - mockInvestment;
                      const mockROI = mockInvestment > 0 ? (mockProfit / mockInvestment) * 100 : 0;
                      
                      return (
                        <div key={idx} className="bg-white border border-gray-300 rounded-lg p-4">
                          <h4 className="font-bold text-gray-800 mb-3">{crop}</h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-600 text-xs">{language === 'english' ? 'Investment' : 'முதலீடு'}</p>
                              <p className="font-semibold text-gray-800">₹{Math.round(mockInvestment).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-xs">{language === 'english' ? 'Yield' : 'மகசூல்'}</p>
                              <p className="font-semibold text-gray-800">{mockYield.toFixed(1)} tons</p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-xs">{language === 'english' ? 'Revenue' : 'வருமானம்'}</p>
                              <p className="font-semibold text-blue-600">₹{Math.round(mockRevenue).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-xs">{language === 'english' ? 'Net Profit' : 'நிகர லாபம்'}</p>
                              <p className={`font-bold ${mockProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{Math.round(mockProfit).toLocaleString()}
                              </p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-gray-600 text-xs">{language === 'english' ? 'ROI' : 'ROI'}</p>
                              <p className={`font-bold text-lg ${mockROI > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {mockROI.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Comparison AI Insights */}
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <Sprout className="w-5 h-5" />
                      {language === 'english' ? 'Comparison Insights' : 'ஒப்பீடு நுண்ணறிவு'}
                    </h4>
                    <p className="text-blue-800 text-sm leading-relaxed">
                      {language === 'english' 
                        ? `Based on your ${formData.landAreaAcre} acres land and budget of ₹${formData.budgetInr}, ${recommendation.recommended_crop} offers the highest ROI with lower risk. ${selectedCropsForComparison[0] || 'Alternative crops'} may require different soil management but could diversify your income.`
                        : `உங்கள் ${formData.landAreaAcre} ஏக்கர் நிலம் மற்றும் ₹${formData.budgetInr} பட்ஜெட்டின் அடிப்படையில், ${recommendation.recommended_crop} அதிக ROI வழங்குகிறது.`}
                    </p>
                  </div>

                  {/* Note about mock data */}
                  <div className="mt-3 text-xs text-gray-500 italic">
                    {language === 'english' 
                      ? '* Alternative crop data is estimated. Real API integration coming soon.'
                      : '* மாற்று பயிர் தரவு மதிப்பீடு. உண்மையான API விரைவில் வரும்.'}
                  </div>
                </div>
              )}

              {/* Explanation */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-semibold text-gray-800 mb-2">
                  {language === 'english' ? 'Explanation' : 'விளக்கம்'}
                </h3>
                <p className="text-gray-700 leading-relaxed">{recommendation.explanation}</p>
              </div>

              {/* Disclaimer */}
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>{language === 'english' ? 'Disclaimer:' : 'மறுப்பு:'}</strong> {recommendation.disclaimer}
                </p>
              </div>
            </div>
          )}
        </div>
      </Section>
    </PageContainer>
  );
}
