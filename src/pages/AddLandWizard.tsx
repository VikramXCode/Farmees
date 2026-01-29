import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Ruler,
  FlaskConical,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Navigation,
  Camera,
  Upload,
  Loader2,
  Check,
  AlertCircle,
  Map,
  Droplets,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useFarm } from '../contexts/FarmContext';
import {
  FarmerButton,
  FarmerCard,
  StepProgress,
  StepProgressBar,
  FarmerInput,
  FarmerSelect,
  FarmerSlider,
  FarmerSegmentedControl,
} from '../components/farmer-ui';
import AutocompleteInput from '../components/common/AutocompleteInput';
import { getLocationSuggestions, geocodePincode, type LocationSuggestion } from '../services/geocodingService';
import { getSoilTypeSuggestions } from '../data/soilTypes';
import { debounce } from '../utils/debounce';

/**
 * AddLandWizard - Guided 4-step flow for adding land
 * 
 * Steps:
 * 1. Location - Village/District search + GPS option
 * 2. Land Details - Area, optional boundary mapping
 * 3. Soil Details - Upload report OR manual entry
 * 4. Budget & Planning - Budget, duration, season
 */

interface FormData {
  // Step 1: Location
  location: string;
  state: string;
  district: string;
  village: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  
  // Step 2: Land Details
  name: string;
  areaValue: string;
  areaUnit: 'hectare' | 'acre';
  hasBoundary: boolean;
  
  // Step 3: Soil Details
  soilInputMethod: 'upload' | 'manual';
  soilType: string;
  ph: number;
  nitrogenLevel: 'low' | 'medium' | 'high';
  phosphorusLevel: 'low' | 'medium' | 'high';
  potassiumLevel: 'low' | 'medium' | 'high';
  soilReportFile: File | null;
  
  // Step 4: Budget & Planning
  budget: string;
  planningMonths: string;
  preferredSeason: 'kharif' | 'rabi' | 'zaid' | 'auto';
  waterAvailability: 'high' | 'medium' | 'low';
}

const initialFormData: FormData = {
  location: '',
  state: '',
  district: '',
  village: '',
  postalCode: '',
  latitude: null,
  longitude: null,
  name: '',
  areaValue: '',
  areaUnit: 'acre',
  hasBoundary: false,
  soilInputMethod: 'manual',
  soilType: '',
  ph: 7.0,
  nitrogenLevel: 'medium',
  phosphorusLevel: 'medium',
  potassiumLevel: 'medium',
  soilReportFile: null,
  budget: '',
  planningMonths: '6',
  preferredSeason: 'auto',
  waterAvailability: 'medium',
};

