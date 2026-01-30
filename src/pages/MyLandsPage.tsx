import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Edit3, Trash2, Plus, Loader2, AlertCircle, Eye, Map } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { landService } from '../services/landService';
import type { LandData } from '../types/land';
import LeafletBoundaryPreview from '../components/Map/LeafletBoundaryPreview';

export default function MyLandsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const [lands, setLands] = useState<LandData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; landId: string | null; landName: string }>({
    show: false,
    landId: null,
    landName: ''
  });
  const [deleting, setDeleting] = useState(false);

  const t = {
    myLands: language === 'english' ? 'My Lands' : 'எனது நிலங்கள்',
    addLand: language === 'english' ? 'Add New Land' : 'புதிய நிலத்தைச் சேர்க்கவும்',
    edit: language === 'english' ? 'Edit' : 'திருத்து',
    delete: language === 'english' ? 'Delete' : 'நீக்கு',
    view: language === 'english' ? 'View' : 'பார்க்க',
    noLands: language === 'english' ? 'No lands added yet' : 'இன்னும் நிலங்கள் சேர்க்கப்படவில்லை',
    addFirstLand: language === 'english' ? 'Add your first land to get started' : 'தொடங்க உங்கள் முதல் நிலத்தைச் சேர்க்கவும்',
    acres: language === 'english' ? 'acres' : 'ஏக்கர்',
    confirmDelete: language === 'english' ? 'Confirm Delete' : 'நீக்குவதை உறுதிப்படுத்தவும்',
    deleteMessage: language === 'english' 
      ? 'Are you sure you want to delete' 
      : 'நிச்சயமாக நீக்க விரும்புகிறீர்களா',
    deleteWarning: language === 'english'
      ? 'This action cannot be undone. All data associated with this land will be permanently deleted.'
      : 'இந்த செயலை மாற்ற முடியாது. இந்த நிலத்துடன் தொடர்புடைய அனைத்து தரவும் நிரந்தரமாக நீக்கப்படும்.',
    cancel: language === 'english' ? 'Cancel' : 'ரத்து செய்',
    confirmDeleteBtn: language === 'english' ? 'Yes, Delete' : 'ஆம், நீக்கு',
    deleting: language === 'english' ? 'Deleting...' : 'நீக்குகிறது...',
    deleteSuccess: language === 'english' ? 'Land deleted successfully' : 'நிலம் வெற்றிகரமாக நீக்கப்பட்டது',
    deleteError: language === 'english' ? 'Failed to delete land' : 'நிலத்தை நீக்க முடியவில்லை',
    noBoundary: language === 'english' ? 'No boundary mapped' : 'எல்லை வரையப்படவில்லை',
  };

  useEffect(() => {
    fetchLands();
  }, []);

  // Refetch lands when component becomes visible (e.g., after editing)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchLands();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const fetchLands = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const fetchedLands = await landService.getAllUserLands(user.id);
      setLands(fetchedLands);
    } catch (err: any) {
      console.error('Error fetching lands:', err);
      setError(err.message || 'Failed to load lands');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (landId: string) => {
    navigate(`/land/${landId}`);
  };

  const handleEdit = (landId: string) => {
    navigate(`/add-land?edit=${landId}`);
  };

  const handleDeleteClick = (land: LandData) => {
    setDeleteConfirm({
      show: true,
      landId: land.landId,
      landName: land.name
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.landId || !user?.id) return;
    
    setDeleting(true);
    try {
      await landService.deleteLandData(deleteConfirm.landId);
      
      // Remove from state
      setLands(lands.filter(l => l.landId !== deleteConfirm.landId));
      
      // Close dialog
      setDeleteConfirm({ show: false, landId: null, landName: '' });
      
      // Show success toast
      setToast({ message: t.deleteSuccess, type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      console.error('Error deleting land:', err);
      setToast({ message: t.deleteError + ': ' + err.message, type: 'error' });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, landId: null, landName: '' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">{language === 'english' ? 'Loading lands...' : 'நிலங்களை ஏற்றுகிறது...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Map className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{t.myLands}</h1>
                <p className="text-sm text-gray-500">
                  {lands.length} {lands.length === 1 
                    ? (language === 'english' ? 'land' : 'நிலம்')
                    : (language === 'english' ? 'lands' : 'நிலங்கள்')}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/add-land')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              {t.addLand}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">{language === 'english' ? 'Error' : 'பிழை'}</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Lands Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {lands.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{t.noLands}</h3>
            <p className="text-gray-600 mb-6">{t.addFirstLand}</p>
            <button
              onClick={() => navigate('/add-land')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              {t.addLand}
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lands.map((land) => (
              <div
                key={land.landId}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden border border-gray-200 group"
              >
                {/* Boundary Map Preview or Placeholder */}
                <div 
                  onClick={() => handleView(land.landId)}
                  className="relative cursor-pointer overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50"
                >
                  {land.boundary?.coordinates?.length ? (
                    <div className="relative">
                      <LeafletBoundaryPreview 
                        boundary={land.boundary} 
                        className="w-full h-48"
                      />
                      <div className="absolute top-2 right-2 px-2 py-1 bg-white bg-opacity-90 rounded-full text-xs font-medium text-green-700 shadow-sm">
                        {land.boundary.area.acres.toFixed(2)} {t.acres}
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 flex flex-col items-center justify-center text-gray-400">
                      <MapPin className="w-12 h-12 mb-2" />
                      <p className="text-sm">{t.noBoundary}</p>
                    </div>
                  )}
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all"></div>
                </div>

                {/* Card Content */}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-800 mb-1 truncate">{land.name}</h3>
                  <div className="flex items-center text-gray-600 text-sm mb-4">
                    <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{land.location}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleView(land.landId)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      {t.view}
                    </button>
                    <button
                      onClick={() => handleEdit(land.landId)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                    >
                      <Edit3 className="w-4 h-4" />
                      {t.edit}
                    </button>
                    <button
                      onClick={() => handleDeleteClick(land)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t.delete}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Modal Header */}
            <div className="bg-red-50 p-6 border-b border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-900">{t.confirmDelete}</h3>
                  <p className="text-sm text-red-700">This action is permanent</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-800 mb-2">
                {t.deleteMessage} <span className="font-bold">"{deleteConfirm.landName}"</span>?
              </p>
              <p className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                {t.deleteWarning}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="p-6 bg-gray-50 border-t flex gap-3">
              <button
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t.deleting}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    {t.confirmDeleteBtn}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
          <div className={`px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
            toast.type === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}>
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
