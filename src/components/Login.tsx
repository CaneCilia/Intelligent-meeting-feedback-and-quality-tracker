import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';


export default function Login() {
  const [error, setError] = useState('');
  const { loginWithMicrosoft, loading, profileComplete, fetchUserProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect to home if logged in and profile is complete
    const user = localStorage.getItem('user');
    if (!user) return; // If not logged in, stay on login page
    if (profileComplete) {
      navigate('/');
    }
  }, [profileComplete, navigate]);

  const handleMicrosoftLogin = async () => {
    setError('');
    const success = await loginWithMicrosoft();
    if (success) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      // Always fetch profile from backend after login
      const profile = await fetchUserProfile(user.email);
      if (profile && profile.name && profile.company && profile.position && profile.department) {
        // Profile is complete, go to home
        navigate('/');
      } else if (profile && (!profile.name || !profile.company || !profile.position || !profile.department)) {
        // Profile exists but is incomplete, go to profile page
        navigate('/profile', { state: { showCompletePrompt: true } });
      } else {
        // No profile found, go to profile page
        navigate('/profile', { state: { showCompletePrompt: true } });
      }
    } else {
      setError('Microsoft authentication failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 p-4">
      <div className="max-w-md w-full">
        <div className="glass p-8 rounded-2xl shadow-2xl fade-in">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome</h2>
            <p className="text-blue-100">Sign in with your Microsoft account</p>
          </div>

          <div className="text-center mt-4">
            {error && (
              <div className="text-red-300 text-sm text-center bg-red-500/10 p-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            <button
              type="button"
              onClick={handleMicrosoftLogin}
              className="w-full btn-secondary py-3 text-lg font-semibold flex items-center justify-center space-x-2"
              disabled={loading}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6"
              >
                <path d="M21.5 12c0-1.1-.9-2-2-2h-7v4h7c1.1 0 2-.9 2-2zM3 6h7v4H3V6zm0 6h7v4H3v-4zm11 4h7v-4h-7v4z" />
              </svg>
              <span>{loading ? 'Signing in...' : 'Sign in with Microsoft'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
