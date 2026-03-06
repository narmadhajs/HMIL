import { useState, useEffect } from 'react';
import { adminAPI, getToken } from '../utils/api';
import { toast } from 'sonner';
import { Calendar, Clock, MapPin, FileText, CheckCircle, XCircle, Loader, User, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (filterStatus === 'all') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter(b => b.status === filterStatus));
    }
  }, [filterStatus, bookings]);

  const fetchBookings = async () => {
    try {
      const token = getToken();
      const response = await adminAPI.getAllBookings(token);
      setBookings(response.data);
      setFilteredBookings(response.data);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'approved':
        return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle };
      case 'pending':
        return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: Loader };
      case 'rejected':
        return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle };
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: FileText };
    }
  };

  const stats = {
    total: bookings.length,
    approved: bookings.filter(b => b.status === 'approved').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    rejected: bookings.filter(b => b.status === 'rejected').length,
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
    <div data-testid="admin-bookings-page">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
          All Bookings
        </h1>
        <p className="text-secondary">Complete booking history and management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <p className="text-sm text-secondary mb-1">Total Bookings</p>
          <p className="text-3xl font-bold text-primary">{stats.total}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl shadow-sm p-6">
          <p className="text-sm text-green-700 mb-1">Approved</p>
          <p className="text-3xl font-bold text-green-700">{stats.approved}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl shadow-sm p-6">
          <p className="text-sm text-yellow-700 mb-1">Pending</p>
          <p className="text-3xl font-bold text-yellow-700">{stats.pending}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl shadow-sm p-6">
          <p className="text-sm text-red-700 mb-1">Rejected</p>
          <p className="text-3xl font-bold text-red-700">{stats.rejected}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-secondary" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[200px]" data-testid="status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bookings</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-12 text-center">
          <FileText className="w-16 h-16 text-secondary mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium text-primary mb-2">No bookings found</p>
          <p className="text-secondary">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const statusConfig = getStatusConfig(booking.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={booking.id}
                data-testid={`booking-${booking.id}`}
                className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <MapPin className="w-5 h-5 text-primary" />
                      <h3 className="text-xl font-bold text-primary" style={{ fontFamily: 'Manrope, sans-serif' }}>
                        {booking.hall_name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-4 h-4 text-secondary" />
                      <span className="font-semibold">{booking.employee_name}</span>
                      <span className="text-xs text-gray-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>({booking.emp_id})</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-secondary">
                        <Calendar className="w-4 h-4" />
                        <span>{booking.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-secondary">
                        <Clock className="w-4 h-4" />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{booking.slot}</span>
                      </div>
                      <div className="text-secondary">
                        <span className="font-medium">Dept:</span> {booking.department}
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm text-secondary">
                        <span className="font-medium">Purpose:</span> {booking.purpose}
                      </p>
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                      Requested: {new Date(booking.requested_at).toLocaleString()}
                      {booking.approved_at && ` • Approved: ${new Date(booking.approved_at).toLocaleString()}`}
                    </div>
                  </div>

                  <div className="flex flex-col items-start lg:items-end gap-2">
                    <div className={`${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border-2 px-4 py-2 rounded-lg flex items-center gap-2 font-semibold`}>
                      <StatusIcon className="w-4 h-4" />
                      <span className="capitalize">{booking.status}</span>
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