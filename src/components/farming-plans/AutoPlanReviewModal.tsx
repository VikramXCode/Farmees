import { useState, useEffect } from 'react';
import { X, CheckCircle, Calendar, DollarSign, Clock, Sprout, Loader2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  generateActivities,
  acceptGeneratedActivities,
  GeneratedActivity
} from '../../services/farmingPlanService';

interface AutoPlanReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  cropName: string;
  onAccept: () => void;
}

export default function AutoPlanReviewModal({
  isOpen,
  onClose,
  planId,
  cropName,
  onAccept
}: AutoPlanReviewModalProps) {
  const { language } = useLanguage();
  const [activities, setActivities] = useState<GeneratedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchGeneratedActivities();
    }
  }, [isOpen, planId]);

  const fetchGeneratedActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await generateActivities(planId, 'all');
      setActivities(data.activities);
    } catch (err: any) {
      console.error('Error generating activities:', err);
      setError(err.message || 'Failed to generate activities');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      setAccepting(true);
      await acceptGeneratedActivities(planId, activities);
      onAccept();
      onClose();
    } catch (err) {
      console.error('Error accepting activities:', err);
      alert(language === 'english' 
        ? 'Failed to add activities. Please try again.' 
        : 'செயல்பாடுகளை சேர்க்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.');
    } finally {
      setAccepting(false);
    }
  };

  const formatActivityType = (type: string) => {
    const map: Record<string, { en: string; ta: string }> = {
      land_preparation: { en: 'Land Preparation', ta: 'நில தயாரிப்பு' },
      ploughing: { en: 'Ploughing', ta: 'உழவு' },
      seed_sowing: { en: 'Seed Sowing', ta: 'விதைத்தல்' },
      fertilizer_application: { en: 'Fertilizer Application', ta: 'உரமிடுதல்' },
      irrigation: { en: 'Irrigation', ta: 'நீர்ப்பாசனம்' },
      weeding: { en: 'Weeding', ta: 'களை எடுத்தல்' },
      pest_control: { en: 'Pest Control', ta: 'பூச்சி கட்டுப்பாடு' },
      harvesting: { en: 'Harvesting', ta: 'அறுவடை' },
      sale: { en: 'Sale', ta: 'விற்பனை' }
    };
    const mapped = map[type] || { en: type, ta: type };
    return language === 'english' ? mapped.en : mapped.ta;
  };

  const getTotalCost = () => {
    return activities.reduce((sum, act) => sum + (act.estimatedCost || 0), 0);
  };

  const getTotalDuration = () => {
    if (activities.length === 0) return 0;
    const lastActivity = activities[activities.length - 1];
    const firstDate = new Date(activities[0].scheduledDate);
    const lastDate = new Date(lastActivity.scheduledDate);
    return Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-8" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-green-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sprout className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">
                  {language === 'english' ? 'Auto-Generated Plan' : 'தானியங்கு திட்டம்'}
                </h2>
                <p className="text-green-100 text-sm mt-1">
                  {language === 'english' 
                    ? `Review activities for ${cropName}` 
                    : `${cropName} க்கான செயல்பாடுகளை மதிப்பாய்வு செய்யவும்`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-green-700 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
              <p className="text-gray-600">
                {language === 'english' 
                  ? 'Generating personalized farming plan...' 
                  : 'தனிப்பயனாக்கப்பட்ட விவசாய திட்டம் உருவாக்கப்படுகிறது...'}
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                <p className="text-red-800 mb-4">{error}</p>
                <p className="text-sm text-red-600">
                  {language === 'english' 
                    ? 'No crop calendar found for this crop. Please add activities manually.' 
                    : 'இந்த பயிருக்கான காலண்டர் இல்லை. கைமுறையாக செயல்பாடுகளை சேர்க்கவும்.'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {language === 'english' ? 'Activities' : 'செயல்பாடுகள்'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{activities.length}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <DollarSign className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {language === 'english' ? 'Est. Cost' : 'மதிப்பீட்டு செலவு'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    ₹{getTotalCost().toLocaleString()}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-purple-600 mb-2">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {language === 'english' ? 'Duration' : 'காலம்'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {getTotalDuration()} {language === 'english' ? 'days' : 'நாட்கள்'}
                  </p>
                </div>
              </div>

              {/* Activities Timeline */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {language === 'english' ? 'Activity Timeline' : 'செயல்பாடு காலவரிசை'}
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {activities.map((activity, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                              {index + 1}
                            </span>
                            <h4 className="font-semibold text-gray-800">
                              {formatActivityType(activity.activityType)}
                            </h4>
                            {activity.isOptional && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                {language === 'english' ? 'Optional' : 'விருப்பம்'}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {language === 'english' ? activity.description : activity.descriptionTamil || activity.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(activity.scheduledDate).toLocaleDateString(
                                language === 'english' ? 'en-GB' : 'ta-IN',
                                { day: 'numeric', month: 'short', year: 'numeric' }
                              )}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              ₹{activity.estimatedCost.toLocaleString()}
                            </span>
                            {activity.durationDays > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {activity.durationDays} {language === 'english' ? 'days' : 'நாட்கள்'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  {language === 'english' 
                    ? 'These activities are auto-generated based on best practices for your crop. You can add, edit, or remove activities after accepting.' 
                    : 'இந்த செயல்பாடுகள் உங்கள் பயிருக்கான சிறந்த நடைமுறைகளின் அடிப்படையில் தானாக உருவாக்கப்படுகின்றன. ஏற்ற பிறகு செயல்பாடுகளை சேர்க்கலாம், திருத்தலாம் அல்லது நீக்கலாம்.'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  {language === 'english' ? 'Cancel' : 'ரத்து'}
                </button>
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {accepting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {language === 'english' ? 'Adding...' : 'சேர்க்கப்படுகிறது...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      {language === 'english' ? 'Accept & Add to Plan' : 'ஏற்று திட்டத்தில் சேர்'}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
