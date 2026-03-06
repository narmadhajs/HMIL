import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { hallsAPI, bookingsAPI, getToken } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Calendar } from '../components/ui/calendar';
import { toast } from 'sonner';
import { ArrowLeft, Calendar as CalendarIcon, Clock, CheckCircle, XCircle, Ban } from 'lucide-react';
import { format } from 'date-fns';

export default function HallCalendar() {
  const { hallId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const hall = location.state?.hall;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    purpose: '',
    department: '',
  });

  useEffect(() => {
    if (selectedDate) {
      fetchSlots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const token = getToken();
      const response = await hallsAPI.getSlots(hallId, dateStr, token);
      setSlots(response.data);
    } catch (error) {
      toast.error('Failed to load slots');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = (slot) => {
    if (slot.status === 'available') {
      setSelectedSlot(slot);
      setBookingDialogOpen(true);
    } else if (slot.status === 'booked') {
      toast.error(`Hall already booked${slot.bookedBy ? ` by ${slot.bookedBy}` : ''}. Please select another slot or date.`);
    } else if (slot.status === 'blocked') {
      toast.error(`Hall blocked by admin${slot.reason ? `: ${slot.reason}` : ''}. Please select another slot or date.`);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = getToken();
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      await bookingsAPI.create(
        {
          hall_id: hallId,
          hall_name: hall?.name || hallId,
          date: dateStr,
          slot: selectedSlot.slot,
          purpose: bookingForm.purpose,
          department: bookingForm.department,
        },
        token
      );

      toast.success('Booking request submitted successfully!');
      setBookingDialogOpen(false);
      setBookingForm({ purpose: '', department: '' });
      fetchSlots();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit booking request');
    } finally {
      setLoading(false);
    }
  };

  const getSlotStatusConfig = (status) => {
    switch (status) {
      case 'available':
        return {
          bg: 'bg-green-50 hover:bg-green-100 border-green-200',
          text: 'text-green-700',
          icon: CheckCircle,
          label: 'Available',
        };
      case 'booked':
        return {
          bg: 'bg-red-50 border-red-200 cursor-not-allowed',
          text: 'text-red-700',
          icon: XCircle,
          label: 'Booked',
        };
      case 'blocked':
        return {
          bg: 'bg-gray-100 border-gray-300 cursor-not-allowed',
          text: 'text-gray-700',
          icon: Ban,
          label: 'Blocked',
        };
      default:
        return {
          bg: 'bg-white',
          text: 'text-gray-700',
          icon: Clock,
          label: 'Unknown',
        };
    }
  };

  return (
    <div data-testid="hall-calendar-page">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-6"
        data-testid="back-to-dashboard-button"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Halls
      </button>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {hall?.name || 'Hall Booking'}
        </h1>
        <p className="text-secondary">Select a date and time slot to book</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">Select Date</h3>
          </div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            data-testid="date-picker"
          />
          <div className="mt-6 space-y-2">
            <p className="text-sm font-medium">Selected Date:</p>
            <p className="text-primary font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {format(selectedDate, 'MMMM dd, yyyy')}
            </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg">Available Time Slots</h3>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-secondary">Loading slots...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {slots.map((slot) => {
                  const config = getSlotStatusConfig(slot.status);
                  const Icon = config.icon;
                  return (
                    <button
                      key={slot.slot}
                      data-testid={`slot-${slot.slot.replace(/\s/g, '-')}`}
                      onClick={() => handleSlotClick(slot)}
                      className={`${config.bg} border-2 rounded-lg p-4 transition-all ${
                        slot.status === 'available' ? 'hover:scale-105 cursor-pointer' : ''
                      }`}
                      disabled={slot.status !== 'available'}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-bold text-lg ${config.text}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          {slot.slot}
                        </span>
                        <Icon className={`w-5 h-5 ${config.text}`} />
                      </div>
                      <div className={`text-sm ${config.text} font-medium`}>{config.label}</div>
                      {slot.bookedBy && (
                        <div className="text-xs text-gray-600 mt-1">By: {slot.bookedBy}</div>
                      )}
                      {slot.reason && (
                        <div className="text-xs text-gray-600 mt-1">{slot.reason}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-200 border-2 border-green-400"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-200 border-2 border-red-400"></div>
                  <span>Booked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-200 border-2 border-gray-400"></div>
                  <span>Blocked</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent data-testid="booking-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Book {hall?.name}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleBookingSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Hall</Label>
              <Input value={hall?.name || hallId} disabled />
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input value={format(selectedDate, 'MMMM dd, yyyy')} disabled />
            </div>

            <div className="space-y-2">
              <Label>Time Slot</Label>
              <Input value={selectedSlot?.slot} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose of Booking *</Label>
              <Textarea
                id="purpose"
                data-testid="booking-purpose-input"
                placeholder="Enter the purpose of booking"
                value={bookingForm.purpose}
                onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                required
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Input
                id="department"
                data-testid="booking-department-input"
                placeholder="Enter your department"
                value={bookingForm.department}
                onChange={(e) => setBookingForm({ ...bookingForm, department: e.target.value })}
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBookingDialogOpen(false)}
                className="flex-1"
                data-testid="booking-cancel-button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary text-white hover:bg-primary/90"
                disabled={loading}
                data-testid="booking-submit-button"
              >
                {loading ? 'Submitting...' : 'Request Booking'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
