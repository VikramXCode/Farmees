import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Calendar, CheckCircle, XCircle, Clock, AlertTriangle, Star, Phone, RefreshCw, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import labourService, { LabourRequest, Worker, Coordinator } from '../services/labourService';

// Work type labels
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

export default function CoordinatorPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isEnglish = language === 'english';

  const [activeTab, setActiveTab] = useState<'requests' | 'workers' | 'stats'>('requests');
  const [coordinator, setCoordinator] = useState<Coordinator | null>(null);
  const [requests, setRequests] = useState<LabourRequest[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected request for actions
  const [selectedRequest, setSelectedRequest] = useState<LabourRequest | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [availableWorkers, setAvailableWorkers] = useState<Worker[]>([]);
  const [replacementSuggestions, setReplacementSuggestions] = useState<{ standby: Worker[]; available: Worker[] } | null>(null);
  const [cancelledWorkerId, setCancelledWorkerId] = useState<string | null>(null);

  // Add worker form
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [workerForm, setWorkerForm] = useState({
    name: '',
    phone: '',
    skills: ['general'],
    isStandby: false
  });

  const loadingRef = React.useRef(false);

  // Redirect farmers away from coordinator page
  useEffect(() => {
    if (user?.role === 'farmer') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.id && user?.role === 'coordinator' && !loadingRef.current) {
      loadingRef.current = true;
      loadCoordinatorData().finally(() => { loadingRef.current = false; });
    }
  }, [user?.id, user?.role]);

  const loadCoordinatorData = async () => {
    setLoading(true);
    try {
      const profileRes = await labourService.getCoordinatorProfile(user!.id);
      setCoordinator(profileRes.coordinator);

      const [requestsRes, workersRes] = await Promise.all([
        labourService.listCoordinatorRequests(profileRes.coordinator._id),
        labourService.listWorkers(profileRes.coordinator._id)
      ]);

      setRequests(requestsRes.requests || []);
      setWorkers(workersRes.workers || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getWorkTypeLabel = (type: string) => {
    const labels = WORK_TYPE_LABELS[type];
    return labels ? (isEnglish ? labels.en : labels.ta) : type;
  };

  // Request Actions
  const handleAcceptRequest = async (requestId: string) => {
    try {
      await labourService.acceptRequest(requestId);
      loadCoordinatorData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    const reason = prompt(isEnglish ? 'Reason for declining (optional):' : 'மறுப்பதற்கான காரணம் (விருப்பம்):');
    try {
      await labourService.declineRequest(requestId, reason || undefined);
      loadCoordinatorData();
      setSelectedRequest(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openAssignModal = async (request: LabourRequest) => {
    setSelectedRequest(request);
    setSelectedWorkerIds([]);
    
    try {
      const res = await labourService.getAvailableWorkers(
        coordinator!._id,
        request.workDate,
        request.workType
      );
      setAvailableWorkers(res.workers);
      setShowAssignModal(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAssignWorkers = async () => {
    if (!selectedRequest || selectedWorkerIds.length === 0) return;

    try {
      await labourService.assignWorkers(selectedRequest._id, selectedWorkerIds);
      setShowAssignModal(false);
      setSelectedRequest(null);
      loadCoordinatorData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openReplaceModal = async (request: LabourRequest, workerId: string) => {
    setSelectedRequest(request);
    setCancelledWorkerId(workerId);

    try {
      const res = await labourService.getReplacementSuggestions(request._id, workerId);
      setReplacementSuggestions(res.suggestions);
      setShowReplaceModal(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReplaceWorker = async (newWorkerId: string) => {
    if (!selectedRequest || !cancelledWorkerId) return;

    const reason = prompt(isEnglish ? 'Reason for replacement:' : 'மாற்றத்திற்கான காரணம்:');
    
    try {
      await labourService.replaceWorker(selectedRequest._id, cancelledWorkerId, newWorkerId, reason || 'Worker unavailable');
      setShowReplaceModal(false);
      setSelectedRequest(null);
      setCancelledWorkerId(null);
      loadCoordinatorData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStartWork = async (requestId: string) => {
    try {
      await labourService.startWork(requestId);
      loadCoordinatorData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCompleteWork = async (requestId: string) => {
    try {
      await labourService.completeWork(requestId);
      loadCoordinatorData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Worker Management
  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coordinator) return;

    try {
      await labourService.addWorker({
        coordinatorId: coordinator._id,
        name: workerForm.name,
        phone: workerForm.phone,
        skills: workerForm.skills.map(s => ({ type: s, experienceYears: 0 })),
        isStandby: workerForm.isStandby
      });
      setShowAddWorker(false);
      setWorkerForm({ name: '', phone: '', skills: ['general'], isStandby: false });
      loadCoordinatorData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRemoveWorker = async (workerId: string) => {
    if (!confirm(isEnglish ? 'Remove this worker from your pool?' : 'இந்த தொழிலாளியை உங்கள் குழுவிலிருந்து அகற்றவா?')) {
      return;
    }

    try {
      await labourService.removeWorker(workerId);
      loadCoordinatorData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error || !coordinator) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-800">{error || (isEnglish ? 'Coordinator profile not found' : 'ஒருங்கிணைப்பாளர் சுயவிவரம் கிடைக்கவில்லை')}</p>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const activeRequests = requests.filter(r => ['accepted', 'assigned', 'in_progress'].includes(r.status));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-green-800">
                {isEnglish ? 'Coordinator Dashboard' : 'ஒருங்கிணைப்பாளர் டாஷ்போர்டு'}
              </h1>
              <p className="text-gray-600 text-sm">
                {coordinator.name} • {coordinator.workerCount} {isEnglish ? 'workers' : 'தொழிலாளர்கள்'}
              </p>
            </div>
          </div>
          <div className="flex items-center bg-green-50 px-4 py-2 rounded-lg">
            <Star className="w-5 h-5 text-yellow-500 mr-2" />
            <span className="font-bold text-green-800">{coordinator.reliabilityScore}%</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-yellow-50 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-yellow-700">{pendingRequests.length}</p>
            <p className="text-xs text-yellow-600">{isEnglish ? 'Pending' : 'நிலுவையில்'}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-700">{activeRequests.length}</p>
            <p className="text-xs text-blue-600">{isEnglish ? 'Active' : 'செயலில்'}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-700">{coordinator.successfulCompletions}</p>
            <p className="text-xs text-green-600">{isEnglish ? 'Completed' : 'முடிந்தது'}</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-purple-700">{coordinator.replacementsProvided}</p>
            <p className="text-xs text-purple-600">{isEnglish ? 'Replacements' : 'மாற்றங்கள்'}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mt-6 border-t pt-4">
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-2 px-1 font-medium ${activeTab === 'requests' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'}`}
          >
            {isEnglish ? 'Requests' : 'கோரிக்கைகள்'}
            {pendingRequests.length > 0 && (
              <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs">{pendingRequests.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('workers')}
            className={`pb-2 px-1 font-medium ${activeTab === 'workers' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'}`}
          >
            {isEnglish ? 'Workers' : 'தொழிலாளர்கள்'}
            <span className="ml-2 bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs">{workers.length}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'requests' ? (
        <div className="space-y-4">
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h3 className="font-semibold text-yellow-800 mb-3 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                {isEnglish ? 'New Requests' : 'புதிய கோரிக்கைகள'} ({pendingRequests.length})
              </h3>
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div key={request._id} className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{getWorkTypeLabel(request.workType)}</h4>
                        <p className="text-sm text-gray-500">{request.location?.area}</p>
                      </div>
                      <span className="text-sm font-medium text-yellow-700">
                        {request.workersNeeded} {isEnglish ? 'workers' : 'தொழிலாளர்கள்'}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(request.workDate).toLocaleDateString()} at {request.startTime}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAcceptRequest(request._id)}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        {isEnglish ? 'Accept' : 'ஏற்கவும்'}
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(request._id)}
                        className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg font-medium text-sm hover:bg-red-200"
                      >
                        <XCircle className="w-4 h-4 inline mr-1" />
                        {isEnglish ? 'Decline' : 'மறு'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Requests */}
          {activeRequests.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-green-100">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">
                  {isEnglish ? 'Active Requests' : 'செயலில் உள்ள கோரிக்கைகள்'}
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {activeRequests.map((request) => (
                  <div key={request._id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{getWorkTypeLabel(request.workType)}</h4>
                        <p className="text-sm text-gray-500">{request.requestId}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                        request.status === 'assigned' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {request.status === 'in_progress' ? (isEnglish ? 'In Progress' : 'நடைபெறுகிறது') :
                         request.status === 'assigned' ? (isEnglish ? 'Assigned' : 'நியமிக்கப்பட்டது') :
                         (isEnglish ? 'Accepted' : 'ஏற்கப்பட்டது')}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(request.workDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {request.startTime}
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {request.assignedWorkers?.filter(w => !['cancelled', 'replaced'].includes(w.status)).length || 0}/{request.workersNeeded}
                      </div>
                    </div>

                    {/* Assigned Workers */}
                    {request.assignedWorkers?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">{isEnglish ? 'Assigned Workers:' : 'நியமிக்கப்பட்ட தொழிலாளர்கள்:'}</p>
                        <div className="flex flex-wrap gap-2">
                          {request.assignedWorkers.filter(w => !['cancelled', 'replaced'].includes(w.status)).map((aw, idx) => {
                            const worker = typeof aw.workerId === 'object' ? aw.workerId as Worker : null;
                            return (
                              <div key={idx} className="flex items-center bg-gray-100 px-2 py-1 rounded text-sm">
                                <span>{worker?.name || 'Worker'}</span>
                                {request.status !== 'in_progress' && request.status !== 'completed' && (
                                  <button
                                    onClick={() => openReplaceModal(request, typeof aw.workerId === 'string' ? aw.workerId : (aw.workerId as Worker)._id)}
                                    className="ml-2 text-red-500 hover:text-red-700"
                                    title={isEnglish ? 'Replace worker' : 'தொழிலாளியை மாற்றவும்'}
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-2">
                      {request.status === 'accepted' && (
                        <button
                          onClick={() => openAssignModal(request)}
                          className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-purple-700"
                        >
                          <UserPlus className="w-4 h-4 inline mr-1" />
                          {isEnglish ? 'Assign Workers' : 'தொழிலாளர்களை நியமி'}
                        </button>
                      )}
                      {request.status === 'assigned' && (
                        <>
                          <button
                            onClick={() => openAssignModal(request)}
                            className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium text-sm"
                          >
                            {isEnglish ? 'Edit Assignment' : 'திருத்து'}
                          </button>
                          <button
                            onClick={() => handleStartWork(request._id)}
                            className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-green-700"
                          >
                            {isEnglish ? 'Start Work' : 'வேலையைத் தொடங்கு'}
                          </button>
                        </>
                      )}
                      {request.status === 'in_progress' && (
                        <button
                          onClick={() => handleCompleteWork(request._id)}
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 inline mr-1" />
                          {isEnglish ? 'Mark Complete' : 'முடிந்ததாக குறி'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingRequests.length === 0 && activeRequests.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-green-100 p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">{isEnglish ? 'No requests at the moment' : 'இப்போது கோரிக்கைகள் இல்லை'}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Add Worker Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddWorker(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 flex items-center"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              {isEnglish ? 'Add Worker' : 'தொழிலாளியைச் சேர்'}
            </button>
          </div>

          {/* Workers List */}
          {workers.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-green-100 p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">{isEnglish ? 'No workers in your pool yet' : 'உங்கள் குழுவில் இன்னும் தொழிலாளர்கள் இல்லை'}</p>
              <button
                onClick={() => setShowAddWorker(true)}
                className="text-green-600 font-medium hover:underline"
              >
                {isEnglish ? 'Add your first worker' : 'உங்கள் முதல் தொழிலாளியைச் சேர்க்கவும்'}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-green-100 divide-y divide-gray-100">
              {workers.map((worker) => (
                <div key={worker._id} className="p-4 flex justify-between items-center">
                  <div>
                    <div className="flex items-center">
                      <h4 className="font-semibold text-gray-800">{worker.name}</h4>
                      {worker.isStandby && (
                        <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                          {isEnglish ? 'Standby' : 'காத்திருப்பு'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 flex items-center">
                      <Phone className="w-3 h-3 mr-1" />
                      {worker.phone}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {worker.skills.map((skill, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                          {getWorkTypeLabel(skill.type)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="font-medium">{worker.reliabilityScore}%</span>
                      </div>
                      <p className="text-xs text-gray-500">{worker.completedAssignments}/{worker.totalAssignments}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveWorker(worker._id)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assign Workers Modal */}
      {showAssignModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                {isEnglish ? 'Assign Workers' : 'தொழிலாளர்களை நியமி'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {isEnglish ? `Select ${selectedRequest.workersNeeded} workers for ${getWorkTypeLabel(selectedRequest.workType)}` : 
                `${getWorkTypeLabel(selectedRequest.workType)} க்கு ${selectedRequest.workersNeeded} தொழிலாளர்களைத் தேர்ந்தெடுக்கவும்`}
              </p>

              {availableWorkers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {isEnglish ? 'No workers available for this date and skill' : 'இந்த தேதி மற்றும் திறனுக்கு தொழிலாளர்கள் இல்லை'}
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {availableWorkers.map((worker) => (
                    <label
                      key={worker._id}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedWorkerIds.includes(worker._id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedWorkerIds.includes(worker._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedWorkerIds([...selectedWorkerIds, worker._id]);
                          } else {
                            setSelectedWorkerIds(selectedWorkerIds.filter(id => id !== worker._id));
                          }
                        }}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{worker.name}</p>
                        <p className="text-sm text-gray-500">{worker.phone}</p>
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="text-sm font-medium">{worker.reliabilityScore}%</span>
                      </div>
                      {selectedWorkerIds.includes(worker._id) && (
                        <CheckCircle className="w-5 h-5 text-green-600 ml-2" />
                      )}
                    </label>
                  ))}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedRequest(null);
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium"
                >
                  {isEnglish ? 'Cancel' : 'ரத்து'}
                </button>
                <button
                  onClick={handleAssignWorkers}
                  disabled={selectedWorkerIds.length === 0}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
                >
                  {isEnglish ? `Assign (${selectedWorkerIds.length})` : `நியமி (${selectedWorkerIds.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Replace Worker Modal */}
      {showReplaceModal && replacementSuggestions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                {isEnglish ? 'Replace Worker' : 'தொழிலாளியை மாற்றவும்'}
              </h3>

              {replacementSuggestions.standby.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-blue-800 mb-2">
                    {isEnglish ? 'Standby Workers (Recommended)' : 'காத்திருப்பு தொழிலாளர்கள் (பரிந்துரைக்கப்பட்டது)'}
                  </p>
                  {replacementSuggestions.standby.map((worker) => (
                    <button
                      key={worker._id}
                      onClick={() => handleReplaceWorker(worker._id)}
                      className="w-full flex items-center justify-between p-3 mb-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100"
                    >
                      <div>
                        <p className="font-medium">{worker.name}</p>
                        <p className="text-sm text-gray-500">{worker.phone}</p>
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span>{worker.reliabilityScore}%</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {replacementSuggestions.available.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    {isEnglish ? 'Other Available Workers' : 'மற்ற கிடைக்கும் தொழிலாளர்கள்'}
                  </p>
                  {replacementSuggestions.available.map((worker) => (
                    <button
                      key={worker._id}
                      onClick={() => handleReplaceWorker(worker._id)}
                      className="w-full flex items-center justify-between p-3 mb-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium">{worker.name}</p>
                        <p className="text-sm text-gray-500">{worker.phone}</p>
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span>{worker.reliabilityScore}%</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {replacementSuggestions.standby.length === 0 && replacementSuggestions.available.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  {isEnglish ? 'No replacement workers available' : 'மாற்று தொழிலாளர்கள் கிடைக்கவில்லை'}
                </p>
              )}

              <button
                onClick={() => {
                  setShowReplaceModal(false);
                  setSelectedRequest(null);
                  setCancelledWorkerId(null);
                }}
                className="w-full mt-4 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium"
              >
                {isEnglish ? 'Cancel' : 'ரத்து'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Worker Modal */}
      {showAddWorker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <form onSubmit={handleAddWorker} className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                {isEnglish ? 'Add Worker' : 'தொழிலாளியைச் சேர்'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isEnglish ? 'Name' : 'பெயர்'} *
                  </label>
                  <input
                    type="text"
                    value={workerForm.name}
                    onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isEnglish ? 'Phone' : 'தொலைபேசி'} *
                  </label>
                  <input
                    type="tel"
                    value={workerForm.phone}
                    onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={workerForm.isStandby}
                      onChange={(e) => setWorkerForm({ ...workerForm, isStandby: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">
                      {isEnglish ? 'Available as standby/backup worker' : 'காத்திருப்பு/காப்பு தொழிலாளியாக கிடைக்கும்'}
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddWorker(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium"
                >
                  {isEnglish ? 'Cancel' : 'ரத்து'}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium"
                >
                  {isEnglish ? 'Add Worker' : 'சேர்'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
