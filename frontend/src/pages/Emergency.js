import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Emergency() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    location: '',
    description: '',
    pet_name: '',
    pet_type: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`${API}/emergency`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Emergency alert sent to nearby vets!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Failed to send alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-eggshell">
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
        <button onClick={() => navigate('/dashboard')} className="text-clay font-semibold mb-6 hover:underline">
          ← Back to Dashboard
        </button>

        <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <h1 className="font-heading text-3xl font-bold text-deepblue">
              Emergency Help
            </h1>
          </div>
          <p className="text-[#787A91]">
            Send an emergency alert to available vets in your area
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-floating p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-deepblue mb-2">
                Your Location *
              </label>
              <input
                data-testid="input-location"
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-deepblue/10 focus:border-red-500 outline-none"
                placeholder="Embu, Kenya"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-deepblue mb-2">
                  Pet Name *
                </label>
                <input
                  data-testid="input-pet-name"
                  type="text"
                  required
                  value={formData.pet_name}
                  onChange={(e) => setFormData({...formData, pet_name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-deepblue/10 focus:border-red-500 outline-none"
                  placeholder="Max"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-deepblue mb-2">
                  Pet Type *
                </label>
                <input
                  data-testid="input-pet-type"
                  type="text"
                  required
                  value={formData.pet_type}
                  onChange={(e) => setFormData({...formData, pet_type: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-deepblue/10 focus:border-red-500 outline-none"
                  placeholder="Dog"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-deepblue mb-2">
                Emergency Description *
              </label>
              <textarea
                data-testid="input-description"
                required
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-deepblue/10 focus:border-red-500 outline-none resize-none"
                placeholder="Describe the emergency situation..."
              />
            </div>

            <button
              data-testid="btn-send-alert"
              type="submit"
              disabled={loading}
              className="w-full bg-red-500 text-white py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Emergency Alert'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
