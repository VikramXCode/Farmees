import { useState, useEffect } from 'react';
import { Lightbulb, DollarSign, Clock, AlertCircle, Package, Loader2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getActivitySuggestions, AISuggestion } from '../../services/farmingPlanService';

interface ActivitySuggestionCardProps {
  planId: string;
  activityType: string;
}

export default function ActivitySuggestionCard({ planId, activityType }: ActivitySuggestionCardProps) {
  const { language } = useLanguage();
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchSuggestions();
  }, [planId, activityType]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await getActivitySuggestions(planId, activityType);
      setSuggestions(data.suggestions);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'materials':
        return <Package className="w-5 h-5 text-purple-600" />;
      case 'timing':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'cost':
        return <DollarSign className="w-5 h-5 text-green-600" />;
      case 'weather':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Lightbulb className="w-5 h-5 text-orange-600" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-purple-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">
            {language === 'english' ? 'Getting AI suggestions...' : 'AI பரிந்துரைகள் எடுக்கப்படுகின்றன...'}
          </span>
        </div>
      </div>
    );
  }

  if (error || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-gray-800">
          {language === 'english' ? 'AI Suggestions' : 'AI பரிந்துரைகள்'}
        </h3>
      </div>

      {/* Suggestions */}
      <div className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="bg-white border border-purple-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getSuggestionIcon(suggestion.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-800">{suggestion.title}</h4>
                  {suggestion.priority && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityBadge(suggestion.priority)}`}>
                      {suggestion.priority === 'high' 
                        ? (language === 'english' ? 'Important' : 'முக்கியம்')
                        : (language === 'english' ? 'Note' : 'குறிப்பு')}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {language === 'english' ? suggestion.descriptionEnglish : suggestion.descriptionTamil || suggestion.descriptionEnglish}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-xs text-purple-600 flex items-center gap-1">
        <Lightbulb className="w-3 h-3" />
        <span>
          {language === 'english' 
            ? 'AI-powered suggestions based on your crop and weather' 
            : 'உங்கள் பயிர் மற்றும் வானிலையின் அடிப்படையில் AI பரிந்துரைகள்'}
        </span>
      </div>
    </div>
  );
}
