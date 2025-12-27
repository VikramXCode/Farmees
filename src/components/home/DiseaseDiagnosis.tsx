import React, { useState } from 'react';
import { Bug, Camera, Upload, FileText, X, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { aiService } from '../../services/aiService';
import { useFarm } from '../../contexts/FarmContext';

export default function DiseaseDiagnosis() {
  const [activeTab, setActiveTab] = useState('crop');
  const { t } = useLanguage();
  const { addReminder, selectedLandId } = useFarm();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [pestDescription, setPestDescription] = useState('');
  const [analysisText, setAnalysisText] = useState('');
  const [topResult, setTopResult] = useState<any | null>(null);
  const [addedReminder, setAddedReminder] = useState(false);

  const formatProbability = (p: any) => {
    if (p == null) return 'N/A';
    const num = Number(p);
    if (isNaN(num)) return 'N/A';
    const val = num > 0 && num <= 1 ? num * 100 : num;
    return `${Math.round(val * 10) / 10}%`;
  };

  

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setUploadedFile(file);
        setAnalysisComplete(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!uploadedFile) return;

    setIsAnalyzing(true);

    try {
      const form = new FormData();
      form.append('image', uploadedFile);

      const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || '/api';
      const res = await fetch(`${API_BASE_URL}/diseases/identify`, {
        method: 'POST',
        body: form
      });
      
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      
      {
          // Expecting { diseaseSuggestions: [...], plantSuggestions: [...], imagePath }
  // We compute topResult directly and don't keep full lists
          // Choose the highest probability disease if present, otherwise top plant suggestion
          const diseases = (data.diseaseSuggestions || []).slice();
          diseases.sort((a: any, b: any) => (b.probability || 0) - (a.probability || 0));
          if (diseases.length > 0) {
            setTopResult({ type: 'disease', item: diseases[0] });
            // Suppress the "Found X disease suggestion(s)." message
            setAnalysisText('');
          } else {
            const plants = (data.plantSuggestions || []).slice();
            plants.sort((a: any, b: any) => (b.probability || 0) - (a.probability || 0));
            if (plants.length > 0) setTopResult({ type: 'plant', item: plants[0] });
            else setTopResult(null);
          }
          // Only show guidance when no disease identified
          if (!(data.diseaseSuggestions && data.diseaseSuggestions.length > 0) && data.plantSuggestions && data.plantSuggestions.length > 0) {
            setAnalysisText(`No disease identified — showing plant/species suggestions (${data.plantSuggestions.length}).`);
          } else {
            // Suppress generic fallback message for disease predictions
            setAnalysisText('');
          }
          setAnalysisComplete(true);
      }
    } catch (err) {
      console.error(err);
      setAnalysisText('Unable to analyze image right now.');
      setAnalysisComplete(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzePestImage = async () => {
    if (!uploadedFile) return;

    setIsAnalyzing(true);

    try {
      const form = new FormData();
      form.append('image', uploadedFile);

      const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || '/api';
      const res = await fetch(`${API_BASE_URL}/pests/identify`, {
        method: 'POST',
        body: form
      });
      
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      
      {
        // Expecting { pestSuggestions: [...] , imagePath }
        const pests = (data.pestSuggestions || data.pestSuggestions || []).slice();
        pests.sort((a: any, b: any) => (b.probability || 0) - (a.probability || 0));
        if (pests.length > 0) {
          // attach the full raw response for richer display (model_version, input.images)
          setTopResult({ type: 'pest', item: pests[0], raw: data.raw || data });
          // Suppress count message for pests too
          setAnalysisText('');
        } else {
          setTopResult(null);
          setAnalysisText('No confident pest suggestions returned.');
        }
        setAnalysisComplete(true);
      }
    } catch (err) {
      console.error(err);
      setAnalysisText('Unable to analyze pest image right now.');
      setAnalysisComplete(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeDescription = async () => {
    if (!pestDescription.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const systemPrompt = 'You are an agriculture expert. Given a pest/disease description, infer likely pest/disease, confidence, and treatment in 3-4 sentences.';
      const output = await aiService.generate(pestDescription, { systemPrompt });
      setAnalysisText(output);
      setAnalysisComplete(true);
    } catch (e) {
      setAnalysisText('Unable to analyze right now. Please try again later.');
      setAnalysisComplete(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    setUploadedFile(null);
    setAnalysisComplete(false);
    setAnalysisText('');
    setAddedReminder(false);
  };

  const addTopResultToReminders = () => {
    if (!topResult) return;
    const now = new Date();
    const due = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +1 day
    const mkDate = due.toISOString();
    if (topResult.type === 'disease') {
      const prob = Number(topResult.item.probability || 0);
      const priority: 'high' | 'medium' | 'low' = prob >= 70 ? 'high' : prob >= 40 ? 'medium' : 'low';
      const title = `Check: ${topResult.item.diseaseName}`;
      const description = topResult.item.treatment
        ? (Array.isArray(topResult.item.treatment) ? topResult.item.treatment.join('\n') : String(topResult.item.treatment))
        : 'Review treatment and inspect crop area.';
      addReminder({
        title,
        description,
        date: mkDate,
        landId: selectedLandId || 'general',
        completed: false,
        priority,
      });
      setAddedReminder(true);
    } else if (topResult.type === 'pest') {
      const prob = Number(topResult.item.probability || 0);
      const priority: 'high' | 'medium' | 'low' = prob >= 70 ? 'high' : prob >= 40 ? 'medium' : 'low';
      const title = `Inspect for pest: ${topResult.item.name}`;
      const description = 'Inspect affected plants and consider preventive spray (e.g., neem oil).';
      addReminder({
        title,
        description,
        date: mkDate,
        landId: selectedLandId || 'general',
        completed: false,
        priority,
      });
      setAddedReminder(true);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Bug className="w-6 h-6 text-green-600 mr-2" />
        <h3 className="text-lg font-semibold text-green-800">{t('disease_diagnosis')}</h3>
      </div>

      {/* Tab Navigation */}
      <div className="flex mb-6">
        <button
          onClick={() => setActiveTab('crop')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-lg transition-colors ${
            activeTab === 'crop'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t('crop_disease')}
        </button>
        <button
          onClick={() => setActiveTab('pest')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-lg transition-colors ${
            activeTab === 'pest'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t('pest_bug')}
        </button>
      </div>

      {/* Upload Section */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-800">
            {activeTab === 'crop' ? t('upload_crop_image') : t('upload_pest_image')}
          </h4>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {/* Image Upload */}
          <div className="space-y-4">
            {!uploadedImage ? (
              <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors cursor-pointer block">
                <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">{t('take_photo')}</p>
                <p className="text-xs text-gray-500">or</p>
                <Upload className="w-6 h-6 text-gray-400 mx-auto mt-1" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative">
                <img
                  src={uploadedImage}
                  alt="Uploaded"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {uploadedImage && (
              <button
                onClick={activeTab === 'pest' ? handleAnalyzePestImage : handleAnalyzeImage}
                disabled={isAnalyzing}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('loading')}...
                  </>
                ) : (
                  t('analyze_image')
                )}
              </button>
            )}
          </div>

          {/* Text Description (for pests) */}
          {activeTab === 'pest' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <FileText className="w-4 h-4 inline mr-1" />
                {t('describe_pest')}
              </label>
              <textarea
                value={pestDescription}
                onChange={(e) => setPestDescription(e.target.value)}
                placeholder="Describe the pest you've observed, its size, color, behavior, and where you found it..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                rows={4}
              />
              <button
                onClick={handleAnalyzeDescription}
                disabled={isAnalyzing || !pestDescription.trim()}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('loading')}...
                  </>
                ) : (
                  t('analyze_description')
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      {analysisComplete && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-800">
              {activeTab === 'crop' ? t('disease_analysis_results') : t('pest_analysis_results')}
            </h4>
            <div className="flex items-center text-green-600 text-sm">
              <CheckCircle className="w-4 h-4 mr-1" />
              Analysis Complete
            </div>
          </div>

          {analysisText && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{analysisText}</p>
            </div>
          )}
          {topResult ? (
            topResult.type === 'disease' ? (
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="font-semibold text-gray-800">{topResult.item.diseaseName}</h5>
                    <p className="text-sm text-gray-600">{t('confidence')}: {topResult.item.probability}%</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor('high')}`}>
                    {t('high')} {t('priority')}
                  </div>
                </div>

                <div className="space-y-3">
                  {topResult.item.description && (
                    <div>
                      <h6 className="font-medium text-gray-700 text-sm mb-1">{t('description')}:</h6>
                      <p className="text-sm text-gray-600">{topResult.item.description}</p>
                    </div>
                  )}

                  {topResult.item.treatment && (
                    <div>
                      <h6 className="font-medium text-gray-700 text-sm mb-1">{t('treatment')}:</h6>
                      <p className="text-sm text-gray-600">{Array.isArray(topResult.item.treatment) ? topResult.item.treatment.join('\n') : topResult.item.treatment}</p>
                    </div>
                  )}

                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={addTopResultToReminders}
                      disabled={addedReminder}
                      className={`flex-1 ${addedReminder ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white py-2 px-3 rounded text-sm font-medium transition-colors`}
                    >
                      {addedReminder ? 'Added to Reminders' : t('add_to_reminders')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="font-semibold text-gray-800">{topResult.item.name}</h5>
                    <p className="text-sm text-gray-600">{t('confidence')}: {formatProbability(topResult.item.probability)}</p>
                    {topResult.raw && topResult.raw.model_version && (
                      <p className="text-xs text-gray-500">Model: {topResult.raw.model_version}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  {topResult.raw && topResult.raw.input && Array.isArray(topResult.raw.input.images) && topResult.raw.input.images[0] && (
                    <img src={topResult.raw.input.images[0]} alt="pest-sample" className="w-48 h-32 object-cover rounded" />
                  )}
                  <div>
                    <p className="text-sm text-gray-600">{t('no_disease_found_showing_plant')}</p>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">{t('no_suggestions_confident')}</p>
            </div>
          )}
        </div>
      )}

      {/* Analysis Status */}
      {isAnalyzing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-blue-800 font-medium">Analyzing {activeTab === 'crop' ? 'disease' : 'pest'}...</p>
          <p className="text-blue-600 text-sm">This may take a few moments</p>
        </div>
      )}
    </div>
  );
}