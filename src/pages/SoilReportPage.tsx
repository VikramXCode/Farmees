import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Upload, Camera, FileText, Plus, ChevronDown, Loader2, CheckCircle2, AlertCircle, X, Sprout } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useFarm } from '../contexts/FarmContext';
import { uploadSoilReport } from '../services/soilService';

export default function SoilReportPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { lands, addLand } = useFarm();
  
  const [selectedLandId, setSelectedLandId] = useState<string>('');
  const [soilReportFile, setSoilReportFile] = useState<File | null>(null);
  const [ocrExtractedText, setOcrExtractedText] = useState<string>('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Handle return from Add Land page or landId from query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const returnedLandId = params.get('landId');
    if (returnedLandId) {
      // Check if this landId exists in our lands
      const land = lands.find((land: any) => land.landId === returnedLandId || land.id === returnedLandId);
      if (land) {
        setSelectedLandId(land.landId || land.id);
      }
      // Clean up URL
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, lands, navigate, location.pathname]);

  const t = {
    title: language === 'english' ? 'Soil Report Upload' : 'மண் அறிக்கை பதிவேற்றம்',
    selectLand: language === 'english' ? 'Select Land' : 'நிலத்தைத் தேர்ந்தெடு',
    addNewLand: language === 'english' ? '+ Add New Land' : '+ புதிய நிலம் சேர்',
    uploadFile: language === 'english' ? 'Upload from File' : 'கோப்பிலிருந்து பதிவேற்று',
    captureCamera: language === 'english' ? 'Capture from Camera' : 'கேமராவில் இருந்து எடு',
    processing: language === 'english' ? 'Processing soil report...' : 'மண் அறிக்கையை செயலாக்குகிறது...',
    extractedData: language === 'english' ? 'Extracted Soil Data' : 'பிரித்தெடுக்கப்பட்ட மண் தரவு',
    noFile: language === 'english' ? 'No file selected' : 'கோப்பு தேர்ந்தெடுக்கப்படவில்லை',
    selectLandFirst: language === 'english' ? 'Please select or add a land first' : 'முதலில் நிலத்தைத் தேர்ந்தெடுக்கவும் அல்லது சேர்க்கவும்',
    uploadAnother: language === 'english' ? 'Upload Another Report' : 'மற்றொரு அறிக்கையை பதிவேற்று',
    success: language === 'english' ? 'Soil report uploaded successfully!' : 'மண் அறிக்கை வெற்றிகரமாக பதிவேற்றப்பட்டது!',
    supportedFormats: language === 'english' ? 'Supported: PDF, JPG, PNG' : 'ஆதரிக்கப்படுபவை: PDF, JPG, PNG',
  };

  const handleFileSelect = (file: File) => {
    setSoilReportFile(file);
    setOcrExtractedText('');
    setUploadSuccess(false);
    setError('');
  };

  const handleUpload = async () => {
    if (!selectedLandId) {
      setError(t.selectLandFirst);
      return;
    }

    if (!soilReportFile) {
      setError(t.noFile);
      return;
    }

    try {
      setOcrLoading(true);
      setError('');
      
      const result = await uploadSoilReport(selectedLandId, soilReportFile);
      
      console.log('Soil report result:', result);
      
      // Display the soil data that was attached to land
      const soilData = result.soilData || {};
      
      // Format soil data for display
      let displayText = '=== SOIL DATA ATTACHED TO LAND ===\n\n';
      
      if (soilData.soilType) displayText += `Soil Type: ${soilData.soilType}\n`;
      if (soilData.pH) displayText += `pH Level: ${soilData.pH}\n`;
      if (soilData.ec) displayText += `EC (dS/m): ${soilData.ec}\n`;
      if (soilData.healthStatus) displayText += `Health Status: ${soilData.healthStatus}\n`;
      
      if (soilData.state || soilData.district || soilData.village) {
        displayText += '\n--- Location ---\n';
        if (soilData.state) displayText += `State: ${soilData.state}\n`;
        if (soilData.district) displayText += `District: ${soilData.district}\n`;
        if (soilData.village) displayText += `Village: ${soilData.village}\n`;
      }
      
      const nutrients = soilData.nutrients || {};
      if (Object.keys(nutrients).length > 0) {
        displayText += '\n--- Nutrients ---\n';
        if (nutrients.nitrogen) displayText += `Nitrogen (N): ${nutrients.nitrogen} kg/ha\n`;
        if (nutrients.phosphorus) displayText += `Phosphorus (P): ${nutrients.phosphorus} kg/ha\n`;
        if (nutrients.potassium) displayText += `Potassium (K): ${nutrients.potassium} kg/ha\n`;
        if (nutrients.zinc) displayText += `Zinc (Zn): ${nutrients.zinc} ppm\n`;
        if (nutrients.iron) displayText += `Iron (Fe): ${nutrients.iron} ppm\n`;
        if (nutrients.boron) displayText += `Boron (B): ${nutrients.boron} ppm\n`;
      }
      
      if (soilData.recommendations && soilData.recommendations.length > 0) {
        displayText += '\n--- Recommendations ---\n';
        soilData.recommendations.forEach((rec: string, idx: number) => {
          displayText += `${idx + 1}. ${rec}\n`;
        });
      }
      
      setOcrExtractedText(displayText || 'No data extracted');
      setUploadSuccess(true);
      setOcrLoading(false);
    } catch (err: any) {
      console.error('Soil report upload error:', err);
      setError(err.message || (language === 'english' ? 'Failed to process soil report' : 'மண் அறிக்கையை செயலாக்க முடியவில்லை'));
      setOcrLoading(false);
    }
  };

  const resetForm = () => {
    setSoilReportFile(null);
    setOcrExtractedText('');
    setUploadSuccess(false);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-7 h-7" />
              {t.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Land Selection */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.selectLand} <span className="text-red-500">*</span>
          </label>
          
          <div className="relative">
            <select
              value={selectedLandId}
              onChange={(e) => {
                if (e.target.value === '__add_new__') {
                  // Redirect to Add Land page with return URL
                  navigate('/add-land?returnTo=soil-report');
                } else {
                  setSelectedLandId(e.target.value);
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none appearance-none bg-white"
            >
              <option value="">{t.selectLand}</option>
              <option value="__add_new__" className="font-semibold text-green-600">
                {t.addNewLand}
              </option>
              {lands.map((land: any) => (
                <option key={land.id} value={land.id}>
                  {land.name} {land.location ? `- ${land.location}` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Upload Section */}
        {selectedLandId && !uploadSuccess && (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {language === 'english' ? 'Upload Soil Report' : 'மண் அறிக்கையை பதிவேற்றவும்'}
            </h2>

            {/* File Input (Hidden) */}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />

            {/* Camera Input (Hidden) */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />

            {/* Upload Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
              >
                <Upload className="w-10 h-10 text-green-600" />
                <span className="text-sm font-medium text-gray-700">{t.uploadFile}</span>
              </button>

              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
              >
                <Camera className="w-10 h-10 text-green-600" />
                <span className="text-sm font-medium text-gray-700">{t.captureCamera}</span>
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">{t.supportedFormats}</p>

            {/* Selected File Display */}
            {soilReportFile && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">{soilReportFile.name}</span>
                  </div>
                  <button
                    onClick={resetForm}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={handleUpload}
                  disabled={ocrLoading}
                  className="w-full mt-4 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {ocrLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t.processing}
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      {language === 'english' ? 'Process Report' : 'அறிக்கையை செயலாக்கு'}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}
          </div>
        )}

        {/* Success and Extracted Data Display */}
        {uploadSuccess && ocrExtractedText && (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-6 h-6" />
              <h2 className="text-lg font-semibold">{t.success}</h2>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800 mb-3">{t.extractedData}</p>
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-white p-4 rounded border border-green-200 max-h-96 overflow-y-auto">
                {ocrExtractedText}
              </pre>
            </div>

            <button
              onClick={resetForm}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              {t.uploadAnother}
            </button>
            
            {/* Navigate back to crop recommendation if came from there */}
            <button
              onClick={() => navigate('/crop-recommendation')}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Sprout className="w-5 h-5" />
              {language === 'english' ? 'Get Crop Recommendation' : 'பயிர் பரிந்துரையைப் பெறுங்கள்'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
