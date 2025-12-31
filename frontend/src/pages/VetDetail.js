import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Award, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function VetDetail() {
  const { vetId } = useParams();
  const navigate = useNavigate();
  const [vet, setVet] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState({
    appointment_date: '',
    appointment_time: '',
    pet_name: '',
    pet_type: '',
    reason: ''
  });

  useEffect(() => {
    fetchVet();
  }, [vetId]);

  const fetchVet = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`${API}/vets/${vetId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) setVet(await response.json());
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`${API}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ ...bookingData, vet_id: vetId })
      });

      if (response.ok) {
        toast.success('Appointment booked!');
        navigate('/appointments');
      }
    } catch (error) {
      toast.error('Booking failed');
    }
  };

  if (!vet) return <div className="min-h-screen bg-eggshell flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-eggshell">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        <button onClick={() => navigate('/vets')} className="text-clay font-semibold mb-6 hover:underline">
          ← Back to Directory
        </button>

        <div className="bg-white rounded-3xl shadow-floating p-8 mb-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-24 h-24 rounded-full bg-sage/10 border-4 border-sage overflow-hidden flex items-center justify-center">
              {vet.picture ? (
                <img src={vet.picture} alt={vet.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-sage">{vet.name?.[0]}</span>
              )}
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold text-deepblue mb-2">
                Dr. {vet.name}
              </h1>
              <p className="text-lg text-[#787A91]">{vet.specialty}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-center gap-3 text-[#787A91]">
              <MapPin className="w-5 h-5 text-clay" />
              <span>{vet.location}</span>
            </div>
            <div className="flex items-center gap-3 text-[#787A91]">
              <Award className="w-5 h-5 text-clay" />
              <span>{vet.experience_years} years experience</span>
            </div>
          </div>

          {vet.bio && (
            <div className="mb-6">
              <h3 className="font-semibold text-deepblue mb-2">About</h3>
              <p className="text-[#787A91]">{vet.bio}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              data-testid="btn-book-appointment"
              onClick={() => setShowBookingForm(!showBookingForm)}
              className="bg-clay text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all"
            >
              <Calendar className="inline w-5 h-5 mr-2" />
              Book Appointment
            </button>
          </div>
        </div>

        {showBookingForm && (
          <div className="bg-white rounded-3xl shadow-floating p-8">
            <h2 className="font-heading text-2xl font-bold text-deepblue mb-6">
              Book Appointment
            </h2>
            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  data-testid="input-date"
                  type="date"
                  required
                  value={bookingData.appointment_date}
                  onChange={(e) => setBookingData({...bookingData, appointment_date: e.target.value})}
                  className="px-4 py-3 rounded-xl border border-deepblue/10 focus:border-clay outline-none"
                />
                <input
                  data-testid="input-time"
                  type="time"
                  required
                  value={bookingData.appointment_time}
                  onChange={(e) => setBookingData({...bookingData, appointment_time: e.target.value})}
                  className="px-4 py-3 rounded-xl border border-deepblue/10 focus:border-clay outline-none"
                />
              </div>
              <input
                data-testid="input-pet-name"
                type="text"
                required
                placeholder="Pet Name"
                value={bookingData.pet_name}
                onChange={(e) => setBookingData({...bookingData, pet_name: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-deepblue/10 focus:border-clay outline-none"
              />
              <input
                data-testid="input-pet-type"
                type="text"
                required
                placeholder="Pet Type (Dog, Cat, etc.)"
                value={bookingData.pet_type}
                onChange={(e) => setBookingData({...bookingData, pet_type: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-deepblue/10 focus:border-clay outline-none"
              />
              <textarea
                data-testid="input-reason"
                required
                placeholder="Reason for visit"
                value={bookingData.reason}
                onChange={(e) => setBookingData({...bookingData, reason: e.target.value})}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-deepblue/10 focus:border-clay outline-none resize-none"
              />
              <button
                data-testid="btn-confirm-booking"
                type="submit"
                className="w-full bg-clay text-white py-3 rounded-full font-bold hover:shadow-lg transition-all"
              >
                Confirm Booking ($50)
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
