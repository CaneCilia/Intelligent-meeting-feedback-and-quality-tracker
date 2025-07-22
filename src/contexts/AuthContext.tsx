import React, { createContext, useContext, useState, useEffect } from 'react';
import { PublicClientApplication, AuthenticationResult } from '@azure/msal-browser';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loginWithMicrosoft: () => Promise<boolean>;
  fetchUserProfile: (email: string) => Promise<any>;
  updateUserProfile: (profile: any) => Promise<any>;
  logout: () => void;
  loading: boolean;
  profileComplete: boolean;
}

const msalConfig = {
  auth: {
    clientId: '28a1b27d-32d6-467d-9635-accf432bd78f',
    redirectUri: 'http://localhost:5173',
  },
};

const msalInstance = new PublicClientApplication(msalConfig);

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    // Check if user is logged in on app start and fetch profile to set profileComplete
    const initializeUser = async () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        // Fetch profile and update profileComplete
        const profile = await fetchUserProfile(userData.email);
        if (profile) {
          const isComplete = checkProfileComplete(profile);
          setProfileComplete(isComplete);
        } else {
          setProfileComplete(false);
        }
      }
      setLoading(false);
    };
    initializeUser();
  }, []);

  useEffect(() => {
    // Initialize MSAL instance on component mount
    const initializeMsal = async () => {
      try {
        await msalInstance.initialize();
      } catch (error) {
        console.error('MSAL initialization failed:', error);
      }
    };
    initializeMsal();
  }, []);

  const fetchUserProfile = async (email: string) => {
    try {
      const response = await fetch(`http://localhost:4000/api/profile/${encodeURIComponent(email)}`);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const updateUserProfile = async (profile: any) => {
    try {
      const response = await fetch('http://localhost:4000/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      if (!response.ok) {
        // Try to parse error message from server
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || 'Failed to update profile';
        throw new Error(errorMessage);
      }
      const result = await response.json();
      // After updating, check if profile is now complete and update state
      const updatedProfile = result.profile || profile;
      const isComplete = checkProfileComplete();
      setProfileComplete(isComplete);
      return result;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  const checkProfileComplete = (): boolean => {
    // Profile completion constraint removed: always return true
    return true;
  };

  const loginWithMicrosoft = async (): Promise<boolean> => {
    try {
      setLoading(true);
      console.log('[Auth] Starting Microsoft login...');
      const loginResponse: AuthenticationResult = await msalInstance.loginPopup({
        scopes: ['user.read'],
      });
      console.log('[Auth] loginPopup response:', loginResponse);
      const account = loginResponse.account;
      if (account) {
        const userData = {
          id: account.homeAccountId,
          email: account.username,
          name: account.name || account.username.split('@')[0],
          role: 'user',
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${account.username}`
        };
        console.log('[Auth] Account found, userData:', userData);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));

        // Always fetch profile from backend after login
        let profile = await fetchUserProfile(userData.email);
        console.log('[Auth] Fetched profile from backend:', profile);
        if (!profile) {
          // If not found, create it
          console.log('[Auth] No profile found, creating new profile in backend...');
          await updateUserProfile(userData);
          profile = userData;
        }
        const isComplete = checkProfileComplete();
        console.log('[Auth] Profile complete:', isComplete);
        setProfileComplete(isComplete);
        // Always return true so login never blocks
        return true;
      } else {
        console.warn('[Auth] No account returned from loginPopup.');
      }
      return false;
    } catch (error) {
      console.error('[Auth] Microsoft login failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setProfileComplete(false);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    loginWithMicrosoft,
    logout,
    loading,
    profileComplete,
    fetchUserProfile,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
