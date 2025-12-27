import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, Plus, ChevronRight, Star, Phone, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFarm } from '../contexts/FarmContext';
import { useLanguage } from '../contexts/LanguageContext';
import labourService, { LabourRequest, WorkType, Coordinator } from '../services/labourService';

// Work type labels in both languages
const WORK_TYPE_LABELS: Record<string, { en: string; ta: string }> = {
  land_preparation: { en: 'Land Preparation', ta: 'நில தயாரிப்பு' },
  sowing: { en: 'Sowing', ta: 'விதைப்பு' },
  transplanting: { en: 'Transplanting', ta: 'நடவு' },
  weeding: { en: 'Weeding', ta: 'களையெடுப்பு' },
  fertilizing: { en: 'Fertilizing', ta: 'உரமிடுதல்' },
  pest_control: { en: 'Pest Control', ta: 'பூச்சி கட்டுப்பாடு' },
  irrigation: { en: 'Irrigation', ta: 'நீர்ப்பாசனம்' },
  harvesting: { en: 'Harvesting', ta: 'அறுவடை' },
  post_harvest: { en: 'Post Harvest', ta: 'அறுவடை பின்' },
  general: { en: 'General Work', ta: 'பொது வேலை' }
};

// Status badges
const STATUS_CONFIG: Record<string, { color: string; label: { en: string; ta: string } }> = {
  pending: { color: 'bg-yellow-100 text-yellow-800', label: { en: 'Pending', ta: 'நிலுவையில்' } },
  accepted: { color: 'bg-blue-100 text-blue-800', label: { en: 'Accepted', ta: 'ஏற்றுக்கொள்ளப்பட்டது' } },
  assigned: { color: 'bg-purple-100 text-purple-800', label: { en: 'Workers Assigned', ta: 'தொழிலாளர்கள் நியமிக்கப்பட்டனர்' } },
  in_progress: { color: 'bg-green-100 text-green-800', label: { en: 'In Progress', ta: 'நடைபெறுகிறது' } },
  completed: { color: 'bg-green-200 text-green-900', label: { en: 'Completed', ta: 'முடிந்தது' } },
  cancelled: { color: 'bg-red-100 text-red-800', label: { en: 'Cancelled', ta: 'ரத்து' } },
  failed: { color: 'bg-gray-100 text-gray-800', label: { en: 'Failed', ta: 'தோல்வி' } }
};

