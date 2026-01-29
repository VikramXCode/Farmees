import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sprout, MapPin, ThermometerSun, Loader2, TrendingUp, Calendar, DollarSign, AlertCircle, Upload, ChevronDown, Check } from 'lucide-react';
import { PageContainer, Section } from '../components/layout/AppShell';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import weatherService from '../services/weatherService';
import { getCropRecommendation, type CropRecommendationResponse } from '../services/cropRecommendationProxy';
import { landService } from '../services/landService';
import type { LandData as Land } from '../types/land';

export default function CropRecommendationPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
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

  // Fetch user's lands on mount
  useEffect(() => {
    const fetchLands = async () => {
      if (!user?.id) return;
      setLandsLoading(true);
      try {
        const userLands = await landService.getAllUserLands(user.id);
        setLands(userLands);
        
        // Check if returning from add-land page with a new landId
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
  }, [user, searchParams, navigate]);
  
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

  const handleInputChange = (field: string, value: string) => {
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
    } catch (error: any) {
      setRecommendationError(error?.message || 'Failed to fetch crop recommendation');
    } finally {
      setRecommendationLoading(false);
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
                          onClick={() => navigate('/soil-analyzer')}
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
                  <p className="text-lg font-semibold text-blue-700">{recommendation.planned_area_hectare} ha</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">
                    {language === 'english' ? 'Yield per Hectare' : 'ஹெக்டேருக்கு விளைச்சல்'}
                  </p>
                  <p className="text-lg font-semibold text-purple-700">{recommendation.expected_yield_ton_per_hectare} tons</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">
                    {language === 'english' ? 'Total Production' : 'மொத்த உற்பத்தி'}
                  </p>
                  <p className="text-lg font-semibold text-orange-700">{recommendation.total_production_tons} tons</p>
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
                      {language === 'english' ? 'Cost/Hectare:' : 'ஹெக்டேருக்கு செலவு:'}
                    </span>
                    <span className="ml-2 font-medium text-gray-800">
                      ₹{recommendation.budget_summary.cost_per_hectare.toLocaleString()}
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
