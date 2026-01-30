import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Camera,
  Upload,
  Image,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Bug,
  Leaf,
  Shield,
  Phone,
  X,
  Loader2,
  Info,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { PageContainer } from '../components/layout/AppShell';
import Button from '../components/common/Button';

interface DiagnosisResult {
  name: string;
  tamilName: string;
  confidence: number;
  type: 'disease' | 'pest';
  severity: 'low' | 'medium' | 'high';
  description: string;
  treatments: string[];
  preventiveMeasures: string[];
}

export default function DiagnosePage() {
  const { language } = useLanguage();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [, setShowEscalationForm] = useState(false);
  const [selectedLandId] = useState<string | null>(location.state?.landId || null);

  // Clear location state after reading
  useEffect(() => {
    if (location.state?.landId) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const t = {
    title: language === 'english' ? 'Disease & Pest Detection' : 'நோய் & பூச்சி கண்டறிதல்',
    uploadTitle: language === 'english' ? 'Upload or capture image' : 'படத்தை பதிவேற்றவும் அல்லது எடுக்கவும்',
    uploadDesc: language === 'english' ? 'Take a clear photo of the affected plant part' : 'பாதிக்கப்பட்ட தாவர பகுதியின் தெளிவான புகைப்படத்தை எடுக்கவும்',
    camera: language === 'english' ? 'Camera' : 'கேமரா',
    gallery: language === 'english' ? 'Gallery' : 'கேலரி',
    demoImage: language === 'english' ? 'Use Demo Image' : 'டெமோ படத்தைப் பயன்படுத்து',
    analyzing: language === 'english' ? 'Analyzing image...' : 'படத்தை பகுப்பாய்வு செய்கிறது...',
    result: language === 'english' ? 'Analysis Result' : 'பகுப்பாய்வு முடிவு',
    confidence: language === 'english' ? 'Confidence' : 'நம்பிக்கை',
    severity: language === 'english' ? 'Severity' : 'தீவிரம்',
    treatment: language === 'english' ? 'Treatment' : 'சிகிச்சை',
    prevention: language === 'english' ? 'Prevention' : 'தடுப்பு',
    escalate: language === 'english' ? 'Escalate to Officer' : 'அதிகாரிக்கு அனுப்புங்கள்',
    tryAgain: language === 'english' ? 'Try Another Image' : 'மற்றொரு படத்தை முயற்சிக்கவும்',
    highSeverity: language === 'english' ? 'High' : 'அதிகம்',
    mediumSeverity: language === 'english' ? 'Medium' : 'நடுத்தரம்',
    lowSeverity: language === 'english' ? 'Low' : 'குறைவு',
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        analyzeImage();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDemoImage = () => {
    // Use a placeholder demo image
    setSelectedImage('/demo-leaf.jpg');
    analyzeImage();
  };

  const analyzeImage = () => {
    setIsAnalyzing(true);
    setResult(null);

    // Simulate AI analysis
    setTimeout(() => {
      setResult({
        name: 'Bacterial Leaf Blight',
        tamilName: 'பாக்டீரியா இலை கருகல்',
        confidence: 87,
        type: 'disease',
        severity: 'medium',
        description: language === 'english'
          ? 'Bacterial leaf blight is a common rice disease caused by Xanthomonas oryzae. It appears as water-soaked lesions on leaf margins that turn yellow and then grayish white.'
          : 'பாக்டீரியா இலை கருகல் என்பது Xanthomonas oryzae ஆல் ஏற்படும் பொதுவான நெல் நோயாகும். இது இலை விளிம்புகளில் தண்ணீரில் ஊறிய புண்களாக தோன்றி மஞ்சள் நிறமாகவும் பின்னர் சாம்பல் வெள்ளையாகவும் மாறும்.',
        treatments: language === 'english'
          ? [
              'Drain the field and allow it to dry for 2-3 days',
              'Apply copper-based fungicide (2g/L water)',
              'Remove and destroy severely infected plants',
              'Spray streptomycin sulfate (0.5g/L) if severe',
            ]
          : [
              'வயலை வடிகட்டி 2-3 நாட்கள் உலர விடவும்',
              'தாமிர அடிப்படையிலான பூஞ்சைக்கொல்லியைப் பயன்படுத்துங்கள் (2g/L தண்ணீர்)',
              'கடுமையாக பாதிக்கப்பட்ட தாவரங்களை அகற்றி அழிக்கவும்',
              'கடுமையாக இருந்தால் ஸ்ட்ரெப்டோமைசின் சல்பேட் (0.5g/L) தெளிக்கவும்',
            ],
        preventiveMeasures: language === 'english'
          ? [
              'Use disease-resistant varieties',
              'Avoid excessive nitrogen fertilization',
              'Maintain proper field drainage',
              'Clean tools after working in infected fields',
            ]
          : [
              'நோய் எதிர்ப்பு ரகங்களைப் பயன்படுத்துங்கள்',
              'அதிகப்படியான நைட்ரஜன் உரமிடுதலைத் தவிர்க்கவும்',
              'சரியான வயல் வடிகால் பராமரிக்கவும்',
              'பாதிக்கப்பட்ட வயல்களில் வேலை செய்த பின் கருவிகளை சுத்தம் செய்யுங்கள்',
            ],
      });
      setIsAnalyzing(false);
    }, 2500);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-danger-100 text-danger-700 border-danger-200';
      case 'medium':
        return 'bg-warning-100 text-warning-700 border-warning-200';
      default:
        return 'bg-success-100 text-success-700 border-success-200';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high':
        return t.highSeverity;
      case 'medium':
        return t.mediumSeverity;
      default:
        return t.lowSeverity;
    }
  };

  const resetDiagnosis = () => {
    setSelectedImage(null);
    setResult(null);
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Upload Section */}
        {!selectedImage && !isAnalyzing && !result && (
          <div className="space-y-4">
            {/* Instructions Card */}
            <div className="bg-farm-primary-50 border border-farm-primary-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-farm-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-farm-primary-700 mb-1">{t.uploadTitle}</h3>
                  <p className="text-sm text-farm-primary-600">{t.uploadDesc}</p>
                </div>
              </div>
            </div>

            {/* Upload Options */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border-2 border-dashed border-farm-primary-300 hover:border-farm-primary-500 hover:bg-farm-primary-50 transition-all"
              >
                <Camera className="w-10 h-10 text-farm-primary-600 mb-2" />
                <span className="font-medium text-farm-primary-700">{t.camera}</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border-2 border-dashed border-gray-300 hover:border-farm-primary-500 hover:bg-farm-primary-50 transition-all"
              >
                <Upload className="w-10 h-10 text-gray-500 mb-2" />
                <span className="font-medium text-gray-700">{t.gallery}</span>
              </button>
            </div>

            {/* Demo Option */}
            <Button
              variant="outline"
              fullWidth
              onClick={handleDemoImage}
              leftIcon={<Image className="w-5 h-5" />}
            >
              {t.demoImage}
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}

        {/* Analyzing State */}
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative w-32 h-32 mb-6">
              {selectedImage && (
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="w-full h-full object-cover rounded-xl"
                />
              )}
              <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>
            </div>
            <p className="text-lg font-semibold text-text-primary">{t.analyzing}</p>
            <p className="text-sm text-text-muted mt-2">
              {language === 'english' ? 'AI is analyzing the image...' : 'AI படத்தை பகுப்பாய்வு செய்கிறது...'}
            </p>
          </div>
        )}

        {/* Results Section */}
        {result && !isAnalyzing && (
          <div className="space-y-4">
            {/* Image Preview */}
            {selectedImage && (
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="Analyzed"
                  className="w-full h-48 object-cover rounded-xl"
                />
                <button
                  onClick={resetDiagnosis}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Result Card */}
            <div className="card-farm space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${result.type === 'disease' ? 'bg-danger-100' : 'bg-warning-100'}`}>
                    {result.type === 'disease' ? (
                      <Leaf className="w-6 h-6 text-danger-600" />
                    ) : (
                      <Bug className="w-6 h-6 text-warning-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary">{result.name}</h3>
                    <p className="text-sm text-text-muted">{result.tamilName}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(result.severity)}`}>
                  {getSeverityLabel(result.severity)}
                </div>
              </div>

              {/* Confidence Bar */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-muted">{t.confidence}</span>
                  <span className="font-semibold text-farm-primary-600">{result.confidence}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-farm-primary-500 rounded-full transition-all"
                    style={{ width: `${result.confidence}%` }}
                  />
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-text-secondary leading-relaxed">{result.description}</p>
            </div>

            {/* Treatment Section */}
            <div className="card-farm">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-success-600" />
                <h4 className="font-semibold text-text-primary">{t.treatment}</h4>
              </div>
              <ul className="space-y-2">
                {result.treatments.map((treatment, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />
                    <span className="text-text-secondary">{treatment}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Prevention Section */}
            <div className="card-farm">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-warning-600" />
                <h4 className="font-semibold text-text-primary">{t.prevention}</h4>
              </div>
              <ul className="space-y-2">
                {result.preventiveMeasures.map((measure, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="w-4 h-4 bg-warning-100 text-warning-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="text-text-secondary">{measure}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowEscalationForm(true)}
                leftIcon={<Phone className="w-5 h-5" />}
                rightIcon={<ChevronRight className="w-5 h-5" />}
              >
                {t.escalate}
              </Button>

              <Button
                variant="outline"
                fullWidth
                onClick={resetDiagnosis}
              >
                {t.tryAgain}
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
