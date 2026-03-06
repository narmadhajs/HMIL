import { useState, useEffect } from 'react';
import { hallsAPI, adminAPI, getToken } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar } from '../components/ui/calendar';
import { toast } from 'sonner';
import { Ban, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminBlockSlot() {
  const [halls, setHalls] = useState([]);
  const [selectedHall, setSelectedHall] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const slots = ['8-10 AM', '10-12 PM', '1-3 PM', '3-5 PM'];

  useEffect(() => {
    fetchHalls();
  }, []);

  const fetchHalls = async () => {
    try {
      const response = await hallsAPI.getAll();
      setHalls(response.data);
    } catch (error) {
      toast.error('Failed to load halls');
    }
  };

  const handleBlockSlot = async (e) => {
    e.preventDefault();

    if (!selectedHall || !selectedSlot) {
      toast.error('Please select hall and slot');
      return;
    }

    setLoading(true);

    try {
      const token = getToken();
      const hall = halls.find(h => h.id === selectedHall);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      await adminAPI.blockSlot(
        {
          hall_id: selectedHall,
          hall_name: hall?.name || selectedHall,
          date: dateStr,
          slot: selectedSlot,
          reason: reason || 'Blocked by admin',
        },
        token
      );

      toast.success('Slot blocked successfully');
      setSelectedHall('');
      setSelectedSlot('');
      setReason('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to block slot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="admin-block-slot-page">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Block Time Slot
        </h1>
        <p className="text-secondary">Prevent bookings for specific slots</p>
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
            data-testid="block-date-picker"
          />
          <div className="mt-6 space-y-2">
            <p className="text-sm font-medium">Selected Date:</p>
            <p className="text-primary font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {format(selectedDate, 'MMMM dd, yyyy')}
            </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <form onSubmit={handleBlockSlot} className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <Ban className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg">Block Slot Details</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="hall">Select Hall *</Label>
                <Select value={selectedHall} onValueChange={setSelectedHall}>
                  <SelectTrigger data-testid="block-hall-select">
                    <SelectValue placeholder="Choose a hall" />
                  </SelectTrigger>
                  <SelectContent>
                    {halls.map((hall) => (
                      <SelectItem key={hall.id} value={hall.id}>
                        {hall.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slot">Select Time Slot *</Label>
                <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                  <SelectTrigger data-testid="block-slot-select">
                    <SelectValue placeholder="Choose a time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {slots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Blocking (Optional)</Label>
                <Textarea
                  id="reason"
                  data-testid="block-reason-input"
                  placeholder="Enter reason for blocking this slot"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Once blocked, users will not be able to book this slot. Any pending requests for this slot will need to be handled manually.
                </p>
              </div>

              <Button
                type="submit"
                data-testid="block-slot-submit-button"
                className="w-full bg-primary text-white hover:bg-primary/90 h-12"
                disabled={loading}
              >
                {loading ? 'Blocking Slot...' : 'Block Slot'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}