import { useState, useEffect } from 'react';
import { bookingsAPI, getToken } from '../utils/api';
import { toast } from 'sonner';
import { Calendar, Clock, MapPin, FileText, CheckCircle, XCircle, Loader } from 'lucide-react';
import { format } from 'date-fns';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = getToken();
      const response = await bookingsAPI.getMyBookings(token);
      setBookings(response.data);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'approved':
        return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle, label: 'Approved' };
      case 'pending':
        return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: Loader, label: 'Pending' };
      case 'rejected':
        return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle, label: 'Rejected' };
      case 'cancelled':
        return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: XCircle, label: 'Cancelled' };
      default:
        return { bg: 'bg-white', text: 'text-gray-700', border: 'border-gray-200', icon: FileText, label: status };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-secondary">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="my-bookings-page">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
          My Bookings
        </h1>
        <p className="text-secondary">View your booking history and status</p>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-12 text-center">
          <Calendar className="w-16 h-16 text-secondary mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium text-primary mb-2">No bookings found</p>
          <p className="text-secondary">Book your first hall to see it here!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const statusConfig = getStatusConfig(booking.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={booking.id}
                data-testid={`booking-card-${booking.id}`}
                className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <MapPin className="w-5 h-5 text-primary" />
                      <h3 className="text-xl font-bold text-primary" style={{ fontFamily: 'Manrope, sans-serif' }}>
                        {booking.hall_name}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-secondary">
                        <Calendar className="w-4 h-4" />
                        <span>{booking.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-secondary">
                        <Clock className="w-4 h-4" />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{booking.slot}</span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm text-secondary">
                        <span className="font-medium">Purpose:</span> {booking.purpose}
                      </p>
                      <p className="text-sm text-secondary">
                        <span className="font-medium">Department:</span> {booking.department}
                      </p>
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                      Requested: {new Date(booking.requested_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-2">
                    <div className={`${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border-2 px-4 py-2 rounded-lg flex items-center gap-2 font-semibold`}>
                      <StatusIcon className="w-4 h-4" />
                      <span className="capitalize">{statusConfig.label}</span>
                    </div>
                    <div className="text-xs text-gray-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      ID: {booking.id}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}