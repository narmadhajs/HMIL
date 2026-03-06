import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hallsAPI } from '../utils/api';
import { Building2, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHalls();
  }, []);

  const fetchHalls = async () => {
    try {
      const response = await hallsAPI.getAll();
      setHalls(response.data);
    } catch (error) {
      toast.error('Failed to load halls');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-secondary">Loading halls...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="dashboard-page">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Available Halls
        </h1>
        <p className="text-secondary">Select a hall to view availability and book</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {halls.map((hall) => (
          <div
            key={hall.id}
            data-testid={`hall-card-${hall.id}`}
            onClick={() => navigate(`/halls/${hall.id}`, { state: { hall } })}
            className="group bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden hover:border-primary/50 hover:ring-2 hover:ring-primary/5"
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={hall.image_url}
                alt={hall.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-4 right-4">
                <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-primary">
                  {hall.capacity}
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-3 mb-3">
                <Building2 className="w-6 h-6 text-primary mt-1" strokeWidth={1.5} />
                <div>
                  <h3 className="text-xl font-bold text-primary mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    {hall.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-secondary">
                    <Users className="w-4 h-4" />
                    <span>Capacity: {hall.capacity}</span>
                  </div>
                </div>
              </div>

              <button
                data-testid={`view-calendar-button-${hall.id}`}
                className="w-full mt-4 bg-primary text-white hover:bg-primary/90 rounded-md px-6 py-2.5 font-semibold tracking-wide transition-all active:scale-95"
              >
                View Calendar
              </button>
            </div>
          </div>
        ))}
      </div>

      {halls.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-secondary mx-auto mb-4 opacity-50" />
          <p className="text-secondary">No halls available at the moment</p>
        </div>
      )}
    </div>
  );
}