export default function AddLandWizard() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { addLand } = useFarm();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const soilSuggestions = getSoilTypeSuggestions('');

  // Translations
  const t = {
    step1Title: language === 'english' ? 'Location' : 'இருப்பிடம்',
    step2Title: language === 'english' ? 'Land Details' : 'நில விவரங்கள்',
    step3Title: language === 'english' ? 'Soil Details' : 'மண் விவரங்கள்',
    step4Title: language === 'english' ? 'Budget & Plan' : 'பட்ஜெட் & திட்டம்',
    back: language === 'english' ? 'Back' : 'பின்',
    next: language === 'english' ? 'Next' : 'அடுத்து',
    getRecommendation: language === 'english' ? 'Get Recommendation' : 'பரிந்துரை பெறு',
    useMyLocation: language === 'english' ? 'Use My Location' : 'என் இருப்பிடத்தைப் பயன்படுத்து',
    searchLocation: language === 'english' ? 'Search village, district...' : 'கிராமம், மாவட்டம் தேடு...',
    landName: language === 'english' ? 'Land Name' : 'நிலத்தின் பெயர்',
    landArea: language === 'english' ? 'Land Area' : 'நிலப் பரப்பு',
    uploadSoilReport: language === 'english' ? 'Upload Soil Report' : 'மண் அறிக்கை பதிவேற்று',
    manualEntry: language === 'english' ? 'Enter Manually' : 'கைமுறையாக உள்ளிடு',
    soilType: language === 'english' ? 'Soil Type' : 'மண் வகை',
    phLevel: language === 'english' ? 'pH Level' : 'pH அளவு',
    nutrients: language === 'english' ? 'Nutrient Levels' : 'ஊட்டச்சத்து நிலைகள்',
    budget: language === 'english' ? 'Budget (₹)' : 'பட்ஜெட் (₹)',
    planningDuration: language === 'english' ? 'Planning Duration' : 'திட்டமிடல் காலம்',
    months: language === 'english' ? 'months' : 'மாதங்கள்',
    preferredSeason: language === 'english' ? 'Preferred Season' : 'விருப்பமான பருவம்',
    waterAvailability: language === 'english' ? 'Water Availability' : 'நீர் கிடைக்கும்',
    low: language === 'english' ? 'Low' : 'குறைவு',
    medium: language === 'english' ? 'Medium' : 'நடுத்தரம்',
    high: language === 'english' ? 'High' : 'அதிகம்',
    auto: language === 'english' ? 'Auto Detect' : 'தானியங்கி',
    kharif: language === 'english' ? 'Kharif (Monsoon)' : 'கார்ப் (மழைக்காலம்)',
    rabi: language === 'english' ? 'Rabi (Winter)' : 'ரபி (குளிர்காலம்)',
    zaid: language === 'english' ? 'Zaid (Summer)' : 'சைத் (கோடைகாலம்)',
  };

  const steps = [
    { id: 1, title: t.step1Title },
    { id: 2, title: t.step2Title },
    { id: 3, title: t.step3Title },
    { id: 4, title: t.step4Title },
  ];

  // Location search with debounce
  const fetchLocations = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setLocationSuggestions([]);
        return;
      }

      setLocationLoading(true);
      try {
        const suggestions = await getLocationSuggestions(query);
        setLocationSuggestions(suggestions);
      } catch (error) {
        console.error('Location fetch error:', error);
        setLocationSuggestions([]);
      } finally {
        setLocationLoading(false);
      }
    }, 400),
    []
  );

  const handleLocationChange = (value: string) => {
    setFormData(prev => ({ ...prev, location: value }));
    fetchLocations(value);
  };

  const handleLocationSelect = (displayName: string) => {
    const selected = locationSuggestions.find(loc => loc.displayName === displayName);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        location: displayName,
        state: selected.state || '',
        district: selected.city || '',
        latitude: selected.latitude ?? null,
        longitude: selected.longitude ?? null,
        name: prev.name || `${selected.city || 'My'} Farm`,
      }));
      setLocationSuggestions([]);
    }
  };

  const handleUseGPS = async () => {
    if (!navigator.geolocation) {
      setErrors({ location: 'GPS not supported on this device' });
      return;
    }

    setGpsLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Reverse geocode to get location name
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();

      setFormData(prev => ({
        ...prev,
        latitude,
        longitude,
        location: data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        state: data.address?.state || '',
        district: data.address?.county || data.address?.city || '',
        village: data.address?.village || data.address?.suburb || '',
        postalCode: data.address?.postcode || '',
        name: prev.name || `${data.address?.village || data.address?.city || 'My'} Farm`,
      }));
    } catch (error) {
      setErrors({ location: 'Could not get your location. Please search manually.' });
    } finally {
      setGpsLoading(false);
    }
  };

  const handlePincodeChange = async (pincode: string) => {
    setFormData(prev => ({ ...prev, postalCode: pincode }));
    
    if (pincode.length === 6) {
      try {
        const geoData = await geocodePincode(pincode);
        if (geoData) {
          setFormData(prev => ({
            ...prev,
            latitude: geoData.lat,
            longitude: geoData.lng,
            location: geoData.displayName,
            state: geoData.state || '',
            district: geoData.city || '',
            village: geoData.area || '',
          }));
        }
      } catch (error) {
        console.error('Pincode lookup failed:', error);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormData(prev => ({ ...prev, soilReportFile: file }));
    setUploadLoading(true);

    // Simulate OCR processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setUploadLoading(false);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.location && !formData.postalCode) {
        newErrors.location = 'Please enter a location or pincode';
      }
    }

    if (step === 2) {
      if (!formData.name) {
        newErrors.name = 'Please enter a name for your land';
      }
      if (!formData.areaValue) {
        newErrors.area = 'Please enter the land area';
      }
    }

    if (step === 3) {
      if (formData.soilInputMethod === 'manual' && !formData.soilType) {
        newErrors.soilType = 'Please select a soil type';
      }
    }

    if (step === 4) {
      if (!formData.budget) {
        newErrors.budget = 'Please enter your budget';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setSubmitting(true);
    try {
      // Create land data
      const landData: any = {
        name: formData.name,
        location: formData.location,
        postalCode: formData.postalCode,
        district: formData.district,
        country: 'India',
        soilType: formData.soilType,
        waterAvailability: formData.waterAvailability,
        currentCrop: '',
      };

      if (formData.latitude && formData.longitude) {
        landData.coordinates = {
          latitude: formData.latitude,
          longitude: formData.longitude,
        };
      }

      if (formData.areaValue) {
        landData.landSize = {
          value: parseFloat(formData.areaValue),
          unit: formData.areaUnit === 'hectare' ? 'hectares' : 'acres',
        };
      }

      const landId = await addLand(landData);

      // Navigate to recommendation with form data
      navigate('/crop-recommendation-result', {
        state: {
          landId,
          state: formData.state,
          district: formData.district,
          landAreaHectare: formData.areaUnit === 'hectare' 
            ? parseFloat(formData.areaValue)
            : parseFloat(formData.areaValue) * 0.4047,
          budgetInr: parseFloat(formData.budget),
          planningMonths: parseInt(formData.planningMonths),
          soilType: formData.soilType,
          ph: formData.ph,
          season: formData.preferredSeason,
          latitude: formData.latitude,
          longitude: formData.longitude,
        },
      });
    } catch (error) {
      console.error('Failed to add land:', error);
      setErrors({ submit: 'Failed to save land. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-green-100">
        <div className="max-w-lg mx-auto px-4 py-4">
          {/* Progress indicator */}
          <StepProgressBar currentStep={currentStep} totalSteps={4} />
          
          {/* Step indicators */}
          <div className="mt-4">
            <StepProgress
              steps={steps}
              currentStep={currentStep}
              onStepClick={(step) => step < currentStep && setCurrentStep(step)}
            />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-32">
        {/* Step 1: Location */}
        {currentStep === 1 && (
          <div className="py-6 space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {language === 'english' ? 'Where is your land?' : 'உங்கள் நிலம் எங்கே?'}
              </h2>
              <p className="text-gray-500 mt-2">
                {language === 'english' 
                  ? 'Search or use GPS to find your farm location'
                  : 'உங்கள் பண்ணை இருப்பிடத்தைக் கண்டறிய தேடுங்கள் அல்லது GPS பயன்படுத்தவும்'
                }
              </p>
            </div>

            {/* GPS Button */}
            <FarmerButton
              onClick={handleUseGPS}
              variant="outline"
              size="lg"
              fullWidth
              loading={gpsLoading}
              leftIcon={<Navigation className="w-5 h-5" />}
            >
              {t.useMyLocation}
            </FarmerButton>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-gray-400 text-sm">
                {language === 'english' ? 'OR' : 'அல்லது'}
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Location Search */}
            <div className="space-y-2">
              <label className="block text-base font-semibold text-gray-700">
                {language === 'english' ? 'Search Location' : 'இருப்பிடம் தேடு'}
              </label>
              <AutocompleteInput
                value={formData.location}
                onChange={handleLocationChange}
                onSelect={handleLocationSelect}
                suggestions={locationSuggestions.map(loc => loc.displayName)}
                loading={locationLoading}
                placeholder={t.searchLocation}
                showSuggestionsOnFocus={false}
                minCharsForSuggestions={2}
              />
              {errors.location && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.location}
                </p>
              )}
            </div>

            {/* Pincode Input */}
            <FarmerInput
              label={language === 'english' ? 'PIN Code' : 'பின் குறியீடு'}
              value={formData.postalCode}
              onChange={handlePincodeChange}
              type="tel"
              placeholder="638060"
              helperText={language === 'english' 
                ? 'Enter 6-digit PIN code'
                : '6 இலக்க பின் குறியீட்டை உள்ளிடவும்'
              }
            />

            {/* Selected Location Display */}
            {formData.state && (
              <FarmerCard variant="success" padding="md">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">
                      {language === 'english' ? 'Location Found' : 'இருப்பிடம் கண்டறியப்பட்டது'}
                    </p>
                    <p className="text-sm text-green-700">
                      {formData.village && `${formData.village}, `}
                      {formData.district}, {formData.state}
                    </p>
                  </div>
                </div>
              </FarmerCard>
            )}
          </div>
        )}

        {/* Step 2: Land Details */}
        {currentStep === 2 && (
          <div className="py-6 space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Ruler className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {language === 'english' ? 'Land Details' : 'நில விவரங்கள்'}
              </h2>
              <p className="text-gray-500 mt-2">
                {language === 'english'
                  ? 'Tell us about your farm size'
                  : 'உங்கள் பண்ணை அளவைப் பற்றி சொல்லுங்கள்'
                }
              </p>
            </div>

            {/* Land Name */}
            <FarmerInput
              label={t.landName}
              value={formData.name}
              onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
              placeholder={language === 'english' ? 'e.g., Main Farm' : 'உதாரணம்: முக்கிய பண்ணை'}
              required
              error={errors.name}
            />

            {/* Area Unit Toggle */}
            <FarmerSegmentedControl
              label={language === 'english' ? 'Area Unit' : 'பரப்பு அலகு'}
              value={formData.areaUnit}
              onChange={(value) => setFormData(prev => ({ ...prev, areaUnit: value as 'hectare' | 'acre' }))}
              options={[
                { value: 'acre', label: language === 'english' ? 'Acres' : 'ஏக்கர்' },
                { value: 'hectare', label: language === 'english' ? 'Hectares' : 'ஹெக்டேர்' },
              ]}
            />

            {/* Land Area */}
            <FarmerInput
              label={t.landArea}
              value={formData.areaValue}
              onChange={(value) => setFormData(prev => ({ ...prev, areaValue: value }))}
              type="number"
              placeholder="5"
              suffix={formData.areaUnit === 'hectare' ? 'ha' : 'ac'}
              required
              error={errors.area}
            />

            {/* Map Boundary Option */}
            <FarmerCard 
              padding="md"
              onClick={() => setFormData(prev => ({ ...prev, hasBoundary: !prev.hasBoundary }))}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Map className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {language === 'english' ? 'Mark Farm Boundary' : 'பண்ணை எல்லையைக் குறிக்கவும்'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {language === 'english' ? 'Optional - Draw on map' : 'விருப்பம் - வரைபடத்தில் வரையவும்'}
                    </p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 ${
                  formData.hasBoundary 
                    ? 'bg-green-500 border-green-500' 
                    : 'border-gray-300'
                }`}>
                  {formData.hasBoundary && <Check className="w-5 h-5 text-white" />}
                </div>
              </div>
            </FarmerCard>
          </div>
        )}

        {/* Step 3: Soil Details */}
        {currentStep === 3 && (
          <div className="py-6 space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FlaskConical className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {language === 'english' ? 'Soil Information' : 'மண் தகவல்'}
              </h2>
              <p className="text-gray-500 mt-2">
                {language === 'english'
                  ? 'Upload soil report or enter details manually'
                  : 'மண் அறிக்கையைப் பதிவேற்றவும் அல்லது விவரங்களை கைமுறையாக உள்ளிடவும்'
                }
              </p>
            </div>

            {/* Input Method Toggle */}
            <div className="grid grid-cols-2 gap-3">
              <FarmerCard
                variant={formData.soilInputMethod === 'upload' ? 'success' : 'default'}
                padding="md"
                onClick={() => setFormData(prev => ({ ...prev, soilInputMethod: 'upload' }))}
              >
                <div className="text-center">
                  <Camera className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <p className="font-semibold text-sm">{t.uploadSoilReport}</p>
                </div>
              </FarmerCard>
              
              <FarmerCard
                variant={formData.soilInputMethod === 'manual' ? 'success' : 'default'}
                padding="md"
                onClick={() => setFormData(prev => ({ ...prev, soilInputMethod: 'manual' }))}
              >
                <div className="text-center">
                  <FlaskConical className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <p className="font-semibold text-sm">{t.manualEntry}</p>
                </div>
              </FarmerCard>
            </div>

            {/* Upload Section */}
            {formData.soilInputMethod === 'upload' && (
              <div className="space-y-4">
                <label className="block">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    capture="environment"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <FarmerCard padding="lg" className="text-center cursor-pointer border-dashed border-2">
                    {uploadLoading ? (
                      <div className="py-4">
                        <Loader2 className="w-12 h-12 mx-auto text-green-600 animate-spin" />
                        <p className="mt-3 font-semibold text-gray-700">
                          {language === 'english' ? 'Scanning soil report...' : 'மண் அறிக்கையை ஸ்கேன் செய்கிறது...'}
                        </p>
                      </div>
                    ) : formData.soilReportFile ? (
                      <div className="py-4">
                        <Check className="w-12 h-12 mx-auto text-green-600" />
                        <p className="mt-3 font-semibold text-green-700">
                          {formData.soilReportFile.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {language === 'english' ? 'Tap to change' : 'மாற்ற தொடவும்'}
                        </p>
                      </div>
                    ) : (
                      <div className="py-4">
                        <Upload className="w-12 h-12 mx-auto text-gray-400" />
                        <p className="mt-3 font-semibold text-gray-700">
                          {language === 'english' ? 'Upload or capture' : 'பதிவேற்றவும் அல்லது படம் எடுக்கவும்'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {language === 'english' ? 'Image or PDF' : 'படம் அல்லது PDF'}
                        </p>
                      </div>
                    )}
                  </FarmerCard>
                </label>
              </div>
            )}

            {/* Manual Entry Section */}
            {formData.soilInputMethod === 'manual' && (
              <div className="space-y-6">
                {/* Soil Type */}
                <div className="space-y-2">
                  <label className="block text-base font-semibold text-gray-700">
                    {t.soilType} <span className="text-red-500">*</span>
                  </label>
                  <AutocompleteInput
                    value={formData.soilType}
                    onChange={(value) => setFormData(prev => ({ ...prev, soilType: value }))}
                    onSelect={(value) => setFormData(prev => ({ ...prev, soilType: value }))}
                    suggestions={soilSuggestions.map(s => language === 'english' ? s.name : s.localName)}
                    loading={false}
                    placeholder={language === 'english' ? 'e.g., Loamy, Clay' : 'உதாரணம்: களிமண்'}
                    showSuggestionsOnFocus={true}
                    minCharsForSuggestions={0}
                  />
                  {errors.soilType && (
                    <p className="text-sm text-red-600">{errors.soilType}</p>
                  )}
                </div>

                {/* pH Slider */}
                <FarmerSlider
                  label={t.phLevel}
                  value={formData.ph}
                  onChange={(value) => setFormData(prev => ({ ...prev, ph: value }))}
                  min={0}
                  max={14}
                  step={0.5}
                  helperText={
                    formData.ph < 6 
                      ? (language === 'english' ? 'Acidic soil' : 'அமில மண்')
                      : formData.ph > 8
                        ? (language === 'english' ? 'Alkaline soil' : 'காரமண்')
                        : (language === 'english' ? 'Neutral soil (ideal)' : 'நடுநிலை மண் (சிறந்தது)')
                  }
                />

                {/* Nutrient Levels */}
                <div className="space-y-4">
                  <label className="block text-base font-semibold text-gray-700">
                    {t.nutrients}
                  </label>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {(['nitrogen', 'phosphorus', 'potassium'] as const).map((nutrient) => {
                      const key = `${nutrient}Level` as keyof FormData;
                      return (
                        <div key={nutrient} className="text-center">
                          <p className="text-xs text-gray-500 mb-2 uppercase">
                            {nutrient.charAt(0).toUpperCase()}
                          </p>
                          <div className="flex flex-col gap-1">
                            {(['low', 'medium', 'high'] as const).map((level) => (
                              <button
                                key={level}
                                type="button"
                                onClick={() => setFormData(prev => ({ 
                                  ...prev, 
                                  [key]: level 
                                }))}
                                className={`
                                  py-2 px-3 rounded-lg text-xs font-medium
                                  transition-all duration-200
                                  ${formData[key] === level
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }
                                `}
                              >
                                {level === 'low' ? t.low : level === 'medium' ? t.medium : t.high}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Budget & Planning */}
        {currentStep === 4 && (
          <div className="py-6 space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {language === 'english' ? 'Budget & Planning' : 'பட்ஜெட் & திட்டமிடல்'}
              </h2>
              <p className="text-gray-500 mt-2">
                {language === 'english'
                  ? 'Set your budget and planning details'
                  : 'உங்கள் பட்ஜெட் மற்றும் திட்டமிடல் விவரங்களை அமைக்கவும்'
                }
              </p>
            </div>

            {/* Budget Input */}
            <FarmerInput
              label={t.budget}
              value={formData.budget}
              onChange={(value) => setFormData(prev => ({ ...prev, budget: value }))}
              type="number"
              placeholder="100000"
              icon={<span className="text-lg font-bold">₹</span>}
              required
              error={errors.budget}
              helperText={language === 'english' 
                ? 'Total budget for cultivation'
                : 'சாகுபடிக்கான மொத்த பட்ஜெட்'
              }
            />

            {/* Planning Duration */}
            <FarmerSelect
              label={t.planningDuration}
              value={formData.planningMonths}
              onChange={(value) => setFormData(prev => ({ ...prev, planningMonths: value }))}
              options={[
                { value: '3', label: `3 ${t.months}` },
                { value: '4', label: `4 ${t.months}` },
                { value: '5', label: `5 ${t.months}` },
                { value: '6', label: `6 ${t.months}` },
                { value: '8', label: `8 ${t.months}` },
                { value: '12', label: `12 ${t.months}` },
              ]}
            />

            {/* Season Selection */}
            <FarmerSegmentedControl
              label={t.preferredSeason}
              value={formData.preferredSeason}
              onChange={(value) => setFormData(prev => ({ 
                ...prev, 
                preferredSeason: value as 'kharif' | 'rabi' | 'zaid' | 'auto' 
              }))}
              options={[
                { value: 'auto', label: t.auto },
                { value: 'kharif', label: '🌧️ Kharif' },
                { value: 'rabi', label: '❄️ Rabi' },
              ]}
            />

            {/* Water Availability */}
            <div className="space-y-3">
              <label className="block text-base font-semibold text-gray-700">
                {t.waterAvailability}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, waterAvailability: level }))}
                    className={`
                      flex flex-col items-center gap-2 p-4 rounded-xl
                      transition-all duration-200
                      ${formData.waterAvailability === level
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <Droplets className={`w-6 h-6 ${
                      formData.waterAvailability === level ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <span className={`text-sm font-medium ${
                      formData.waterAvailability === level ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      {level === 'low' ? t.low : level === 'medium' ? t.medium : t.high}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Display */}
            {errors.submit && (
              <FarmerCard variant="warning" padding="md">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-700">{errors.submit}</p>
                </div>
              </FarmerCard>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-100 p-4">
        <div className="max-w-lg mx-auto flex gap-3">
          {currentStep > 1 && (
            <FarmerButton
              onClick={handleBack}
              variant="ghost"
              size="lg"
              leftIcon={<ChevronLeft className="w-5 h-5" />}
            >
              {t.back}
            </FarmerButton>
          )}
          
          <FarmerButton
            onClick={currentStep === 4 ? handleSubmit : handleNext}
            size="lg"
            fullWidth
            loading={submitting}
            rightIcon={currentStep < 4 ? <ChevronRight className="w-5 h-5" /> : undefined}
          >
            {currentStep === 4 ? t.getRecommendation : t.next}
          </FarmerButton>
        </div>
      </div>
    </div>
  );
}
