import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, UserCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    user_type: 'pet_owner'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Registration failed');
      }

      const data = await response.json();
      localStorage.setItem('session_token', data.session_token);
      toast.success('Account created successfully!');
      
      if (formData.user_type === 'vet') {
        navigate('/vet/setup', { state: { user: data.user } });
      } else {
        navigate('/dashboard', { state: { user: data.user } });
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-eggshell flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-floating p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-deepblue mb-2">
              Join RafikiPets
            </h1>
            <p className="text-[#787A91]">Create your account to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-deepblue mb-2">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  data-testid="btn-user-type-owner"
                  type="button"
                  onClick={() => setFormData({ ...formData, user_type: 'pet_owner' })}
                  className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                    formData.user_type === 'pet_owner'
                      ? 'bg-clay text-white shadow-md'
                      : 'bg-eggshell text-deepblue border border-deepblue/10'
                  }`}
                >
                  Pet Owner
                </button>
                <button
                  data-testid="btn-user-type-vet"
                  type="button"
                  onClick={() => setFormData({ ...formData, user_type: 'vet' })}
                  className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                    formData.user_type === 'vet'
                      ? 'bg-sage text-white shadow-md'
                      : 'bg-eggshell text-deepblue border border-deepblue/10'
                  }`}
                >
                  Veterinarian
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-deepblue mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#787A91]" />
                <input
                  data-testid="input-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-deepblue/10 bg-[#F9F9F9] focus:bg-white focus:border-clay outline-none transition-colors"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-deepblue mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#787A91]" />
                <input
                  data-testid="input-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-deepblue/10 bg-[#F9F9F9] focus:bg-white focus:border-clay outline-none transition-colors"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-deepblue mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#787A91]" />
                <input
                  data-testid="input-password"
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-deepblue/10 bg-[#F9F9F9] focus:bg-white focus:border-clay outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              data-testid="btn-register-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-clay text-white rounded-full py-3 font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-deepblue/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-[#787A91]">Or continue with</span>
            </div>
          </div>

          <button
            data-testid="btn-google-signup"
            onClick={handleGoogleSignup}
            className="w-full bg-white border-2 border-deepblue/10 text-deepblue rounded-full py-3 font-semibold hover:border-clay hover:bg-clay/5 transition-all"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </span>
          </button>

          <p className="text-center mt-6 text-[#787A91]">
            Already have an account?{' '}
            <Link to="/login" className="text-clay font-semibold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
