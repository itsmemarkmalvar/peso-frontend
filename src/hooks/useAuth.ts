/**
 * Custom Hook for Authentication
 */

import { useState, useEffect } from 'react';
import { authUtils, type User } from '@/lib/auth/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = authUtils.getUser();
    setUser(storedUser);
    setIsLoading(false);
  }, []);

  const login = (userData: User, token: string) => {
    authUtils.setUser(userData);
    authUtils.setToken(token);
    setUser(userData);
  };

  const logout = () => {
    authUtils.clearAuth();
    setUser(null);
  };

  const isAuthenticated = authUtils.isAuthenticated();
  const hasRole = (role: User['role']) => authUtils.hasRole(role);
  const hasAnyRole = (roles: User['role'][]) => authUtils.hasAnyRole(roles);

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    hasRole,
    hasAnyRole,
  };
}
