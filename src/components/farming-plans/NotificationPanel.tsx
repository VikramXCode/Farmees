import { useState, useEffect } from 'react';
import { X, Bell, Clock, AlertTriangle, CheckCircle, Calendar, XCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  getUserNotifications,
  respondToNotification,
  markNotificationAsRead,
  Notification
} from '../../services/farmingPlanService';
import RescheduleModal from './RescheduleModal';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationUpdate?: () => void;
}

export default function NotificationPanel({ isOpen, onClose, onNotificationUpdate }: NotificationPanelProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchNotifications();
    }
  }, [isOpen, user?.id]);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const data = await getUserNotifications(user.id, 20);
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (notificationId: string, action: 'completed' | 'skip' | 'dismiss') => {
    try {
      setProcessingId(notificationId);
      await respondToNotification(notificationId, action);
      await fetchNotifications();
      onNotificationUpdate?.();
    } catch (error) {
      console.error('Error responding to notification:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReschedule = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowRescheduleModal(true);
  };

  const handleRescheduleSubmit = async (newDate: string, reason: string, note: string) => {
    if (!selectedNotification) return;

    try {
      setProcessingId(selectedNotification._id);
      await respondToNotification(selectedNotification._id, 'reschedule', {
        newDate,
        reason: reason as any,
        note
      });
      setShowRescheduleModal(false);
      setSelectedNotification(null);
      await fetchNotifications();
      onNotificationUpdate?.();
    } catch (error) {
      console.error('Error rescheduling activity:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reminder':
        return <Bell className="w-5 h-5 text-blue-600" />;
      case 'due':
        return <Clock className="w-5 h-5 text-orange-600" />;
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'weather':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-red-500 bg-red-50';
      case 'medium':
        return 'border-l-4 border-yellow-500 bg-yellow-50';
      default:
        return 'border-l-4 border-gray-300 bg-white';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose}>
        <div 
          className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-green-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-6 h-6" />
              <h2 className="text-xl font-bold">
                {language === 'english' ? 'Notifications' : 'அறிவிப்புகள்'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-green-700 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                {language === 'english' ? 'Loading...' : 'ஏற்றுகிறது...'}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {language === 'english' ? 'No notifications yet' : 'இன்னும் அறிவிப்புகள் இல்லை'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`rounded-lg p-4 ${getPriorityColor(notification.priority)} ${
                      notification.status === 'read' ? 'opacity-60' : ''
                    }`}
                    onClick={() => handleMarkRead(notification._id)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">
                          {language === 'english' ? notification.titleEnglish : notification.titleTamil}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {language === 'english' ? notification.messageEnglish : notification.messageTamil}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.scheduledFor).toLocaleString(
                            language === 'english' ? 'en-GB' : 'ta-IN',
                            { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons - Only show if not responded */}
                    {notification.status !== 'responded' && 
                     (notification.type === 'reminder' || notification.type === 'due' || notification.type === 'overdue') && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRespond(notification._id, 'completed');
                          }}
                          disabled={processingId === notification._id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {language === 'english' ? 'Complete' : 'முடிந்தது'}
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReschedule(notification);
                          }}
                          disabled={processingId === notification._id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          <Calendar className="w-4 h-4" />
                          {language === 'english' ? 'Reschedule' : 'மாற்று'}
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRespond(notification._id, 'skip');
                          }}
                          disabled={processingId === notification._id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          {language === 'english' ? 'Skip' : 'தவிர்'}
                        </button>
                      </div>
                    )}

                    {/* Show response if already responded */}
                    {notification.response && (
                      <div className="mt-2 text-xs text-gray-600 bg-white bg-opacity-50 rounded p-2">
                        <span className="font-medium">
                          {language === 'english' ? 'Responded: ' : 'பதில்: '}
                        </span>
                        {notification.response.action === 'completed' && (language === 'english' ? 'Completed ✓' : 'முடிந்தது ✓')}
                        {notification.response.action === 'reschedule' && (language === 'english' ? 'Rescheduled' : 'மாற்றப்பட்டது')}
                        {notification.response.action === 'skip' && (language === 'english' ? 'Skipped' : 'தவிர்க்கப்பட்டது')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedNotification && (
        <RescheduleModal
          isOpen={showRescheduleModal}
          onClose={() => {
            setShowRescheduleModal(false);
            setSelectedNotification(null);
          }}
          onSubmit={handleRescheduleSubmit}
          currentDate={selectedNotification.scheduledFor}
        />
      )}
    </>
  );
}
