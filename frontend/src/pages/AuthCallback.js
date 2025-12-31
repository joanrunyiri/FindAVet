import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AuthCallback() {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        const hash = window.location.hash;
        const sessionId = hash.split('session_id=')[1];

        if (!sessionId) {
          throw new Error('No session ID found');
        }

        const response = await fetch(`${API}/auth/google-session`, {
          method: 'POST',
          headers: {
            'X-Session-ID': sessionId
          }
        });

        if (!response.ok) {
          throw new Error('Failed to authenticate');
        }

        const data = await response.json();
        localStorage.setItem('session_token', data.session_token);
        
        toast.success('Welcome to RafikiPets!');
        
        // Redirect based on user type
        if (data.user.user_type === 'vet') {
          // Check if vet has profile
          const profileCheck = await fetch(`${API}/vet/profile/me`, {
            headers: {
              'Authorization': `Bearer ${data.session_token}`
            }
          });
          
          if (profileCheck.status === 404) {
            navigate('/vet/setup', { state: { user: data.user }, replace: true });
          } else {
            navigate('/dashboard', { state: { user: data.user }, replace: true });
          }
        } else {
          navigate('/dashboard', { state: { user: data.user }, replace: true });
        }
      } catch (error) {
        console.error('Auth error:', error);
        toast.error('Authentication failed');
        navigate('/login', { replace: true });
      }
    };

    processSession();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-eggshell flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-clay border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-deepblue font-semibold">Completing authentication...</p>
      </div>
    </div>
  );
}