export default function LabourPage() {
  const { user } = useAuth();
  const { lands, selectedLandId } = useFarm();
  const { language } = useLanguage();
  const isEnglish = language === 'english';

  const [activeTab, setActiveTab] = useState<'request' | 'history' | 'assignments'>('request');
  const [requests, setRequests] = useState<LabourRequest[]>([]);
  const [workerAssignments, setWorkerAssignments] = useState<LabourRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    landId: selectedLandId || '',
    workType: '',
    workersNeeded: 1,
    workDate: '',
    startTime: '07:00',
    duration: 8,
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Selected request for details
  const [selectedRequest, setSelectedRequest] = useState<LabourRequest | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const loadingRef = React.useRef(false);

  useEffect(() => {
    loadWorkTypes();
    if (user?.id && !loadingRef.current) {
      loadingRef.current = true;
      Promise.all([
        loadRequests(),
        loadWorkerAssignments()
      ]).finally(() => { loadingRef.current = false; });
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedLandId) {
      setFormData(prev => ({ ...prev, landId: selectedLandId }));
    }
  }, [selectedLandId]);

  const loadWorkTypes = async () => {
    try {
      const types = await labourService.getWorkTypes();
      setWorkTypes(types);
    } catch (err) {
      console.error('Failed to load work types:', err);
    }
  };

  const loadRequests = async () => {
    if (!user?.id || loading) return;
    setLoading(true);
    try {
      const response = await labourService.listFarmerRequests(user.id);
      setRequests(response.requests || []);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkerAssignments = async () => {
    if (!user?.phone) return;
    try {
      const response = await labourService.getMyAssignments(user.phone);
      setWorkerAssignments(response.requests || []);
    } catch (err) {
      console.error('Failed to load worker assignments:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !formData.landId || !formData.workType || !formData.workDate) {
      setErrorMessage(isEnglish ? 'Please fill all required fields' : 'அனைத்து தேவையான புலங்களையும் நிரப்பவும்');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await labourService.createRequest({
        farmerId: user.id,
        landId: formData.landId,
        workType: formData.workType,
        workersNeeded: formData.workersNeeded,
        workDate: formData.workDate,
        startTime: formData.startTime,
        duration: formData.duration,
        description: formData.description
      });

      setSuccessMessage(
        isEnglish
          ? `Request created! Coordinator ${response.coordinator?.name} will contact you.`
          : `கோரிக்கை உருவாக்கப்பட்டது! ஒருங்கிணைப்பாளர் ${response.coordinator?.name} உங்களைத் தொடர்பு கொள்வார்.`
      );

      // Reset form
      setFormData({
        landId: selectedLandId || '',
        workType: '',
        workersNeeded: 1,
        workDate: '',
        startTime: '07:00',
        duration: 8,
        description: ''
      });

      // Reload requests
      loadRequests();
      setActiveTab('history');
    } catch (err: any) {
      setErrorMessage(err.message || (isEnglish ? 'Failed to create request' : 'கோரிக்கை உருவாக்க முடியவில்லை'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm(isEnglish ? 'Are you sure you want to cancel this request?' : 'இந்த கோரிக்கையை ரத்து செய்ய விரும்புகிறீர்களா?')) {
      return;
    }

    try {
      await labourService.cancelRequest(requestId);
      loadRequests();
      setSelectedRequest(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!selectedRequest) return;

    try {
      await labourService.submitFeedback(selectedRequest._id, feedbackRating, feedbackText);
      setShowFeedback(false);
      setFeedbackRating(5);
      setFeedbackText('');
      loadRequests();
      setSelectedRequest(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getWorkTypeLabel = (type: string) => {
    const labels = WORK_TYPE_LABELS[type];
    return labels ? (isEnglish ? labels.en : labels.ta) : type;
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {isEnglish ? config.label.en : config.label.ta}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6">
        <div className="flex items-center mb-4">
          <Users className="w-8 h-8 text-green-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-green-800">
              {isEnglish ? 'Farm Labour' : 'விவசாய தொழிலாளர்கள்'}
            </h1>
            <p className="text-gray-600 text-sm">
              {isEnglish ? 'Request workers through local coordinators' : 'உள்ளூர் ஒருங்கிணைப்பாளர்கள் மூலம் தொழிலாளர்களை கோருங்கள்'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('request')}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === 'request'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Plus className="w-4 h-4 inline mr-1" />
            {isEnglish ? 'New Request' : 'புதிய கோரிக்கை'}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-1" />
            {isEnglish ? 'My Requests' : 'என் கோரிக்கைகள்'}
            {requests.length > 0 && (
              <span className="ml-2 bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                {requests.length}
              </span>
            )}
          </button>
          {workerAssignments.length > 0 && (
            <button
              onClick={() => setActiveTab('assignments')}
              className={`pb-3 px-1 font-medium transition-colors ${
                activeTab === 'assignments'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4 inline mr-1" />
              {isEnglish ? 'My Work' : 'என் வேலை'}
              <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                {workerAssignments.length}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'request' ? (
        <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Success/Error Messages */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
                <XCircle className="w-5 h-5 mr-2" />
                {errorMessage}
              </div>
            )}

            {/* Land Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isEnglish ? 'Select Land' : 'நிலத்தைத் தேர்ந்தெடுக்கவும்'} *
              </label>
              <select
                value={formData.landId}
                onChange={(e) => setFormData({ ...formData, landId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">{isEnglish ? 'Select a land' : 'நிலத்தைத் தேர்ந்தெடுக்கவும்'}</option>
                {lands.map((land) => (
                  <option key={land.id} value={land.id}>
                    {land.name} - {land.location}
                  </option>
                ))}
              </select>
            </div>

            {/* Work Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isEnglish ? 'Type of Work' : 'வேலை வகை'} *
              </label>
              <select
                value={formData.workType}
                onChange={(e) => setFormData({ ...formData, workType: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">{isEnglish ? 'Select work type' : 'வேலை வகையைத் தேர்ந்தெடுக்கவும்'}</option>
                {workTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {getWorkTypeLabel(type.value)}
                  </option>
                ))}
              </select>
            </div>

            {/* Workers Needed & Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isEnglish ? 'Workers Needed' : 'தேவையான தொழிலாளர்கள்'} *
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.workersNeeded}
                  onChange={(e) => setFormData({ ...formData, workersNeeded: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isEnglish ? 'Work Date' : 'வேலை தேதி'} *
                </label>
                <input
                  type="date"
                  value={formData.workDate}
                  onChange={(e) => setFormData({ ...formData, workDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Start Time & Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isEnglish ? 'Start Time' : 'தொடக்க நேரம்'}
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isEnglish ? 'Duration (hours)' : 'காலம் (மணிநேரம்)'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 8 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isEnglish ? 'Additional Details (optional)' : 'கூடுதல் விவரங்கள் (விருப்பம்)'}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder={isEnglish ? 'Any special requirements...' : 'ஏதேனும் சிறப்பு தேவைகள்...'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 text-white py-4 rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {isEnglish ? 'Creating Request...' : 'கோரிக்கை உருவாக்கப்படுகிறது...'}
                </>
              ) : (
                <>
                  <Users className="w-5 h-5 mr-2" />
                  {isEnglish ? 'Request Labour' : 'தொழிலாளர்களை கோரு'}
                </>
              )}
            </button>
          </form>
        </div>
      ) : activeTab === 'assignments' ? (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <Users className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
              <div>
                <p className="text-blue-900 font-medium">
                  {isEnglish ? 'You are assigned as a worker' : 'நீங்கள் ஒரு தொழிலாளராக நியமிக்கப்பட்டுள்ளீர்கள்'}
                </p>
                <p className="text-blue-700 text-sm">
                  {isEnglish ? 'Below are your work assignments from farmers' : 'விவசாயிகளிடமிருந்து உங்கள் வேலை பணிகள் கீழே உள்ளன'}
                </p>
              </div>
            </div>
          </div>

          {workerAssignments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-green-100 p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">{isEnglish ? 'No work assignments yet' : 'இதுவரை வேலை பணிகள் இல்லை'}</p>
            </div>
          ) : (
            workerAssignments.map((request) => (
              <div
                key={request._id}
                className="bg-white rounded-xl shadow-sm border border-blue-100 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {getWorkTypeLabel(request.workType)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {isEnglish ? 'Farmer:' : 'விவசாயி:'} {typeof request.farmerId === 'object' ? (request.farmerId as any).name : ''}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                    {new Date(request.workDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-gray-400" />
                    {request.startTime} • {request.duration}h
                  </div>
                </div>

                {request.description && (
                  <p className="text-sm text-gray-600 mb-3 p-2 bg-gray-50 rounded">
                    {request.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center text-sm">
                    <Phone className="w-4 h-4 mr-1 text-blue-600" />
                    <span className="text-gray-700">
                      {typeof request.coordinatorId === 'object' ? (request.coordinatorId as Coordinator).name : ''}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {request.location?.area}, {request.location?.district}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-green-100 p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-2" />
              <p className="text-gray-600">{isEnglish ? 'Loading requests...' : 'கோரிக்கைகள் ஏற்றப்படுகின்றன...'}</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-green-100 p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">{isEnglish ? 'No labour requests yet' : 'இதுவரை தொழிலாளர் கோரிக்கைகள் இல்லை'}</p>
              <button
                onClick={() => setActiveTab('request')}
                className="text-green-600 font-medium hover:underline"
              >
                {isEnglish ? 'Create your first request' : 'உங்கள் முதல் கோரிக்கையை உருவாக்கவும்'}
              </button>
            </div>
          ) : (
            requests.map((request) => (
              <div
                key={request._id}
                className="bg-white rounded-xl shadow-sm border border-green-100 p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedRequest(request)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {getWorkTypeLabel(request.workType)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {request.requestId}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                    {new Date(request.workDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1 text-gray-400" />
                    {request.workersNeeded} {isEnglish ? 'workers' : 'தொழிலாளர்கள்'}
                  </div>
                </div>

                {request.coordinatorId && typeof request.coordinatorId === 'object' && (
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center text-sm">
                      <Phone className="w-4 h-4 mr-1 text-green-600" />
                      <span className="text-gray-700">{(request.coordinatorId as Coordinator).name}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {getWorkTypeLabel(selectedRequest.workType)}
                  </h2>
                  <p className="text-sm text-gray-500">{selectedRequest.requestId}</p>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-center">
                  {getStatusBadge(selectedRequest.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-500">{isEnglish ? 'Date' : 'தேதி'}</p>
                    <p className="font-medium">{new Date(selectedRequest.workDate).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-500">{isEnglish ? 'Time' : 'நேரம்'}</p>
                    <p className="font-medium">{selectedRequest.startTime} ({selectedRequest.duration}h)</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-500">{isEnglish ? 'Workers' : 'தொழிலாளர்கள்'}</p>
                    <p className="font-medium">{selectedRequest.workersNeeded}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-500">{isEnglish ? 'Assigned' : 'நியமிக்கப்பட்டது'}</p>
                    <p className="font-medium">{selectedRequest.assignedWorkers?.filter(w => w.status !== 'cancelled' && w.status !== 'replaced').length || 0}</p>
                  </div>
                </div>

                {selectedRequest.coordinatorId && typeof selectedRequest.coordinatorId === 'object' && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-800 font-medium mb-2">
                      {isEnglish ? 'Your Coordinator' : 'உங்கள் ஒருங்கிணைப்பாளர்'}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-green-900">{(selectedRequest.coordinatorId as Coordinator).name}</p>
                        <p className="text-sm text-green-700">{(selectedRequest.coordinatorId as Coordinator).phone}</p>
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="font-medium">{(selectedRequest.coordinatorId as Coordinator).reliabilityScore}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedRequest.description && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">{isEnglish ? 'Notes' : 'குறிப்புகள்'}</p>
                    <p className="text-gray-700">{selectedRequest.description}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  {['pending', 'accepted', 'assigned'].includes(selectedRequest.status) && (
                    <button
                      onClick={() => handleCancelRequest(selectedRequest._id)}
                      className="flex-1 bg-red-100 text-red-700 py-3 rounded-lg font-medium hover:bg-red-200 transition-colors"
                    >
                      {isEnglish ? 'Cancel Request' : 'கோரிக்கையை ரத்து செய்'}
                    </button>
                  )}
                  {selectedRequest.status === 'completed' && !selectedRequest.farmerRating && (
                    <button
                      onClick={() => setShowFeedback(true)}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      {isEnglish ? 'Give Feedback' : 'கருத்து தெரிவிக்கவும்'}
                    </button>
                  )}
                  {selectedRequest.farmerRating && (
                    <div className="flex-1 bg-gray-50 p-3 rounded-lg text-center">
                      <div className="flex items-center justify-center mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${star <= selectedRequest.farmerRating! ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-500">{isEnglish ? 'Your Rating' : 'உங்கள் மதிப்பீடு'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedback && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {isEnglish ? 'Rate this Service' : 'இந்த சேவையை மதிப்பிடுங்கள்'}
            </h3>

            <div className="flex justify-center mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setFeedbackRating(star)}
                  className="p-1"
                >
                  <Star
                    className={`w-8 h-8 ${star <= feedbackRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={3}
              placeholder={isEnglish ? 'Share your experience (optional)' : 'உங்கள் அனுபவத்தைப் பகிருங்கள் (விருப்பம்)'}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
            />

            <div className="flex space-x-3">
              <button
                onClick={() => setShowFeedback(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium"
              >
                {isEnglish ? 'Cancel' : 'ரத்து'}
              </button>
              <button
                onClick={handleSubmitFeedback}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium"
              >
                {isEnglish ? 'Submit' : 'சமர்ப்பி'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
