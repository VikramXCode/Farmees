import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  Upload, Camera, Loader2, CheckCircle2, AlertCircle, 
  MapPin, FlaskConical, Sprout, ArrowRight, Info, ChevronDown, Check 
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { landService } from '../services/landService';
import type { LandData as Land } from '../types/land';
import { API_BASE_URL } from '../config/api';
import { getApiHeaders } from '../services/api';

export default function SoilAnalyzerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const { user } = useAuth();
  
  // State management
  const [step, setStep] = useState<'upload' | 'review' | 'select-land' | 'success'>('upload');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string>('');
  const [parsedData, setParsedData] = useState<any>(null);
  const [lands, setLands] = useState<Land[]>([]);
  const [selectedLandId, setSelectedLandId] = useState<string>('');
  const [confirming, setConfirming] = useState(false);
  const [savedLand, setSavedLand] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch user's lands
  useEffect(() => {
    const fetchLands = async () => {
      if (!user?.id) return;
      try {
        const userLands = await landService.getAllUserLands(user.id);
        setLands(userLands);
        
        // Priority 1: Check if land was passed via location state (from LandDetailsPage or CropRecommendation)
        const landIdFromState = location.state?.landId;
        if (landIdFromState) {
          setSelectedLandId(landIdFromState);
          // Clear the state to prevent re-selection on subsequent renders
          window.history.replaceState({}, document.title);
          return;
        }
        
        // Priority 2: Check if coming from crop recommendation with selected land
        const landIdFromCropRec = sessionStorage.getItem('crop_recommendation_selected_land');
        if (landIdFromCropRec) {
          setSelectedLandId(landIdFromCropRec);
          // Don't clear yet - need it to persist through phases
          return;
        }
        
        // Priority 3: Check if returning from add-land page with a new landId
        const landIdFromUrl = searchParams.get('landId');
        const returningFromAddLand = sessionStorage.getItem('soil_analyzer_return');
        
        if (returningFromAddLand === 'true' && landIdFromUrl) {
          // Auto-select the land ID from URL parameter
          setSelectedLandId(landIdFromUrl);
          setStep('select-land');
          // Clear the flag and remove URL parameter
          sessionStorage.removeItem('soil_analyzer_return');
          navigate('/soil-analyzer', { replace: true });
        } else if (returningFromAddLand === 'true' && userLands.length > 0) {
          // Fallback: Auto-select the newest land (last in array)
          const newestLand = userLands[userLands.length - 1];
          setSelectedLandId(newestLand.landId);
          setStep('select-land');
          // Clear the flag
          sessionStorage.removeItem('soil_analyzer_return');
        }
      } catch (error) {
        console.error('Failed to fetch lands:', error);
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

  const t = {
    title: language === 'english' ? 'Soil Report Analyzer' : 'மண் அறிக்கை பகுப்பாய்வி',
    subtitle: language === 'english' 
      ? 'Analyze your government soil report and save it to your land' 
      : 'உங்கள் அரசு மண் அறிக்கையை பகுப்பாய்வு செய்து உங்கள் நிலத்தில் சேமிக்கவும்',
    uploadFile: language === 'english' ? 'Upload Report' : 'அறிக்கையைப் பதிவேற்று',
    captureCamera: language === 'english' ? 'Take Photo' : 'புகைப்படம் எடு',
    analyzing: language === 'english' ? 'Analyzing soil report...' : 'மண் அறிக்கையை பகுப்பாய்வு செய்கிறது...',
    reviewData: language === 'english' ? 'Review Soil Data' : 'மண் தரவை மதிப்பாய்வு செய்யவும்',
    selectLand: language === 'english' ? 'Select Land' : 'நிலத்தைத் தேர்ந்தெடு',
    confirmSave: language === 'english' ? 'Confirm & Save' : 'உறுதிப்படுத்து & சேமி',
    cancel: language === 'english' ? 'Cancel' : 'ரத்து செய்',
    next: language === 'english' ? 'Next' : 'அடுத்தது',
    validityBanner: language === 'english' 
      ? 'Soil reports are typically valid for 1-2 years' 
      : 'மண் அறிக்கைகள் பொதுவாக 1-2 ஆண்டுகளுக்கு செல்லுபடியாகும்',
    confidence: language === 'english' ? 'Confidence' : 'நம்பிக்கை',
    location: language === 'english' ? 'Location' : 'இடம்',
    soilProperties: language === 'english' ? 'Soil Properties' : 'மண் பண்புகள்',
    nutrients: language === 'english' ? 'Nutrients' : 'ஊட்டச்சத்துக்கள்',
    recommendations: language === 'english' ? 'Recommendations' : 'பரிந்துரைகள்',
    healthStatus: language === 'english' ? 'Health Status' : 'ஆரோக்கிய நிலை',
    success: language === 'english' ? 'Soil Data Saved Successfully!' : 'மண் தரவு வெற்றிகரமாக சேமிக்கப்பட்டது!',
    getCropRec: language === 'english' ? 'Get Crop Recommendation' : 'பயிர் பரிந்துரையைப் பெறுங்கள்',
    analyzeAnother: language === 'english' ? 'Analyze Another Report' : 'மற்றொரு அறிக்கையை பகுப்பாய்வு செய்யவும்'
  };

  const handleFileSelect = async (selectedFile: File) => {
    setError('');
    setAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`${API_BASE_URL}/soil-analyzer/analyze`, {
        method: 'POST',
        headers: getApiHeaders(true), // true = skip Content-Type for FormData
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to analyze soil report');
      }

      const result = await response.json();
      setParsedData(result);
      setStep('review');
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze soil report');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!selectedLandId) {
      setError(t.selectLand);
      return;
    }

    setConfirming(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/soil-analyzer/confirm`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          landId: selectedLandId,
          userId: user?.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save soil data');
      }

      const result = await response.json();
      setSavedLand(result.land);
      setStep('success');
      
      // Clear crop recommendation session storage after successful save
      sessionStorage.removeItem('crop_recommendation_selected_land');
    } catch (err: any) {
      console.error('Confirmation error:', err);
      setError(err.message || 'Failed to save soil data');
    } finally {
      setConfirming(false);
    }
  };

  const resetForm = () => {
    setStep('upload');
    setParsedData(null);
    setSelectedLandId('');
    setSavedLand(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <FlaskConical className="w-8 h-8" />
            <h1 className="text-2xl font-bold">{t.title}</h1>
          </div>
          <p className="text-green-100 text-sm">{t.subtitle}</p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'upload' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span className="text-sm font-medium hidden sm:inline">Upload</span>
          </div>
          <div className="flex-1 h-1 bg-gray-200 mx-2">
            <div className={`h-full bg-green-600 transition-all ${step !== 'upload' ? 'w-full' : 'w-0'}`} />
          </div>
          <div className={`flex items-center gap-2 ${step === 'review' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'review' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span className="text-sm font-medium hidden sm:inline">Review</span>
          </div>
          <div className="flex-1 h-1 bg-gray-200 mx-2">
            <div className={`h-full bg-green-600 transition-all ${step === 'select-land' || step === 'success' ? 'w-full' : 'w-0'}`} />
          </div>
          <div className={`flex items-center gap-2 ${step === 'select-land' || step === 'success' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'select-land' || step === 'success' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
              3
            </div>
            <span className="text-sm font-medium hidden sm:inline">Save</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Validity Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800">{t.validityBanner}</p>
            <p className="text-xs text-blue-600 mt-1">
              {language === 'english' 
                ? 'Upload once and reuse for multiple crop recommendations' 
                : 'ஒருமுறை பதிவேற்றவும் மற்றும் பல பயிர் பரிந்துரைகளுக்கு மீண்டும் பயன்படுத்தவும்'}
            </p>
          </div>
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Upload className="w-5 h-5 text-green-600" />
              {language === 'english' ? 'Upload Soil Report' : 'மண் அறிக்கையைப் பதிவேற்றவும்'}
            </h2>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) handleFileSelect(selectedFile);
              }}
            />

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) handleFileSelect(selectedFile);
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={analyzing}
                className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-12 h-12 text-green-600" />
                <div className="text-center">
                  <p className="font-medium text-gray-700">{t.uploadFile}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {language === 'english' ? 'PDF, JPG, PNG' : 'PDF, JPG, PNG'}
                  </p>
                </div>
              </button>

              <button
                onClick={() => cameraInputRef.current?.click()}
                disabled={analyzing}
                className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="w-12 h-12 text-green-600" />
                <div className="text-center">
                  <p className="font-medium text-gray-700">{t.captureCamera}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {language === 'english' ? 'Take a photo' : 'புகைப்படம் எடுக்கவும்'}
                  </p>
                </div>
              </button>
            </div>

            {analyzing && (
              <div className="flex items-center justify-center gap-3 py-8">
                <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                <span className="text-gray-600">{t.analyzing}</span>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Review */}
        {step === 'review' && parsedData && (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">{t.reviewData}</h2>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                <CheckCircle2 className="w-4 h-4" />
                {t.confidence}: {parsedData.confidence}
              </div>
            </div>

            <div className="space-y-4">
              {/* Location */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  {t.location}
                </h3>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">{language === 'tamil' ? 'மாநிலம்:' : 'State:'}</span>
                    <p className="font-medium text-gray-800">{parsedData.parsedData.location.state}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">{language === 'tamil' ? 'மாவட்டம்:' : 'District:'}</span>
                    <p className="font-medium text-gray-800">{parsedData.parsedData.location.district}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">{language === 'tamil' ? 'கிராமம்:' : 'Village:'}</span>
                    <p className="font-medium text-gray-800">{parsedData.parsedData.location.village}</p>
                  </div>
                </div>
              </div>

              {/* Soil Properties */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-3">{t.soilProperties}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">{language === 'tamil' ? 'வகை:' : 'Type:'}</span>
                    <p className="font-medium text-gray-800">{parsedData.parsedData.soilProperties.type}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">pH:</span>
                    <p className="font-medium text-gray-800">{parsedData.parsedData.soilProperties.pH}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">EC:</span>
                    <p className="font-medium text-gray-800">{parsedData.parsedData.soilProperties.ec} dS/m</p>
                  </div>
                  <div>
                    <span className="text-gray-500">{language === 'tamil' ? 'ஆரோக்கியம்:' : 'Health:'}</span>
                    <p className="font-medium text-green-600">{parsedData.parsedData.healthStatus}</p>
                  </div>
                </div>
              </div>

              {/* Nutrients */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-3">{t.nutrients}</h3>
                <div className="space-y-3">
                  {Object.entries(parsedData.parsedData.nutrients).map(([key, nutrient]: [string, any]) => {
                    const nutrientLabels: Record<string, string> = {
                      nitrogen: language === 'tamil' ? 'நைட்ரஜன்' : 'Nitrogen',
                      phosphorus: language === 'tamil' ? 'பாஸ்பரஸ்' : 'Phosphorus',
                      potassium: language === 'tamil' ? 'பொட்டாசியம்' : 'Potassium',
                      zinc: language === 'tamil' ? 'துத்தநாகம்' : 'Zinc',
                      iron: language === 'tamil' ? 'இரும்பு' : 'Iron',
                      boron: language === 'tamil' ? 'போரான்' : 'Boron'
                    };
                    const statusLabels: Record<string, string> = {
                      'High': language === 'tamil' ? 'அதிகம்' : 'High',
                      'Medium': language === 'tamil' ? 'நடுத்தரம்' : 'Medium',
                      'Low': language === 'tamil' ? 'குறைவு' : 'Low',
                      'Sufficient': language === 'tamil' ? 'போதுமானது' : 'Sufficient',
                      'Deficient': language === 'tamil' ? 'குறைபாடு' : 'Deficient'
                    };
                    
                    return nutrient && (
                      <div key={key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 pb-2 border-b border-gray-200 last:border-0">
                        <span className="text-gray-600 font-medium text-sm">{nutrientLabels[key] || key}</span>
                        <span className={`font-medium text-sm ${
                          nutrient.status === 'High' ? 'text-green-600' :
                          nutrient.status === 'Low' ? 'text-red-600' :
                          'text-yellow-600'
                        }`}>
                          {nutrient.value} {nutrient.unit} ({statusLabels[nutrient.status] || nutrient.status})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recommendations */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-medium text-gray-800 mb-3">{t.recommendations}</h3>
                <ul className="space-y-2 text-sm">
                  {(language === 'tamil' && (parsedData.recommendations_tamil || parsedData.parsedData?.recommendations_tamil)
                    ? (parsedData.recommendations_tamil || parsedData.parsedData.recommendations_tamil)
                    : parsedData.parsedData.recommendations
                  ).map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <span className="text-green-600 font-bold">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep('select-land');
                  // If land was pre-selected from LandDetailsPage, keep it selected
                  // Otherwise, allow user to select in phase 3
                }}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                {t.next}
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={resetForm}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Select Land */}
        {step === 'select-land' && (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              {t.selectLand}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'english' ? 'Select a land to attach soil data' : 'மண் தரவை இணைக்க நிலத்தைத் தேர்ந்தெடுக்கவும்'}
                </label>
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
                          sessionStorage.setItem('soil_analyzer_return', 'true');
                          navigate('/add-land?returnTo=soil-analyzer');
                        }}
                        className="px-5 py-3.5 cursor-pointer transition-colors border-t-2 border-gray-200 hover:bg-green-50 text-green-600 font-semibold flex items-center gap-2"
                      >
                        <span className="text-lg">➕</span>
                        <span>{language === 'english' ? 'Add New Land' : 'புதிய நிலத்தைச் சேர்க்கவும்'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedLandId && selectedLandId !== 'add-new' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  {(() => {
                    const land = lands.find(l => l.landId === selectedLandId);
                    return land ? (
                      <div>
                        <p className="font-semibold text-gray-800 mb-1">{land.name}</p>
                        <p className="text-sm text-gray-600">{land.location}</p>
                        <p className="text-sm text-gray-600">{land.landSize?.value} {land.landSize?.unit}</p>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleConfirmSave}
                disabled={!selectedLandId || selectedLandId === 'add-new' || confirming}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              >
                {confirming ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {language === 'english' ? 'Saving...' : 'சேமிக்கிறது...'}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    {t.confirmSave}
                  </>
                )}
              </button>
              <button
                onClick={() => setStep('review')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {language === 'english' ? 'Back' : 'பின்'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && savedLand && (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">{t.success}</h2>
              <p className="text-gray-600">
                {language === 'english' 
                  ? `Soil data has been saved to "${savedLand.name}"` 
                  : `மண் தரவு "${savedLand.name}" இல் சேமிக்கப்பட்டது`}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Land:</span>
                <span className="font-medium text-gray-800">{savedLand.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Soil Type:</span>
                <span className="font-medium text-gray-800">{savedLand.soilType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Health:</span>
                <span className="font-medium text-green-600">{savedLand.soilHealth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Updated:</span>
                <span className="font-medium text-gray-800">
                  {new Date(savedLand.lastUpdated).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  // Check if user came from crop recommendation
                  const returnTo = location.state?.returnTo;
                  if (returnTo === 'crop-recommendation') {
                    // Return to crop recommendation with the saved land selected
                    navigate('/crop-recommendation', { 
                      state: { landId: savedLand.landId },
                      replace: true 
                    });
                  } else {
                    // Normal flow - go to crop recommendation
                    navigate('/crop-recommendation');
                  }
                }}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Sprout className="w-5 h-5" />
                {t.getCropRec}
              </button>
              <button
                onClick={resetForm}
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t.analyzeAnother}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
