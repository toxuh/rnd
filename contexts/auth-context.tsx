"use client";
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
}

export interface ApiKey {
  id: string;
  name: string;
  keyPreview: string;
  permissions: string[];
  rateLimit: number;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
  totalRequests: number;
}

interface AuthContextType {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // API keys
  apiKeys: ApiKey[];
  selectedApiKey: string | null;
  
  // Actions
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshApiKeys: () => Promise<void>;
  selectApiKey: (keyId: string | null) => void;
  
  // Utility
  getSelectedApiKeyValue: () => string | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [selectedApiKey, setSelectedApiKey] = useState<string | null>(null);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Load API keys when user changes
  useEffect(() => {
    if (user) {
      loadApiKeys();
    } else {
      setApiKeys([]);
      setSelectedApiKey(null);
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadApiKeys = async () => {
    try {
      const response = await fetch('/api/user/api-keys');
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.apiKeys || []);
        
        // Auto-select first active key if none selected
        if (!selectedApiKey && data.apiKeys?.length > 0) {
          const activeKey = data.apiKeys.find((key: ApiKey) => key.isActive);
          if (activeKey) {
            setSelectedApiKey(activeKey.id);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Sign in failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Sign up failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setUser(null);
      setApiKeys([]);
      setSelectedApiKey(null);
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const refreshApiKeys = async () => {
    await loadApiKeys();
  };

  const selectApiKey = (keyId: string | null) => {
    setSelectedApiKey(keyId);
    
    // Store in localStorage for persistence
    if (keyId) {
      localStorage.setItem('selectedApiKey', keyId);
    } else {
      localStorage.removeItem('selectedApiKey');
    }
  };

  const getSelectedApiKeyValue = (): string | undefined => {
    if (!selectedApiKey) return undefined;
    
    const key = apiKeys.find(k => k.id === selectedApiKey);
    return key?.keyPreview; // Note: This is just the preview, not the actual key
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    apiKeys,
    selectedApiKey,
    signIn,
    signUp,
    signOut,
    refreshUser,
    refreshApiKeys,
    selectApiKey,
    getSelectedApiKeyValue,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for getting the current API key for requests
export function useApiKey(): string | undefined {
  const { selectedApiKey, apiKeys } = useAuth();
  
  if (!selectedApiKey) return undefined;
  
  // In a real implementation, you'd need to store the actual key value
  // securely (not just the preview). For now, this returns undefined
  // to indicate that public endpoints should be used.
  return undefined;
}
