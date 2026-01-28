import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, MapPin, Upload, Droplets, Map, ChevronDown, ChevronUp } from 'lucide-react';
import { useFarm } from '../../contexts/FarmContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import AutocompleteInput from '../common/AutocompleteInput';
import ChipInput from '../common/ChipInput';
import { getCropSuggestions, filterCrops, COMMON_CROPS } from '../../data/cropSuggestions';
import { getSoilTypeSuggestions, filterSoilTypes } from '../../data/soilTypes';
import { getLocationSuggestions, type LocationSuggestion } from '../../services/geocodingService';
import { debounce } from '../../utils/debounce';
import FarmBoundaryMapper from '../boundary/FarmBoundaryMapper';
import type { FarmBoundary } from '../../types/boundary';

interface AddLandFormProps {
  onClose: () => void;
}

export default function AddLandForm({ onClose }: AddLandFormProps) {
  const { addLand } = useFarm();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    postalCode: '',
    currentCrop: '',
    waterAvailability: 'medium' as 'high' | 'medium' | 'low',
    soilType: '',
  });
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [soilReportFile, setSoilReportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Smart Farm Boundary Mapping state
  const [enableBoundaryMapping, setEnableBoundaryMapping] = useState(false);
  const [showBoundaryMapper, setShowBoundaryMapper] = useState(false);
  const [farmBoundary, setFarmBoundary] = useState<FarmBoundary | null>(null);

  // Smart input states
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [cropSuggestions, setCropSuggestions] = useState<Array<{ name: string; icon?: string }>>([]);
  const [cropSearchResults, setCropSearchResults] = useState<string[]>([]);
  const [soilSuggestions, setSoilSuggestions] = useState(getSoilTypeSuggestions(''));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    (async () => {
      try {
        // Add land with selected crops joined as comma-separated string
        const landData: any = {
          ...formData,
          currentCrop: selectedCrops.length > 0 ? selectedCrops.join(', ') : formData.currentCrop
        };
        
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
        
        const createdLandId = await addLand(landData);
        
        // Upload soil report if file selected, using the returned landId
        if (soilReportFile) {
          try {
            const { uploadSoilReport } = await import('../../services/soilService');
            const result = await uploadSoilReport(createdLandId, soilReportFile);
            alert('Land created and soil data extracted: ' + JSON.stringify(result.soilData));
          } catch (err) {
            console.error('Soil report upload error:', err);
            alert('Land created but soil report upload failed: ' + err);
          }
        } else {
          alert('Land created successfully!');
        }
        
        onClose();
      } catch (error) {
        console.error('Error adding land:', error);
        alert('Failed to add land. Please try again.');
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

  return (
    <div className="p-6 border-b">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-green-800">{t('add_land')}</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
                // Store lat/lng for future use (can be saved to backend)
              }
            }}
            suggestions={locationSuggestions.map(loc => loc.displayName)}
            loading={locationLoading}
            placeholder={language === 'english' ? 'e.g., Kochi, Kerala' : 'உதாரணம்: கோச்சி, கேரளா'}
            showSuggestionsOnFocus={false}
            minCharsForSuggestions={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin className="w-4 h-4 inline mr-1" />
            {language === 'english' ? 'Postal/PIN Code (for map)' : 'அஞ்சல் குறியீடு (வரைபடத்திற்கு)'}
          </label>
          <input
            type="text"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleInputChange}
            placeholder={language === 'english' ? 'e.g., 642001' : 'உதாரணம்: 642001'}
            maxLength={6}
            pattern="[0-9]{6}"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            {language === 'english' 
              ? '6-digit PIN code helps show your land on the map' 
              : '6 இலக்க PIN குறியீடு வரைபடத்தில் உங்கள் நிலத்தைக் காட்ட உதவுகிறது'}
          </p>
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
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Droplets className="w-4 h-4 inline mr-1" />
            {t('water_availability')}
          </label>
          <select
            name="waterAvailability"
            value={formData.waterAvailability}
            onChange={handleInputChange}
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Upload className="w-4 h-4 inline mr-1" />
            {t('soil_report')} (Optional)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setSoilReportFile(file);
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
            <p className="text-xs text-gray-500">PDF</p>
          </button>
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
            {t('add_land')}
          </button>
        </div>
      </form>
    </div>
  );
}