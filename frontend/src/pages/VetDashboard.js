import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MessageCircle, AlertCircle, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function VetDashboard({ user }) {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [aptsRes, emergencyRes] = await Promise.all([
        fetch(`${API}/appointments`, { headers, credentials: 'include' }),
        fetch(`${API}/emergency`, { headers, credentials: 'include' })
      ]);

      if (aptsRes.ok) setAppointments(await aptsRes.json());
      if (emergencyRes.ok) setEmergencyRequests(await emergencyRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptEmergency = async (requestId) => {
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`${API}/emergency/${requestId}/accept`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Emergency request accepted');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to accept request');
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
              RafikiPets - Vet Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#787A91]">Dr. {user?.name}</span>
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
            Welcome, Dr. {user?.name}
          </h2>
          <p className="text-[#787A91]">Manage your appointments and emergency requests</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-3xl p-6 shadow-soft">
            <Calendar className="w-8 h-8 text-sage mb-2" />
            <p className="text-3xl font-bold text-deepblue mb-1">{appointments.length}</p>
            <p className="text-sm text-[#787A91]">Appointments</p>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-soft">
            <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
            <p className="text-3xl font-bold text-deepblue mb-1">{emergencyRequests.length}</p>
            <p className="text-sm text-[#787A91]">Emergency Requests</p>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-soft">
            <MessageCircle className="w-8 h-8 text-clay mb-2" />
            <p className="text-3xl font-bold text-deepblue mb-1">-</p>
            <p className="text-sm text-[#787A91]">Messages</p>
          </div>
        </div>

        {/* Emergency Requests */}
        {emergencyRequests.length > 0 && (
          <div className="mb-12">
            <h3 className="font-heading text-2xl font-bold text-deepblue mb-6">
              Emergency Requests
            </h3>
            <div className="space-y-4">
              {emergencyRequests.map((req) => (
                <div
                  key={req.request_id}
                  className="bg-red-50 border-2 border-red-200 rounded-2xl p-6"
                  data-testid={`emergency-${req.request_id}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <h4 className="font-bold text-deepblue">Emergency - {req.pet_name}</h4>
                      </div>
                      <p className="text-sm text-deepblue mb-2">{req.description}</p>
                      <p className="text-sm text-[#787A91]">
                        <strong>Location:</strong> {req.location}
                      </p>
                      <p className="text-sm text-[#787A91]">
                        <strong>Owner:</strong> {req.owner_name}
                      </p>
                    </div>
                    {req.status === 'active' && (
                      <button
                        onClick={() => handleAcceptEmergency(req.request_id)}
                        className="bg-sage text-white px-6 py-2 rounded-full font-semibold hover:bg-sage/90 transition-colors"
                        data-testid={`btn-accept-${req.request_id}`}
                      >
                        Accept
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Appointments */}
        <div>
          <h3 className="font-heading text-2xl font-bold text-deepblue mb-6">
            Your Appointments
          </h3>
          {appointments.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-soft">
              <Calendar className="w-12 h-12 text-[#787A91] mx-auto mb-4" />
              <p className="text-[#787A91]">No appointments scheduled yet</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {appointments.map((apt) => (
                <div
                  key={apt.appointment_id}
                  className="bg-white rounded-2xl p-6 shadow-soft"
                  data-testid={`appointment-${apt.appointment_id}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-deepblue mb-1">
                        {apt.owner_name}
                      </h4>
                      <p className="text-sm text-[#787A91]">{apt.pet_name} - {apt.pet_type}</p>
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
                    <p className="mb-2">{apt.appointment_date} at {apt.appointment_time}</p>
                    <p className="font-medium text-deepblue">Reason: {apt.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
