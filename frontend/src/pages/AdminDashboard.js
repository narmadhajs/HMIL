import { useState, useEffect } from 'react';
import { adminAPI, getToken } from '../utils/api';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { Users, CheckCircle, XCircle, Calendar, Clock, MapPin, FileText } from 'lucide-react';

export default function AdminDashboard() {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchPendingBookings();
  }, []);

  const fetchPendingBookings = async () => {
    try {
      const token = getToken();
      const response = await adminAPI.getPendingBookings(token);
      setPendingBookings(response.data);
    } catch (error) {
      toast.error('Failed to load pending bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bookingId) => {
    setActionLoading(bookingId);
    try {
      const token = getToken();
      await adminAPI.approveBooking(bookingId, token);
      toast.success('Booking approved successfully');
      fetchPendingBookings();
    } catch (error) {
      toast.error('Failed to approve booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (bookingId) => {
    setActionLoading(bookingId);
    try {
      const token = getToken();
      await adminAPI.rejectBooking(bookingId, token);
      toast.success('Booking rejected');
      fetchPendingBookings();
    } catch (error) {
      toast.error('Failed to reject booking');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-secondary">Loading pending requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="admin-dashboard-page">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Pending Booking Requests
        </h1>
        <p className="text-secondary">Review and manage booking requests</p>
      </div>

      {pendingBookings.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-12 text-center">
          <Users className="w-16 h-16 text-secondary mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium text-primary mb-2">No pending requests</p>
          <p className="text-secondary">All booking requests have been processed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingBookings.map((booking) => (
            <div
              key={booking.id}
              data-testid={`pending-booking-${booking.id}`}
              className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-bold text-primary" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      {booking.hall_name}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-secondary mb-1">
                        <span className="font-medium">Employee:</span>
                      </p>
                      <p className="text-base font-semibold">{booking.employee_name}</p>
                      <p className="text-xs text-gray-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {booking.emp_id}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-secondary mb-1">
                        <span className="font-medium">Department:</span>
                      </p>
                      <p className="text-base">{booking.department}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm">
                    <div className="flex items-center gap-2 text-secondary">
                      <Calendar className="w-4 h-4" />
                      <span>{booking.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-secondary">
                      <Clock className="w-4 h-4" />
                      <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{booking.slot}</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-secondary mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-secondary">Purpose:</p>
                        <p className="text-base">{booking.purpose}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-gray-500">
                    Requested: {new Date(booking.requested_at).toLocaleString()}
                  </div>
                </div>

                <div className="flex lg:flex-col gap-3">
                  <Button
                    onClick={() => handleApprove(booking.id)}
                    disabled={actionLoading === booking.id}
                    className="flex-1 lg:w-32 bg-green-600 hover:bg-green-700 text-white"
                    data-testid={`approve-button-${booking.id}`}
                  >
                    {actionLoading === booking.id ? (
                      'Processing...'
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleReject(booking.id)}
                    disabled={actionLoading === booking.id}
                    variant="destructive"
                    className="flex-1 lg:w-32"
                    data-testid={`reject-button-${booking.id}`}
                  >
                    {actionLoading === booking.id ? (
                      'Processing...'
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
