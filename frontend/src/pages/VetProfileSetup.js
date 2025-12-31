import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function VetProfileSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.user;
  
  const [formData, setFormData] = useState({
    license_number: '',
    specialty: '',
    location: '',
    phone: '',
    bio: '',
    experience_years: 0
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`${API}/vet/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to create profile');
      }

      toast.success('Profile created successfully!');
      navigate('/dashboard', { state: { user } });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-eggshell flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-3xl shadow-floating p-8 md:p-10">
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold text-deepblue mb-2">
              Complete Your Vet Profile
            </h1>
            <p className="text-[#787A91]">
              Tell pet owners about your practice and expertise
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-deepblue mb-2">
                  License Number *
                </label>
                <input
                  data-testid="input-license"
                  type="text"
                  required
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-deepblue/10 bg-[#F9F9F9] focus:bg-white focus:border-clay outline-none transition-colors"
                  placeholder="VET12345"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-deepblue mb-2">
                  Specialty *
                </label>
                <input
                  data-testid="input-specialty"
                  type="text"
                  required
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-deepblue/10 bg-[#F9F9F9] focus:bg-white focus:border-clay outline-none transition-colors"
                  placeholder="General Practice, Surgery, etc."
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-deepblue mb-2">
                  Location *
                </label>
                <input
                  data-testid="input-location"
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-deepblue/10 bg-[#F9F9F9] focus:bg-white focus:border-clay outline-none transition-colors"
                  placeholder="Embu, Kenya"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-deepblue mb-2">
                  Phone
                </label>
                <input
                  data-testid="input-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-deepblue/10 bg-[#F9F9F9] focus:bg-white focus:border-clay outline-none transition-colors"
                  placeholder="+254..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-deepblue mb-2">
                Years of Experience
              </label>
              <input
                data-testid="input-experience"
                type="number"
                min="0"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border border-deepblue/10 bg-[#F9F9F9] focus:bg-white focus:border-clay outline-none transition-colors"
                placeholder="5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-deepblue mb-2">
                Bio
              </label>
              <textarea
                data-testid="input-bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-deepblue/10 bg-[#F9F9F9] focus:bg-white focus:border-clay outline-none transition-colors resize-none"
                placeholder="Tell pet owners about your practice and expertise..."
              />
            </div>

            <button
              data-testid="btn-save-profile"
              type="submit"
              disabled={loading}
              className="w-full bg-sage text-white rounded-full py-3 font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Complete Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
