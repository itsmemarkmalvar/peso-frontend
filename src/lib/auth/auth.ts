/**
 * Authentication Utilities
 * Handles token management and auth state
 */

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'intern' | 'supervisor' | 'coordinator';
  name?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const AUTH_TOKEN_KEY = 'auth_token';
const USER_KEY = 'user';

export const authUtils = {
  /**
   * Save authentication token
   */
  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
  },

  /**
   * Get authentication token
   */
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    }
    return null;
  },

  /**
   * Save user data
   */
  setUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  /**
   * Get user data
   */
  getUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  },

  /**
   * Clear authentication data
   */
  clearAuth(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  /**
   * Check if user has specific role
   */
  hasRole(role: User['role']): boolean {
    const user = this.getUser();
    return user?.role === role;
  },

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: User['role'][]): boolean {
    const user = this.getUser();
    return user ? roles.includes(user.role) : false;
  },
};
