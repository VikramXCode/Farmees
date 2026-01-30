import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  MapPin, 
  Droplet, 
  Sprout, 
  Calendar,
  Map as MapIcon,
  Loader2,
  AlertCircle,
  FileText,
  TrendingUp,
  Brain,
  Bug,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { landService } from '../services/landService';
import type { LandData } from '../types/land';
import LeafletBoundaryPreview from '../components/Map/LeafletBoundaryPreview';

export default function LandDetailsPage() {
  const { landId } = useParams<{ landId: string }>();
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const [land, setLand] = useState<LandData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const t = {
    landDetails: language === 'english' ? 'Land Details' : 'நில விவரங்கள்',
    back: language === 'english' ? 'Back' : 'திரும்பு',
    edit: language === 'english' ? 'Edit' : 'திருத்து',
    delete: language === 'english' ? 'Delete' : 'நீக்கு',
    location: language === 'english' ? 'Location' : 'இடம்',
    postalCode: language === 'english' ? 'Postal Code' : 'அஞ்சல் குறியீடு',
    district: language === 'english' ? 'State' : 'மாநிலம்',
    soilType: language === 'english' ? 'Soil Type' : 'மண் வகை',
    currentCrop: language === 'english' ? 'Current Crop' : 'தற்போதைய பயிர்',
    waterAvailability: language === 'english' ? 'Water Availability' : 'நீர் கிடைக்கும் தன்மை',
    landArea: language === 'english' ? 'Land Area' : 'நில பரப்பு',
    acres: language === 'english' ? 'acres' : 'ஏக்கர்',
    hectares: language === 'english' ? 'hectares' : 'ஹெக்டேர்',
    sqMeters: language === 'english' ? 'sq meters' : 'சதுர மீட்டர்',
    addedOn: language === 'english' ? 'Added On' : 'சேர்க்கப்பட்டது',
    boundary: language === 'english' ? 'Boundary Map' : 'எல்லை வரைபடம்',
    noBoundary: language === 'english' ? 'No boundary mapped' : 'எல்லை வரையப்படவில்லை',
    high: language === 'english' ? 'High' : 'அதிகம்',
    medium: language === 'english' ? 'Medium' : 'நடுத்தரம்',
    low: language === 'english' ? 'Low' : 'குறைவு',
    confirmDelete: language === 'english' ? 'Confirm Delete' : 'நீக்குவதை உறுதிப்படுத்தவும்',
    deleteMessage: language === 'english' 
      ? 'Are you sure you want to delete this land?' 
      : 'இந்த நிலத்தை நிச்சயமாக நீக்க விரும்புகிறீர்களா?',
    deleteWarning: language === 'english'
      ? 'This action cannot be undone. All data associated with this land will be permanently deleted.'
      : 'இந்த செயலை மாற்ற முடியாது. இந்த நிலத்துடன் தொடர்புடைய அனைத்து தரவும் நிரந்தரமாக நீக்கப்படும்.',
    cancel: language === 'english' ? 'Cancel' : 'ரத்து செய்',
    confirmDeleteBtn: language === 'english' ? 'Yes, Delete' : 'ஆம், நீக்கு',
    deleting: language === 'english' ? 'Deleting...' : 'நீக்குகிறது...',
    deleteSuccess: language === 'english' ? 'Land deleted successfully' : 'நிலம் வெற்றிகரமாக நீக்கப்பட்டது',
    deleteError: language === 'english' ? 'Failed to delete land' : 'நிலத்தை நீக்க முடியவில்லை',
    notFound: language === 'english' ? 'Land not found' : 'நிலம் கிடைக்கவில்லை',
    soilReports: language === 'english' ? 'Soil Reports' : 'மண் அறிக்கைகள்',
    noSoilReport: language === 'english' ? 'No soil report uploaded yet' : 'இன்னும் மண் அறிக்கை பதிவேற்றப்படவில்லை',
    uploadReport: language === 'english' ? 'Upload Soil Report' : 'மண் அறிக்கையை பதிவேற்றவும்',
    analysisDate: language === 'english' ? 'Analysis Date' : 'பகுப்பாய்வு தேதி',
    quickActions: language === 'english' ? 'Quick Actions' : 'விரைவு செயல்கள்',
    cropRecommendation: language === 'english' ? 'Crop Recommendations' : 'பயிர் பரிந்துரைகள்',
    diseaseAnalysis: language === 'english' ? 'Disease Analysis' : 'நோய் பகுப்பாய்வு',
    landAnalytics: language === 'english' ? 'Land Analytics' : 'நில பகுப்பாய்வு',
    viewDetails: language === 'english' ? 'View Details' : 'விவரங்களைப் பார்க்கவும்',
  };

  useEffect(() => {
    fetchLandDetails();
  }, [landId]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchLandDetails = async () => {
    if (!landId || !user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const lands = await landService.getAllUserLands(user.id);
      const foundLand = lands.find(l => l.landId === landId);
      
      if (foundLand) {
        setLand(foundLand);
      } else {
        setError(t.notFound);
      }
    } catch (err: any) {
      console.error('Error fetching land details:', err);
      setError(err.message || 'Failed to load land details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/add-land?edit=${landId}`);
  };

  const handleDeleteClick = () => {
    setDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!land || !user?.id) return;
    
    setDeleting(true);
    
    try {
      await landService.deleteLand(land.landId, user.id);
      setToast({ message: t.deleteSuccess, type: 'success' });
      
      setTimeout(() => {
        navigate('/my-lands');
      }, 1500);
    } catch (err: any) {
      console.error('Error deleting land:', err);
      setToast({ message: t.deleteError, type: 'error' });
      setDeleting(false);
    }
  };

  const getWaterAvailabilityText = (level: string) => {
    switch(level) {
      case 'high': return t.high;
      case 'medium': return t.medium;
      case 'low': return t.low;
      default: return level;
    }
  };

  const getWaterAvailabilityColor = (level: string) => {
    switch(level) {
      case 'high': return 'text-blue-600 bg-blue-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <span className="text-lg text-gray-600">
            {language === 'english' ? 'Loading...' : 'ஏற்றுகிறது...'}
          </span>
        </div>
      </div>
    );
  }

  if (error || !land) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{error || t.notFound}</h2>
          <button
            onClick={() => navigate('/my-lands')}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            {t.back}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/my-lands')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{land.name}</h1>
              <p className="text-sm text-gray-500">{t.landDetails}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span className="hidden sm:inline">{t.edit}</span>
            </button>
            <button
              onClick={handleDeleteClick}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">{t.delete}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Quick Actions Section */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-green-600" />
            {t.quickActions}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/crop-recommendation', { state: { landId: land.landId, landData: land } })}
              className="flex items-center justify-between p-4 bg-white rounded-lg hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <Sprout className="w-5 h-5 text-green-600" />
                </div>
                <span className="font-medium text-gray-700">{t.cropRecommendation}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
            </button>
            
            <button
              onClick={() => navigate('/diagnose', { state: { landId: land.landId } })}
              className="flex items-center justify-between p-4 bg-white rounded-lg hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                  <Bug className="w-5 h-5 text-red-600" />
                </div>
                <span className="font-medium text-gray-700">{t.diseaseAnalysis}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors" />
            </button>
            
            <button
              onClick={() => navigate('/analytics', { state: { landId: land.landId } })}
              className="flex items-center justify-between p-4 bg-white rounded-lg hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium text-gray-700">{t.landAnalytics}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </button>
          </div>
        </div>

        {/* Soil Report Section */}
        {land.soilReport && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                {t.soilReports}
              </h2>
              <button
                onClick={() => navigate('/soil-analyzer', { state: { landId: land.landId } })}
                className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
              >
                {t.uploadReport}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                <p className="text-xs text-purple-600 font-medium mb-1">pH</p>
                <p className="text-2xl font-bold text-purple-700">{land.soilReport.pH.toFixed(1)}</p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                <p className="text-xs text-blue-600 font-medium mb-1">Nitrogen (N)</p>
                <p className="text-2xl font-bold text-blue-700">{land.soilReport.nitrogen.toFixed(1)}</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                <p className="text-xs text-green-600 font-medium mb-1">Phosphorus (P)</p>
                <p className="text-2xl font-bold text-green-700">{land.soilReport.phosphorus.toFixed(1)}</p>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg">
                <p className="text-xs text-yellow-600 font-medium mb-1">Potassium (K)</p>
                <p className="text-2xl font-bold text-yellow-700">{land.soilReport.potassium.toFixed(1)}</p>
              </div>
              
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg">
                <p className="text-xs text-amber-600 font-medium mb-1">Organic Matter</p>
                <p className="text-2xl font-bold text-amber-700">{land.soilReport.organicMatter.toFixed(1)}%</p>
              </div>
              
              <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 rounded-lg">
                <p className="text-xs text-cyan-600 font-medium mb-1">Moisture</p>
                <p className="text-2xl font-bold text-cyan-700">{land.soilReport.moisture.toFixed(1)}%</p>
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{t.analysisDate}: {new Date(land.soilReport.analysisDate).toLocaleDateString(
                language === 'english' ? 'en-IN' : 'ta-IN',
                { year: 'numeric', month: 'long', day: 'numeric' }
              )}</span>
            </div>
          </div>
        )}

        {/* Boundary Map */}
        {land.boundary && land.boundary.coordinates.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-green-600" />
                {t.boundary}
              </h2>
            </div>
            <LeafletBoundaryPreview 
              boundary={land.boundary}
              className="w-full h-96"
            />
          </div>
        )}

        {/* Land Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Location Details */}
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
              {language === 'english' ? 'Location Information' : 'இருப்பிட தகவல்'}
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">{t.location}</p>
                  <p className="font-medium text-gray-800">{land.location}</p>
                </div>
              </div>
              
              {land.postalCode && (
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 flex items-center justify-center text-green-600 mt-0.5">
                    📮
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t.postalCode}</p>
                    <p className="font-medium text-gray-800">{land.postalCode}</p>
                  </div>
                </div>
              )}
              
              {land.district && (
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 flex items-center justify-center text-green-600 mt-0.5">
                    🗺️
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t.district}</p>
                    <p className="font-medium text-gray-800">{land.district}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Land Characteristics */}
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
              {language === 'english' ? 'Land Characteristics' : 'நில பண்புகள்'}
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 flex items-center justify-center text-green-600 mt-0.5">
                  🌱
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t.soilType}</p>
                  <p className="font-medium text-gray-800">{land.soilType}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Sprout className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">{t.currentCrop}</p>
                  <p className="font-medium text-gray-800">{land.currentCrop || '-'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Droplet className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">{t.waterAvailability}</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getWaterAvailabilityColor(land.waterAvailability)}`}>
                    {getWaterAvailabilityText(land.waterAvailability)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Area Information */}
          {land.boundary && (
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                {language === 'english' ? 'Area Measurements' : 'பரப்பளவு அளவீடுகள்'}
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-gray-700">{t.acres}</span>
                  <span className="text-xl font-bold text-green-600">
                    {land.boundary.area.acres.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">{t.hectares}</span>
                  <span className="text-lg font-semibold text-gray-700">
                    {land.boundary.area.hectares.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">{t.sqMeters}</span>
                  <span className="text-lg font-semibold text-gray-700">
                    {land.boundary.area.sqMeters.toFixed(0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
              {language === 'english' ? 'Additional Information' : 'கூடுதல் தகவல்'}
            </h2>
            
            <div className="space-y-3">
              {land.createdAt && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">{t.addedOn}</p>
                    <p className="font-medium text-gray-800">
                      {new Date(land.createdAt).toLocaleDateString(
                        language === 'english' ? 'en-IN' : 'ta-IN',
                        { year: 'numeric', month: 'long', day: 'numeric' }
                      )}
                    </p>
                  </div>
                </div>
              )}
              
              {land.boundary && (
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 flex items-center justify-center text-green-600 mt-0.5">
                    📏
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      {language === 'english' ? 'Perimeter' : 'சுற்றளவு'}
                    </p>
                    <p className="font-medium text-gray-800">
                      {land.boundary.perimeter.toFixed(0)} {language === 'english' ? 'meters' : 'மீட்டர்'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">{t.confirmDelete}</h3>
            <p className="text-gray-600 mb-1">
              {t.deleteMessage}
            </p>
            <p className="text-lg font-semibold text-red-600 mb-3">"{land.name}"</p>
            <p className="text-sm text-gray-500 mb-6">
              {t.deleteWarning}
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.deleting}</span>
                  </>
                ) : (
                  <span>{t.confirmDeleteBtn}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className={`px-6 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          } text-white font-medium`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
