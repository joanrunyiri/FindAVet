import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Appointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`${API}/appointments`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });
      if (response.ok) setAppointments(await response.json());
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handlePayment = async (appointmentId) => {
    try {
      const token = localStorage.getItem('session_token');
      const originUrl = window.location.origin;
      
      const response = await fetch(`${API}/payments/checkout?appointment_id=${appointmentId}&origin_url=${originUrl}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error('Payment initiation failed');
    }
  };

  return (
    <div className="min-h-screen bg-eggshell">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <button onClick={() => navigate('/dashboard')} className="text-clay font-semibold mb-6 hover:underline">
          ← Back to Dashboard
        </button>

        <h1 className="font-heading text-4xl font-bold text-deepblue mb-8">
          My Appointments
        </h1>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-soft">
            <Calendar className="w-16 h-16 text-[#787A91] mx-auto mb-4" />
            <p className="text-[#787A91]">No appointments yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt) => (
              <div key={apt.appointment_id} className="bg-white rounded-2xl p-6 shadow-soft" data-testid={`appointment-${apt.appointment_id}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-deepblue text-lg mb-2">
                      Dr. {apt.vet_name}
                    </h3>
                    <p className="text-sm text-[#787A91] mb-1">
                      <strong>Pet:</strong> {apt.pet_name} ({apt.pet_type})
                    </p>
                    <p className="text-sm text-[#787A91] mb-1">
                      <strong>Date:</strong> {apt.appointment_date} at {apt.appointment_time}
                    </p>
                    <p className="text-sm text-[#787A91] mb-2">
                      <strong>Reason:</strong> {apt.reason}
                    </p>
                    <div className="flex gap-2 items-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        apt.status === 'confirmed' ? 'bg-sage/10 text-sage' :
                        apt.status === 'pending' ? 'bg-sunny/50 text-deepblue' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {apt.status}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        apt.payment_status === 'paid' ? 'bg-sage/10 text-sage' :
                        'bg-red-50 text-red-600'
                      }`}>
                        Payment: {apt.payment_status}
                      </span>
                    </div>
                  </div>
                  {apt.payment_status === 'pending' && (
                    <button
                      onClick={() => handlePayment(apt.appointment_id)}
                      className="bg-clay text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg transition-all"
                      data-testid={`btn-pay-${apt.appointment_id}`}
                    >
                      <DollarSign className="inline w-4 h-4 mr-1" />
                      Pay ${apt.amount}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
