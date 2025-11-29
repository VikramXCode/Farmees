import React from 'react';
import { Clock, CheckCircle, AlertCircle, Calendar, MapPin, ChevronRight } from 'lucide-react';
import { useFarm } from '../contexts/FarmContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function RemindersPage() {
  const { reminders, toggleReminder, lands } = useFarm();
  const { t } = useLanguage();

  const today = new Date().toDateString();
  const todayReminders = reminders.filter(r => new Date(r.date).toDateString() === today);
  const upcomingReminders = reminders.filter(r => new Date(r.date) > new Date());
  const completedReminders = reminders.filter(r => r.completed);

  const getLandName = (landId: string) => {
    const land = lands.find(l => l.id === landId);
    return land ? land.name : 'Unknown Land';
  };

  const getLandColor = (landId: string) => {
    const landColors = {
      '1': 'bg-blue-500',
      '2': 'bg-green-500',
      '3': 'bg-purple-500',
      '4': 'bg-orange-500',
      '5': 'bg-pink-500',
    };
    return landColors[landId as keyof typeof landColors] || 'bg-gray-500';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const ReminderCard = ({ reminder, showDate = false, isTimeline = false }: { reminder: any, showDate?: boolean, isTimeline?: boolean }) => (
    <div className={`bg-white border-l-4 rounded-lg shadow-sm p-4 ${getPriorityColor(reminder.priority)} ${isTimeline ? 'relative' : ''}`}>
      {isTimeline && (
        <div className="absolute -left-2 top-4">
          <div className={`w-4 h-4 rounded-full ${getLandColor(reminder.landId)} border-2 border-white shadow-sm`}></div>
        </div>
      )}
      
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <h3 className={`font-medium ${reminder.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
              {reminder.title}
            </h3>
            {reminder.priority === 'high' && (
              <AlertCircle className="w-4 h-4 text-red-500 ml-2" />
            )}
          </div>
          
          <p className={`text-sm mb-3 ${reminder.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
            {reminder.description}
          </p>
          
          <div className="flex items-center text-xs text-gray-500 space-x-4">
            <div className="flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              <span className={`px-2 py-1 rounded-full text-white text-xs font-medium ${getLandColor(reminder.landId)}`}>
                {getLandName(reminder.landId)}
              </span>
            </div>
            {showDate && (
              <div className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate(reminder.date)}
              </div>
            )}
            <div className="flex items-center">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                reminder.priority === 'high' ? 'bg-red-100 text-red-700' :
                reminder.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {t(reminder.priority)}
              </span>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => toggleReminder(reminder.id)}
          className={`ml-4 p-1 rounded-full transition-colors ${
            reminder.completed
              ? 'text-green-600 hover:text-green-700'
              : 'text-gray-400 hover:text-green-600'
          }`}
        >
          <CheckCircle className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // Timeline uses the unified list to avoid duplicates
  const allReminders = [...reminders]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-4">
          <Clock className="w-6 h-6 text-green-600 mr-3" />
          <h1 className="text-2xl font-bold text-green-800">{t('reminders_tasks')}</h1>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{todayReminders.length}</div>
            <div className="text-sm text-blue-700">{t('today')}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{upcomingReminders.length}</div>
            <div className="text-sm text-yellow-700">{t('upcoming')}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{completedReminders.length}</div>
            <div className="text-sm text-green-700">{t('completed')}</div>
          </div>
        </div>
      </div>

      {/* Timeline View */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
          <Clock className="w-5 h-5 text-green-600 mr-2" />
          Timeline View
        </h2>
        
        {allReminders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>{t('no_tasks_today')}</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            <div className="space-y-6">
              {allReminders.map((reminder, index) => (
                <div key={reminder.id} className="relative pl-12">
                  <ReminderCard 
                    reminder={reminder} 
                    showDate={true} 
                    isTimeline={true}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Land Legend */}
      {lands.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Land Legend</h3>
          <div className="flex flex-wrap gap-3">
            {lands.map(land => (
              <div key={land.id} className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded-full ${getLandColor(land.id)}`}></div>
                <span className="text-sm text-gray-600">{land.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}