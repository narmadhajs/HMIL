import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, setToken, setUser } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Building2, Lock, User } from 'lucide-react';

export default function Login() {
  const [empId, setEmpId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login({ emp_id: empId, password });
      setToken(response.data.token);
      setUser(response.data.user);
      toast.success('Login successful!');
      
      if (response.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.detail?.includes('Password not set')) {
        toast.error('Please complete your registration first');
      } else {
        toast.error(error.response?.data?.detail || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkEmployee = async () => {
    if (!empId) {
      toast.error('Please enter Employee ID');
      return;
    }

    try {
      const response = await authAPI.checkEmployee(empId);
      if (!response.data.exists) {
        navigate(`/register?emp_id=${empId}`);
      } else if (!response.data.has_password) {
        toast.info('Please check your email for password creation link');
      }
    } catch (error) {
      toast.error('Error checking employee');
    }
  };

  return (
    <div className="min-h-screen flex">
      <div 
        className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1486406163929-6565aa41cd2c?auto=format&fit=crop&w=1920&q=80)' }}
      >
        <div className="absolute inset-0 bg-primary/90 backdrop-blur-sm"></div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <Building2 className="w-20 h-20 mb-6" strokeWidth={1.5} />
          <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>HMIL Hall Booking</h1>
          <p className="text-xl text-center text-white/90">Streamlined seminar hall management for our organization</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-surface">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-primary mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>Welcome Back</h2>
            <p className="text-secondary">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="empId" className="text-sm font-medium">Employee ID</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-5 h-5" />
                <Input
                  id="empId"
                  data-testid="login-emp-id-input"
                  type="text"
                  placeholder="Enter your Employee ID"
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  onBlur={checkEmployee}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-5 h-5" />
                <Input
                  id="password"
                  data-testid="login-password-input"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-accent hover:text-accent/80 transition-colors"
                data-testid="forgot-password-link"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              data-testid="login-submit-button"
              className="w-full h-12 bg-primary text-white hover:bg-primary/90 shadow-md rounded-md font-semibold tracking-wide transition-all active:scale-95"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-secondary">
            <p>First time user? Enter your Employee ID above to register.</p>
          </div>
        </div>
      </div>
    </div>
  );
}