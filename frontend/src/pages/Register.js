import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Mail, ArrowLeft } from 'lucide-react';

export default function Register() {
  const [searchParams] = useSearchParams();
  const [empId, setEmpId] = useState(searchParams.get('emp_id') || '');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!email.endsWith('@hmil.net')) {
      toast.error('Email must end with @hmil.net');
      return;
    }

    setLoading(true);

    try {
      await authAPI.register({ emp_id: empId, email });
      toast.success('Password creation link sent to your email!');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-surface">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-6"
          data-testid="back-to-login-button"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-primary mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>First Time Registration</h2>
          <p className="text-secondary">Enter your HMIL email to get started</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="empId">Employee ID</Label>
            <Input
              id="empId"
              data-testid="register-emp-id-input"
              type="text"
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
              className="h-12"
              required
              readOnly
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">HMIL Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-5 h-5" />
              <Input
                id="email"
                data-testid="register-email-input"
                type="email"
                placeholder="yourname@hmil.net"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
            <p className="text-xs text-secondary">Email must end with @hmil.net</p>
          </div>

          <Button
            type="submit"
            data-testid="register-submit-button"
            className="w-full h-12 bg-primary text-white hover:bg-primary/90"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Password Creation Link'}
          </Button>
        </form>
      </div>
    </div>
  );
}