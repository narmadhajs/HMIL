import { useState, useEffect } from 'react';
import { notificationsAPI, getToken } from '../utils/api';
import { toast } from 'sonner';
import { Bell, CheckCircle, XCircle, AlertCircle, Edit } from 'lucide-react';
import { format } from 'date-fns';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = getToken();
      const response = await notificationsAPI.getMyNotifications(token);
      setNotifications(response.data);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = getToken();
      await notificationsAPI.markAsRead(id, token);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_approved':
        return { Icon: CheckCircle, color: 'text-green-600' };
      case 'booking_rejected':
        return { Icon: XCircle, color: 'text-red-600' };
      case 'booking_modified':
        return { Icon: Edit, color: 'text-blue-600' };
      case 'booking_submitted':
        return { Icon: AlertCircle, color: 'text-yellow-600' };
      default:
        return { Icon: Bell, color: 'text-gray-600' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-secondary">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="notifications-page">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Notifications
        </h1>
        <p className="text-secondary">Stay updated with your booking status</p>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-12 text-center">
          <Bell className="w-16 h-16 text-secondary mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium text-primary mb-2">No notifications yet</p>
          <p className="text-secondary">You'll see updates about your bookings here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const { Icon, color } = getNotificationIcon(notification.type);

            return (
              <div
                key={notification.id}
                data-testid={`notification-${notification.id}`}
                onClick={() => !notification.read && markAsRead(notification.id)}
                className={`bg-white border border-slate-200 rounded-xl shadow-sm p-6 transition-all cursor-pointer hover:shadow-md ${
                  !notification.read ? 'border-l-4 border-l-accent' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`${color} mt-1`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="flex-1">
                    <p className={`text-base ${!notification.read ? 'font-semibold' : ''} text-primary mb-1`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(notification.created_at), 'MMM dd, yyyy • hh:mm a')}
                    </p>
                  </div>

                  {!notification.read && (
                    <div className="bg-accent w-2 h-2 rounded-full"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}