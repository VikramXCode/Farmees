import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, CheckCircle, MapPin, Phone, Briefcase } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import labourService, { LabourRequest, Worker } from '../services/labourService';

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

// Status badges
const STATUS_CONFIG: Record<string, { color: string; label: { en: string; ta: string } }> = {
  assigned: { color: 'bg-purple-100 text-purple-800', label: { en: 'Assigned', ta: 'நியமிக்கப்பட்டது' } },
  in_progress: { color: 'bg-green-100 text-green-800', label: { en: 'In Progress', ta: 'நடைபெறுகிறது' } },
  completed: { color: 'bg-green-200 text-green-900', label: { en: 'Completed', ta: 'முடிந்தது' } }
};

export default function WorkerPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isEnglish = language === 'english';

  const [workerProfile, setWorkerProfile] = useState<Worker | null>(null);
  const [assignments, setAssignments] = useState<LabourRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.phone) {
      loadWorkerData();
    }
  }, [user?.phone]);

  const loadWorkerData = async () => {
    setLoading(true);
    try {
      const response = await labourService.getMyAssignments(user!.phone);
      setAssignments(response.requests || []);
      setWorkerProfile(response.worker || null);
    } catch (err) {
      console.error('Failed to load worker data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getWorkTypeLabel = (type: string) => {
    const labels = WORK_TYPE_LABELS[type];
    return labels ? (isEnglish ? labels.en : labels.ta) : type;
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.assigned;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {isEnglish ? config.label.en : config.label.ta}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{isEnglish ? 'Loading...' : 'ஏற்றப்படுகிறது...'}</p>
        </div>
      </div>
    );
  }

  // Show message if worker has no profile yet
  if (!workerProfile) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-bold text-yellow-900 mb-2">
            {isEnglish ? 'Profile Setup in Progress' : 'சுயவிவர அமைப்பு நடைபெறுகிறது'}
          </h2>
          <p className="text-yellow-800 mb-4">
            {isEnglish 
              ? 'Your worker profile is being set up. This happens when no labour coordinators are available yet. Please check back later or contact support.'
              : 'உங்கள் தொழிலாளர் சுயவிவரம் அமைக்கப்படுகிறது. தொழிலாளர் ஒருங்கிணைப்பாளர்கள் இல்லாதபோது இது நிகழ்கிறது. பின்னர் மீண்டும் சரிபார்க்கவும் அல்லது ஆதரவைத் தொடர்பு கொள்ளவும்.'}
          </p>
          <div className="bg-white rounded-lg p-4 inline-block">
            <p className="text-sm text-gray-600">
              {isEnglish ? 'Your Phone:' : 'உங்கள் தொலைபேசி:'} <span className="font-semibold text-gray-900">{user?.phone}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Worker Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6">
        <div className="flex items-center mb-4">
          <Briefcase className="w-8 h-8 text-green-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-green-800">
              {isEnglish ? 'Worker Dashboard' : 'தொழிலாளர் டாஷ்போர்டு'}
            </h1>
            <p className="text-gray-600 text-sm">
              {isEnglish ? 'Your work assignments and profile' : 'உங்கள் வேலை பணிகள் மற்றும் சுயவிவரம்'}
            </p>
          </div>
        </div>

        {/* Worker Stats */}
        {workerProfile && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-blue-600 text-2xl font-bold">{workerProfile.reliabilityScore}</div>
              <div className="text-blue-800 text-sm">{isEnglish ? 'Reliability' : 'நம்பகத்தன்மை'}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-green-600 text-2xl font-bold">{workerProfile.totalAssignments}</div>
              <div className="text-green-800 text-sm">{isEnglish ? 'Total Jobs' : 'மொத்த வேலைகள்'}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-purple-600 text-2xl font-bold">{workerProfile.completedAssignments}</div>
              <div className="text-purple-800 text-sm">{isEnglish ? 'Completed' : 'முடிந்தது'}</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-yellow-600 text-2xl font-bold">{assignments.length}</div>
              <div className="text-yellow-800 text-sm">{isEnglish ? 'Active Jobs' : 'செயலில் உள்ள வேலைகள்'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Work Assignments */}
      <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Calendar className="w-6 h-6 text-green-600 mr-2" />
          {isEnglish ? 'My Work Assignments' : 'என் வேலை பணிகள்'}
        </h2>

        {assignments.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              {isEnglish ? 'No work assignments yet' : 'இதுவரை வேலை பணிகள் இல்லை'}
            </p>
            <p className="text-gray-500 text-sm">
              {isEnglish ? 'You will be notified when a farmer requests your services' : 'விவசாயி உங்கள் சேவைகளை கோரும்போது உங்களுக்கு தெரிவிக்கப்படும்'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((request) => (
              <div
                key={request._id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">
                      {getWorkTypeLabel(request.workType)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {isEnglish ? 'Farmer:' : 'விவசாயி:'} {typeof request.farmerId === 'object' && request.farmerId ? (request.farmerId as any).name : ''}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium">{isEnglish ? 'Date:' : 'தேதி:'}</span>
                    <span className="ml-1">{new Date(request.workDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium">{isEnglish ? 'Time:' : 'நேரம்:'}</span>
                    <span className="ml-1">{request.startTime} • {request.duration}h</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{request.location?.area}, {request.location?.district}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{request.workersNeeded} {isEnglish ? 'workers needed' : 'தொழிலாளர்கள் தேவை'}</span>
                  </div>
                </div>

                {request.description && (
                  <div className="bg-gray-50 rounded p-3 mb-3">
                    <p className="text-sm text-gray-700">{request.description}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-1 text-green-600" />
                    <span className="font-medium">{isEnglish ? 'Coordinator:' : 'ஒருங்கிணைப்பாளர்:'}</span>
                    <span className="ml-1">
                      {typeof request.coordinatorId === 'object' && request.coordinatorId ? (request.coordinatorId as any).name : ''}
                    </span>
                  </div>
                  {request.status === 'assigned' && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skills Section */}
      {workerProfile && workerProfile.skills && workerProfile.skills.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {isEnglish ? 'My Skills' : 'என் திறன்கள்'}
          </h2>
          <div className="flex flex-wrap gap-2">
            {workerProfile.skills.filter(skill => skill && skill.type).map((skill, idx) => (
              <div key={idx} className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm">
                <span className="font-medium">{getWorkTypeLabel(skill.type)}</span>
                <span className="text-green-600 ml-2">• {skill.experienceYears} {isEnglish ? 'years' : 'வருடங்கள்'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Availability Section */}
      {workerProfile && (
        <AvailabilitySection 
          worker={workerProfile} 
          phone={user!.phone} 
          onUpdate={loadWorkerData}
          isEnglish={isEnglish}
        />
      )}
    </div>
  );
}

// Availability Section Component
interface AvailabilitySectionProps {
  worker: Worker | null;
  phone: string;
  onUpdate: () => void;
  isEnglish: boolean;
}

function AvailabilitySection({ worker, phone, onUpdate, isEnglish }: AvailabilitySectionProps) {
  const [availability, setAvailability] = useState(worker?.availability || {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: false
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const daysOfWeek = [
    { key: 'monday', label: { en: 'Monday', ta: 'திங்கள்' } },
    { key: 'tuesday', label: { en: 'Tuesday', ta: 'செவ்வாய்' } },
    { key: 'wednesday', label: { en: 'Wednesday', ta: 'புதன்' } },
    { key: 'thursday', label: { en: 'Thursday', ta: 'வியாழன்' } },
    { key: 'friday', label: { en: 'Friday', ta: 'வெள்ளி' } },
    { key: 'saturday', label: { en: 'Saturday', ta: 'சனி' } },
    { key: 'sunday', label: { en: 'Sunday', ta: 'ஞாயிறு' } }
  ];

  const handleToggle = (day: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: !prev[day as keyof typeof prev]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await labourService.updateMyAvailability(phone, availability);
      setMessage({ 
        type: 'success', 
        text: isEnglish ? 'Availability updated successfully!' : 'கிடைக்கும் நேரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!' 
      });
      onUpdate();
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: isEnglish ? 'Failed to update availability' : 'கிடைக்கும் நேரத்தை புதுப்பிக்க முடியவில்லை' 
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Calendar className="w-6 h-6 text-green-600 mr-2" />
          <h2 className="text-xl font-bold text-gray-800">
            {isEnglish ? 'My Availability' : 'என் கிடைக்கும் நேரம்'}
          </h2>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (isEnglish ? 'Saving...' : 'சேமிக்கிறது...') : (isEnglish ? 'Save Changes' : 'மாற்றங்களை சேமிக்கவும்')}
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <p className="text-sm text-gray-600 mb-4">
        {isEnglish 
          ? 'Select the days you are available to work. This helps coordinators assign you to suitable jobs.' 
          : 'நீங்கள் வேலை செய்ய கிடைக்கும் நாட்களைத் தேர்ந்தெடுக்கவும். இது ஒருங்கிணைப்பாளர்கள் உங்களுக்கு பொருத்தமான வேலைகளை ஒதுக்க உதவுகிறது.'}
      </p>

      <div className="space-y-3">
        {daysOfWeek.map(day => (
          <div key={day.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-700">
              {isEnglish ? day.label.en : day.label.ta}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={availability[day.key as keyof typeof availability] || false}
                onChange={() => handleToggle(day.key)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
