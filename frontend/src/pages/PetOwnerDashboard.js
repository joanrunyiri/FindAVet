import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertCircle, Calendar, MessageCircle, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function PetOwnerDashboard({ user }) {
  const navigate = useNavigate();
  const [vets, setVets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [vetsRes, aptsRes] = await Promise.all([
        fetch(`${API}/vets`, { headers }),
        fetch(`${API}/appointments`, { headers, credentials: 'include' })
      ]);

      if (vetsRes.ok) setVets(await vetsRes.json());
      if (aptsRes.ok) setAppointments(await aptsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      localStorage.removeItem('session_token');
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-eggshell flex items-center justify-center">
        <div className="text-deepblue">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-eggshell">
      {/* Header */}
      <div className="bg-white border-b border-deepblue/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-2xl font-bold text-deepblue">
              RafikiPets
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#787A91]">Hi, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-eggshell rounded-full transition-colors"
                data-testid="btn-logout"
              >
                <LogOut className="w-5 h-5 text-[#787A91]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-8">
          <h2 className="font-heading text-3xl font-bold text-deepblue mb-2">
            Welcome Back!
          </h2>
          <p className="text-[#787A91]">How can we help your pet today?</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <button
            data-testid="btn-find-vets"
            onClick={() => navigate('/vets')}
            className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-md transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-full bg-clay/10 text-clay flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-lg font-bold text-deepblue mb-1">
              Find a Vet
            </h3>
            <p className="text-sm text-[#787A91]">
              Search for veterinarians near you
            </p>
          </button>

          <button
            data-testid="btn-emergency"
            onClick={() => navigate('/emergency')}
            className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-md transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-lg font-bold text-deepblue mb-1">
              Emergency
            </h3>
            <p className="text-sm text-[#787A91]">
              Get immediate veterinary help
            </p>
          </button>

          <button
            data-testid="btn-my-appointments"
            onClick={() => navigate('/appointments')}
            className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-md transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-full bg-sage/10 text-sage flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-lg font-bold text-deepblue mb-1">
              My Appointments
            </h3>
            <p className="text-sm text-[#787A91]">
              View and manage bookings
            </p>
          </button>
        </div>

        {/* Recent Appointments */}
        {appointments.length > 0 && (
          <div className="mb-12">
            <h3 className="font-heading text-2xl font-bold text-deepblue mb-6">
              Upcoming Appointments
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {appointments.slice(0, 4).map((apt) => (
                <div
                  key={apt.appointment_id}
                  className="bg-white rounded-2xl p-6 shadow-soft"
                  data-testid={`appointment-${apt.appointment_id}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-deepblue mb-1">
                        Dr. {apt.vet_name}
                      </h4>
                      <p className="text-sm text-[#787A91]">{apt.pet_name}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      apt.status === 'confirmed' ? 'bg-sage/10 text-sage' :
                      apt.status === 'pending' ? 'bg-sunny/50 text-deepblue' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                  <div className="text-sm text-[#787A91]">
                    <p>{apt.appointment_date} at {apt.appointment_time}</p>
                    <p className="mt-1">{apt.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Vets */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-heading text-2xl font-bold text-deepblue">
              Available Vets
            </h3>
            <button
              onClick={() => navigate('/vets')}
              className="text-clay font-semibold hover:underline"
            >
              View All
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {vets.slice(0, 3).map((vet) => (
              <div
                key={vet.user_id}
                onClick={() => navigate(`/vets/${vet.user_id}`)}
                className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-md transition-all cursor-pointer"
                data-testid={`vet-card-${vet.user_id}`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-sage/10 border-2 border-sage overflow-hidden flex items-center justify-center">
                    {vet.picture ? (
                      <img src={vet.picture} alt={vet.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-sage">
                        {vet.name?.[0] || 'V'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-deepblue">Dr. {vet.name}</h4>
                    <p className="text-sm text-[#787A91]">{vet.specialty}</p>
                  </div>
                </div>
                <p className="text-sm text-[#787A91] mb-2">{vet.location}</p>
                {vet.bio && (
                  <p className="text-sm text-[#787A91] line-clamp-2">{vet.bio}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
