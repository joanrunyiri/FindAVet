import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    if (sessionId) {
      checkPaymentStatus();
    }
  }, [sessionId]);

  const checkPaymentStatus = async () => {
    let attempts = 0;
    const maxAttempts = 5;

    const poll = async () => {
      try {
        const response = await fetch(`${API}/payments/status/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.payment_status === 'paid') {
            setStatus('success');
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setStatus('timeout');
        }
      } catch (error) {
        setStatus('error');
      }
    };

    poll();
  };

  return (
    <div className="min-h-screen bg-eggshell flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-floating p-12 text-center max-w-md">
        {status === 'checking' && (
          <>
            <div className="w-16 h-16 border-4 border-clay border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-deepblue">Processing payment...</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-sage mx-auto mb-4" />
            <h2 className="font-heading text-2xl font-bold text-deepblue mb-4">
              Payment Successful!
            </h2>
            <p className="text-[#787A91] mb-6">
              Your appointment has been confirmed. The vet will contact you soon.
            </p>
            <button
              onClick={() => navigate('/appointments')}
              className="bg-clay text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all"
              data-testid="btn-view-appointments"
            >
              View Appointments
            </button>
          </>
        )}

        {(status === 'timeout' || status === 'error') && (
          <>
            <p className="text-[#787A91] mb-4">
              Payment verification in progress. Please check your appointments.
            </p>
            <button
              onClick={() => navigate('/appointments')}
              className="bg-clay text-white px-8 py-3 rounded-full font-semibold"
            >
              View Appointments
            </button>
          </>
        )}
      </div>
    </div>
  );
}
