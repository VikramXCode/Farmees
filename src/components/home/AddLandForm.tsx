import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, MapPin, Upload, Droplets, Map, ChevronDown, ChevronUp } from 'lucide-react';
import { useFarm } from '../../contexts/FarmContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import AutocompleteInput from '../common/AutocompleteInput';
import ChipInput from '../common/ChipInput';
import Toast, { type ToastType } from '../common/Toast';
import { getCropSuggestions, filterCrops, COMMON_CROPS } from '../../data/cropSuggestions';
import { getSoilTypeSuggestions, filterSoilTypes } from '../../data/soilTypes';
import { getLocationSuggestions, geocodePincode, type LocationSuggestion } from '../../services/geocodingService';
import { debounce } from '../../utils/debounce';
import FarmBoundaryMapper from '../boundary/FarmBoundaryMapper';
import type { FarmBoundary } from '../../types/boundary';

interface AddLandFormProps {
  onClose: (landId?: string) => void;
  editLandId?: string;
}

export default function AddLandForm({ onClose, editLandId }: AddLandFormProps) {
  const { addLand } = useFarm();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [isEditMode, setIsEditMode] = useState(!!editLandId);
  const [loading, setLoading] = useState(!!editLandId);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    postalCode: '',
    district: '',
    country: '',
    currentCrop: '',
    waterAvailability: 'medium' as 'high' | 'medium' | 'low',
    soilType: '',
  });
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [soilReportFile, setSoilReportFile] = useState<File | null>(null);
  const [ocrExtractedText, setOcrExtractedText] = useState<string>('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Smart Farm Boundary Mapping state
  const [enableBoundaryMapping, setEnableBoundaryMapping] = useState(true);
  const [showBoundaryMapper, setShowBoundaryMapper] = useState(false);
  const [farmBoundary, setFarmBoundary] = useState<FarmBoundary | null>(null);
  const [pincodeCenter, setPincodeCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);

  // Smart input states
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [cropSuggestions, setCropSuggestions] = useState<Array<{ name: string; icon?: string }>>([]);
  const [cropSearchResults, setCropSearchResults] = useState<string[]>([]);
  const [soilSuggestions, setSoilSuggestions] = useState(getSoilTypeSuggestions(''));
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [existingSoilReport, setExistingSoilReport] = useState(false);

  // Load land data in edit mode
  useEffect(() => {
    if (editLandId && user) {
      const loadLandData = async () => {
        try {
          setLoading(true);
          const { landService } = await import('../../services/landService');
          const landData = await landService.getLandData(editLandId);
          
          console.log('🔍 Edit Mode - Loaded land data:', {
            name: landData?.name,
            postalCode: landData?.postalCode,
            location: landData?.location,
            district: landData?.district,
            country: landData?.country,
          });
          
          if (landData) {
            // Pre-fill form data
            setFormData({
              name: landData.name || '',
              location: landData.location || '',
              postalCode: landData.postalCode || '',
              district: landData.district || '',
              country: landData.country || '',
              currentCrop: '',
              waterAvailability: landData.waterAvailability || 'medium',
              soilType: landData.soilType || '',
            });
            
            console.log('✅ Edit Mode - Form data set to:', {
              postalCode: landData.postalCode || '',
              location: landData.location || '',
              district: landData.district || '',
              country: landData.country || '',
            });
            
            // Pre-fill crops if exists
            if (landData.currentCrop) {
              const crops = landData.currentCrop.split(',').map(c => c.trim()).filter(c => c);
              setSelectedCrops(crops);
            }
            
            // Pre-fill boundary if exists
            if (landData.boundary) {
              setFarmBoundary({
                coordinates: landData.boundary.coordinates,
                area: landData.boundary.area,
                perimeter: landData.boundary.perimeter,
                centroid: landData.boundary.centroid,
                mappingMode: landData.boundary.mappingMode || 'walk',
                isApproximate: landData.boundary.isApproximate || false,
              });
            }
            
            // Pre-fill coordinates/center if exists
            if (landData.coordinates) {
              setPincodeCenter({ lat: landData.coordinates.lat, lng: landData.coordinates.lng });
            } else if (landData.boundary?.centroid) {
              setPincodeCenter({ 
                lat: landData.boundary.centroid.lat, 
                lng: landData.boundary.centroid.lng 
              });
            }
            
            // Check if soil data exists
            if (landData.soilData || landData.soilReport) {
              setExistingSoilReport(true);
            }
            
            setIsEditMode(true);
          }
        } catch (error) {
          console.error('Error loading land data:', error);
          setToast({
            message: language === 'english'
              ? 'Failed to load land data'
              : 'நில தரவை ஏற்ற முடியவில்லை',
            type: 'error'
          });
        } finally {
          setLoading(false);
        }
      };
      
      loadLandData();
    }
  }, [editLandId, user, language]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    (async () => {
      try {
        // Prepare land data with selected crops joined as comma-separated string
        const landData: any = {
          ...formData,
          currentCrop: selectedCrops.length > 0 ? selectedCrops.join(', ') : formData.currentCrop
        };
        
        console.log('💾 Submitting land data:', {
          name: landData.name,
          postalCode: landData.postalCode,
          location: landData.location,
          district: landData.district,
          country: landData.country,
          isEditMode,
        });
        
        // Include coordinates if we have pincode center
        if (pincodeCenter) {
          landData.coordinates = pincodeCenter;
        }
        
        // Include boundary data if mapped
        if (farmBoundary) {
          landData.boundary = {
            coordinates: farmBoundary.coordinates,
            area: farmBoundary.area,
            perimeter: farmBoundary.perimeter,
            centroid: farmBoundary.centroid,
            mappingMode: farmBoundary.mappingMode,
            isApproximate: farmBoundary.isApproximate,
          };
          // Auto-fill land size from boundary
          landData.landSize = {
            value: farmBoundary.area.acres,
            unit: 'acres',
            source: 'boundary_mapping',
          };
        }
        
        let createdLandId: string;
        
        if (isEditMode && editLandId) {
          // Update existing land
          const { landService } = await import('../../services/landService');
          await landService.updateLandData(editLandId, landData);
          createdLandId = editLandId;
        } else {
          // Create new land
          createdLandId = await addLand(landData);
        }
        
        // Upload soil report if file selected, using the returned landId
        if (soilReportFile) {
          try {
            setOcrLoading(true);
            const { uploadSoilReport } = await import('../../services/soilService');
            const result = await uploadSoilReport(createdLandId, soilReportFile);
            setOcrLoading(false);
            
            console.log('✅ Soil report uploaded successfully:', result);
            setToast({ 
              message: language === 'english' 
                ? (isEditMode ? 'Land updated and soil data extracted successfully!' : 'Land created and soil data extracted successfully!')
                : (isEditMode ? 'நிலம் புதுப்பிக்கப்பட்டு மண் தரவு வெற்றிகரமாக பிரித்தெடுக்கப்பட்டது!' : 'நிலம் உருவாக்கப்பட்டு மண் தரவு வெற்றிகரமாக பிரித்தெடுக்கப்பட்டது!'),
              type: 'success' 
            });
          } catch (err) {
            setOcrLoading(false);
            console.error('Soil report upload error:', err);
            setToast({ 
              message: language === 'english'
                ? (isEditMode ? 'Land updated but soil report upload failed' : 'Land created but soil report upload failed')
                : (isEditMode ? 'நிலம் புதுப்பிக்கப்பட்டது ஆனால் மண் அறிக்கை பதிவேற்றம் தோல்வியடைந்தது' : 'நிலம் உருவாக்கப்பட்டது ஆனால் மண் அறிக்கை பதிவேற்றம் தோல்வியடைந்தது'),
              type: 'warning'
            });
          }
        } else {
          setToast({ 
            message: language === 'english' 
              ? (isEditMode ? 'Land updated successfully!' : 'Land created successfully!')
              : (isEditMode ? 'நிலம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!' : 'நிலம் வெற்றிகரமாக உருவாக்கப்பட்டது!'),
            type: 'success'
          });
        }
        
        onClose(createdLandId);
      } catch (error) {
        console.error('Error saving land:', error);
        setToast({ 
          message: language === 'english'
            ? (isEditMode ? 'Failed to update land. Please try again.' : 'Failed to add land. Please try again.')
            : (isEditMode ? 'நிலத்தை புதுப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.' : 'நிலத்தைச் சேர்க்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'),
          type: 'error'
        });
      }
    })();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Location autocomplete handler (debounced)
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
    }, 500),
    []
  );
  
  // Update crop suggestions when location changes
  useEffect(() => {
    if (formData.location) {
      const newCropSuggestions = getCropSuggestions(formData.location);
      setCropSuggestions(newCropSuggestions);
      
      const newSoilSuggestions = getSoilTypeSuggestions(formData.location);
      setSoilSuggestions(newSoilSuggestions);
    } else {
      // Show major Indian crops when no location selected
      const majorCrops = getCropSuggestions('');
      setCropSuggestions(majorCrops);
    }
  }, [formData.location]);
  
  // Handle crop input change (autocomplete)
  const handleCropInputChange = (query: string) => {
    setFormData(prev => ({ ...prev, currentCrop: query }));
    
    if (query.length >= 2) {
      const results = filterCrops(query, COMMON_CROPS);
      // Convert CropSuggestion objects to strings
      setCropSearchResults(results.map(c => c.name));
    } else {
      setCropSearchResults([]);
    }
  };

  // Add selected crop to the list
  const handleAddCrop = (cropName: string) => {
    if (cropName && !selectedCrops.includes(cropName)) {
      setSelectedCrops(prev => [...prev, cropName]);
      setFormData(prev => ({ ...prev, currentCrop: '' }));
      setCropSearchResults([]);
    }
  };

  // Remove crop from selected list
  const handleRemoveCrop = (cropName: string) => {
    setSelectedCrops(prev => prev.filter(c => c !== cropName));
  };

  // Handle location input change
  const handleLocationChange = (value: string) => {
    setFormData(prev => ({ ...prev, location: value }));
    fetchLocations(value);
  };

  // Handle soil type input change
  const handleSoilTypeChange = (query: string) => {
    setFormData(prev => ({ ...prev, soilType: query }));
  };

  // Geocode pincode when it changes (6 digits) and auto-populate location, district, and country
  useEffect(() => {
    const pincode = formData.postalCode;
    
    console.log('🔄 Geocoding useEffect triggered', {
      isEditMode,
      loading,
      postalCode: pincode,
      pincodeLength: pincode?.length,
      isValid: pincode && pincode.length === 6 && /^\d{6}$/.test(pincode),
      location: formData.location,
      district: formData.district,
    });
    
    // Don't run if in edit mode and still loading initial data
    if (isEditMode && loading) {
      console.log('⏭️ Skipping - edit mode still loading');
      return;
    }
    
    // Check if we have a valid 6-digit pincode
    if (!pincode || pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      console.log('⏭️ Skipping - invalid pincode format');
      // Clear location data if pincode is completely empty
      if (!pincode || pincode.length === 0) {
        setPincodeCenter(undefined);
        setFormData(prev => ({ 
          ...prev, 
          location: '',
          district: '',
          country: ''
        }));
      }
      return;
    }
    
    // In edit mode, skip if we already have location data (don't overwrite existing data)
    if (isEditMode) {
      const hasLocationData = formData.location && formData.location.trim() !== '' && 
                             formData.district && formData.district.trim() !== '';
      if (hasLocationData) {
        console.log('⏭️ Skipping - edit mode with existing location data');
        return;
      }
    }
    
    // Start geocoding
    console.log('🌍 Starting geocoding for pincode:', pincode);
    setPincodeLoading(true);
    
    geocodePincode(pincode)
      .then(result => {
        console.log('✅ Geocoding result:', result);
        if (result) {
          setPincodeCenter({ lat: result.lat, lng: result.lng });
          setFormData(prev => ({ 
            ...prev, 
            location: result.displayName,
            district: result.state || '',
            country: 'India'
          }));
          console.log('✅ Location data updated:', {
            location: result.displayName,
            district: result.state,
            country: 'India'
          });
        } else {
          console.log('❌ No result from geocoding');
        }
        setPincodeLoading(false);
      })
      .catch((error) => {
        console.error('❌ Geocoding error:', error);
        setPincodeLoading(false);
      });
  }, [formData.postalCode, isEditMode, loading]);

  return (
    <div className="p-6 border-b">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-green-800">
          {isEditMode 
            ? (language === 'english' ? 'Edit Land' : 'நிலத்தை திருத்து')
            : t('add_land')}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-3" />
          <span className="text-gray-600">
            {language === 'english' ? 'Loading land data...' : 'நில தரவை ஏற்றுகிறது...'}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" style={{ display: loading ? 'none' : 'block' }}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('land_name')}
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder={language === 'english' ? 'e.g., North Field' : 'உதாரணம்: வடக்கு வயல்'}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin className="w-4 h-4 inline mr-1" />
            {language === 'english' ? 'Postal/PIN Code' : 'அஞ்சல் குறியீடு'}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleInputChange}
              placeholder={language === 'english' ? 'e.g., 642001' : 'உதாரணம்: 642001'}
              maxLength={6}
              pattern="[0-9]{6}"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
            {pincodeLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          {isEditMode && !formData.postalCode && (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <span className="font-medium">⚠️</span>
              {language === 'english' 
                ? 'Please enter PIN code to update location details' 
                : 'இருப்பிட விவரங்களைப் புதுப்பிக்க PIN குறியீட்டை உள்ளிடவும்'}
            </p>
          )}
          {!isEditMode && (
            <p className="text-xs text-gray-500 mt-1">
              {language === 'english' 
                ? 'Location will be auto-filled from PIN code' 
                : 'PIN குறியீட்டிலிருந்து இருப்பிடம் தானாக நிரப்பப்படும்'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin className="w-4 h-4 inline mr-1" />
            {t('location')}
          </label>
          <AutocompleteInput
            value={formData.location}
            onChange={handleLocationChange}
            onSelect={(selectedLocation) => {
              // Find the full location object to extract lat/lng
              const fullLocation = locationSuggestions.find(
                loc => loc.displayName === selectedLocation
              );
              if (fullLocation) {
                console.log('Location selected:', {
                  name: fullLocation.displayName,
                  city: fullLocation.city,
                  state: fullLocation.state,
                  latitude: fullLocation.latitude,
                  longitude: fullLocation.longitude
                });
              }
            }}
            suggestions={locationSuggestions.map(loc => loc.displayName)}
            loading={locationLoading}
            placeholder={language === 'english' ? 'Auto-filled from PIN code' : 'PIN குறியீட்டிலிருந்து நிரப்பப்பட்டது'}
            showSuggestionsOnFocus={false}
            minCharsForSuggestions={2}
          />
          <p className="text-xs text-gray-500 mt-1">
            {language === 'english' 
              ? 'Auto-populated from PIN code. You can edit if needed.'
              : 'PIN குறியீட்டிலிருந்து தானாக நிரப்பப்பட்டது. தேவைப்பட்டால் திருத்தலாம்.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'english' ? 'State' : 'மாநிலம்'}
            </label>
            <input
              type="text"
              name="district"
              value={formData.district}
              placeholder={language === 'english' ? 'Auto-filled from PIN' : 'PIN இலிருந்து நிரப்பப்பட்டது'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-gray-100 text-gray-700 cursor-not-allowed"
              disabled
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'english' ? 'Country' : 'நாடு'}
            </label>
            <input
              type="text"
              name="country"
              value={formData.country}
              placeholder={language === 'english' ? 'Auto-filled from PIN' : 'PIN இலிருந்து நிரப்பப்பட்டது'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-gray-100 text-gray-700 cursor-not-allowed"
              disabled
              readOnly
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('current_crop')}
          </label>
          <ChipInput
            value={formData.currentCrop}
            onChange={handleCropInputChange}
            onSelect={handleAddCrop}
            suggestions={cropSuggestions}
            placeholder={language === 'english' ? 'e.g., Rice, Wheat, Coconut' : 'உதாரணம்: நெல், கோதுமை, தேங்காய்'}
            language={language}
          />
          {cropSearchResults.length > 0 && formData.currentCrop.length >= 2 && (
            <div className="mt-1 relative">
              <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {cropSearchResults.map((crop, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      handleAddCrop(crop);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-green-50 transition-colors"
                  >
                    {crop}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Selected Crops Display */}
          {selectedCrops.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">
                {language === 'english' ? 'Selected crops:' : 'தேர்ந்தெடுக்கப்பட்ட பயிர்கள்:'}
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedCrops.map((crop, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium border border-green-300"
                  >
                    <span>{crop}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCrop(crop)}
                      className="hover:bg-green-200 rounded-full p-0.5 transition-colors"
                      title={language === 'english' ? 'Remove' : 'நீக்கு'}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('soil_type')}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <AutocompleteInput
            value={formData.soilType}
            onChange={handleSoilTypeChange}
            suggestions={soilSuggestions.map(soil => 
              language === 'english' ? soil.name : soil.localName
            )}
            loading={false}
            placeholder={language === 'english' ? 'e.g., Red Soil, Black Soil' : 'உதாரணம்: சிவப்பு மண், கருப்பு மண்'}
            showSuggestionsOnFocus={true}
            minCharsForSuggestions={0}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Droplets className="w-4 h-4 inline mr-1" />
            {t('water_availability')}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            name="waterAvailability"
            value={formData.waterAvailability}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          >
            <option value="high">{t('high')}</option>
            <option value="medium">{t('medium')}</option>
            <option value="low">{t('low')}</option>
          </select>
        </div>

        {/* Smart Farm Boundary Mapping - Optional Feature */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Map className="w-5 h-5 text-green-600" />
              <div>
                <label className="font-medium text-gray-800">
                  {language === 'english' 
                    ? 'Smart Farm Boundary Mapping' 
                    : 'ஸ்மார்ட் பண்ணை எல்லை வரைபடம்'}
                </label>
                <p className="text-xs text-gray-500">
                  {language === 'english'
                    ? 'Optional: Map your farm for accurate area calculation'
                    : 'விருப்பம்: துல்லியமான பரப்பளவு கணக்கிற்கு உங்கள் பண்ணையை வரையுங்கள்'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableBoundaryMapping}
                onChange={(e) => {
                  setEnableBoundaryMapping(e.target.checked);
                  if (!e.target.checked) {
                    setShowBoundaryMapper(false);
                    setFarmBoundary(null);
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          {enableBoundaryMapping && (
            <>
              {!showBoundaryMapper && !farmBoundary && (
                <button
                  type="button"
                  onClick={() => setShowBoundaryMapper(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-green-400 rounded-lg text-green-700 hover:bg-green-50 transition-colors"
                >
                  <Map className="w-5 h-5" />
                  {language === 'english' 
                    ? 'Start Mapping Farm Boundary' 
                    : 'பண்ணை எல்லை வரைபடத்தைத் தொடங்கு'}
                </button>
              )}

              {showBoundaryMapper && (
                <FarmBoundaryMapper
                  onBoundaryComplete={(boundary) => {
                    setFarmBoundary(boundary);
                    setShowBoundaryMapper(false);
                  }}
                  onCancel={() => setShowBoundaryMapper(false)}
                  language={language}
                  initialCenter={pincodeCenter}
                  defaultMode="draw"
                />
              )}

              {farmBoundary && !showBoundaryMapper && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-green-700">
                      <Map className="w-5 h-5" />
                      <span className="font-medium">
                        {language === 'english' ? 'Boundary Mapped' : 'எல்லை வரையப்பட்டது'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowBoundaryMapper(true);
                      }}
                      className="text-xs text-green-600 hover:text-green-800 underline"
                    >
                      {language === 'english' ? 'Edit' : 'திருத்து'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">
                        {language === 'english' ? 'Area:' : 'பரப்பளவு:'}
                      </span>
                      <span className="ml-1 font-semibold text-gray-800">
                        {farmBoundary.area.acres.toFixed(2)} acres
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">
                        {language === 'english' ? 'Perimeter:' : 'சுற்றளவு:'}
                      </span>
                      <span className="ml-1 font-semibold text-gray-800">
                        {(farmBoundary.perimeter / 1000).toFixed(2)} km
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">
                        {language === 'english' ? 'Points:' : 'புள்ளிகள்:'}
                      </span>
                      <span className="ml-1 font-semibold text-gray-800">
                        {farmBoundary.coordinates.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">
                        {language === 'english' ? 'Mode:' : 'முறை:'}
                      </span>
                      <span className="ml-1 font-semibold text-gray-800">
                        {farmBoundary.mappingMode === 'walk' 
                          ? (language === 'english' ? 'GPS Walk' : 'GPS நடை')
                          : (language === 'english' ? 'Manual Draw' : 'கைமுறை வரைதல்')}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {language === 'english' 
                      ? '* Approximate values for advisory purposes' 
                      : '* ஆலோசனை நோக்கங்களுக்கான தோராயமான மதிப்புகள்'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Crop recommendation functionality has been moved to its own dedicated flow. */}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Upload className="w-4 h-4 inline mr-1" />
            {t('soil_report')} (Optional)
          </label>
          
          {/* Show existing soil report indicator in edit mode */}
          {isEditMode && existingSoilReport && !soilReportFile && (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-700 font-medium">
                  {language === 'english' 
                    ? 'Soil report already exists for this land' 
                    : 'இந்த நிலத்திற்கு மண் அறிக்கை ஏற்கனவே உள்ளது'}
                </span>
              </div>
              <p className="text-xs text-green-600 mt-1 ml-4">
                {language === 'english'
                  ? 'Upload a new file to replace it'
                  : 'மாற்ற புதிய கோப்பைப் பதிவேற்றவும்'}
              </p>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setSoilReportFile(file);
              setOcrExtractedText(''); // Clear previous extraction
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-400 transition-colors"
          >
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              {soilReportFile ? soilReportFile.name : t('upload_pdf')}
            </p>
            <p className="text-xs text-gray-500">
              {language === 'english' ? 'PDF or Image (JPG, PNG)' : 'PDF அல்லது படம் (JPG, PNG)'}
            </p>
          </button>
          
          {/* Show file selected indicator */}
          {soilReportFile && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-700 font-medium">
                  {language === 'english' 
                    ? '✓ Soil report ready to upload' 
                    : '✓ மண் அறிக்கை பதிவேற்ற தயாராக உள்ளது'}
                </span>
              </div>
              <p className="text-xs text-green-600 mt-1 ml-4">
                {language === 'english'
                  ? `File: ${soilReportFile.name} (${(soilReportFile.size / 1024).toFixed(1)} KB)`
                  : `கோப்பு: ${soilReportFile.name} (${(soilReportFile.size / 1024).toFixed(1)} KB)`}
              </p>
            </div>
          )}
          
          {/* Show processing state during upload */}
          {ocrLoading && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-blue-700">
                  {language === 'english' ? 'Processing soil report...' : 'மண் அறிக்கை செயலாக்கப்படுகிறது...'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            {isEditMode
              ? (language === 'english' ? 'Update Land' : 'நிலத்தை புதுப்பி')
              : t('add_land')}
          </button>
        </div>
      </form>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}