import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import { User, LoginCredentials } from '../types';
import { getMe, login as apiLogin, setAuthToken, registerPublicKey } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { getOrCreateKeyPair, getPublicKeyAsHex } from '../utils/keyManager';

// Define the shape of the context
interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => void;
}

// Create the context with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setAuthToken(null);
    setCurrentUser(null);
    sessionStorage.setItem('justLoggedOut', '1');
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    const checkLoggedInUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        setAuthToken(token);
        try {
          const user = await getMe();
          setCurrentUser(user);
        } catch {
          // Token is invalid or expired
          logout();
        }
      }
      setIsLoading(false);
    };
    checkLoggedInUser();
  }, [logout]);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    setIsLoading(true);
    try {
      const { token, user } = await apiLogin(credentials);
      localStorage.setItem('token', token);
      setAuthToken(token);
      setCurrentUser(user);

      if (user.role === 'student') {
        try {
          const keyPair = await getOrCreateKeyPair();
          const publicKey = getPublicKeyAsHex(keyPair);
          await registerPublicKey(publicKey);
          console.log('Public key registered successfully.');
        } catch (error) {
          console.error('Error during key registration:', error);
          // Non-critical error, so we don't re-throw
        }
      }

      return user;
    } catch (error) {
      // The component calling login will handle showing the notification
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    currentUser,
    isLoading,
    login,
    logout,
  };

  // We don't render the app until we've checked for a user
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Create a custom hook for easy access to the context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};