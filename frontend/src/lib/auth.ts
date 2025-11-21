// Authentication utility functions
// Connected to real backend APIs (Phase 2 Complete!)

import { apiClient } from './api-client';
import { socketClient } from './socket-client';

export type UserRole = 'farmer' | 'restaurant' | 'distributor' | 'inspector';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  profile?: {
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
  };
  farmDetails?: any;
  restaurantDetails?: any;
  distributorDetails?: any;
  inspectorDetails?: any;
}

export const auth = {
  // Login function - Now using real backend API
  async login(email: string, password: string, role?: UserRole): Promise<User> {
    try {
      console.log('[Auth] Starting login...', { email, role });
      const response = await apiClient.login(email, password, role);
      console.log('[Auth] Login response received:', { success: response.success, hasUser: !!response.user, hasToken: !!response.token });

      if (response.success && response.user) {
        // Validate role matches if role was provided
        if (role && response.user.role !== role) {
          throw new Error(`No account found as ${role}. Please select ${response.user.role} or create a new account.`);
        }

        // Handle both _id and id from backend
        const userId = response.user.id || response.user._id;
        if (!userId) {
          throw new Error('User ID is missing from response');
        }

        const user: User = {
          id: userId.toString(),
          email: response.user.email,
          name: response.user.profile
            ? `${response.user.profile.firstName} ${response.user.profile.lastName}`
            : response.user.email,
          role: response.user.role,
          profile: response.user.profile,
          farmDetails: response.user.farmDetails,
          restaurantDetails: response.user.restaurantDetails,
          distributorDetails: response.user.distributorDetails,
          inspectorDetails: response.user.inspectorDetails,
        };

        console.log('[Auth] User object created:', { id: user.id, email: user.email, role: user.role });

        // Store user data
        if (typeof window !== 'undefined') {
          localStorage.setItem('user-role', user.role);
          localStorage.setItem('user-data', JSON.stringify(user));
          localStorage.setItem('user', JSON.stringify(response.user));

          // Set cookies for middleware
          document.cookie = `user-role=${user.role}; path=/; max-age=604800`; // 7 days
          console.log('[Auth] User data stored in localStorage');
        }

        // Connect to real-time notifications (optional - fails gracefully if service unavailable)
        try {
          socketClient.connect(user.id, user.role);
        } catch (socketError: any) {
          // Silently ignore - notifications are optional
          console.warn('[Auth] Socket connection failed (non-critical):', socketError?.message || socketError);
        }

        console.log('[Auth] Login successful, returning user');
        return user;
      }

      throw new Error(response.message || 'Login failed - invalid response format');
    } catch (error: any) {
      // Re-throw error message (don't log expected errors like role mismatches)
      throw new Error(error.message || 'Login failed. Please try again.');
    }
  },

  // Register function - New with backend integration
  async register(userData: {
    email: string;
    password: string;
    role: UserRole;
    profile: {
      firstName: string;
      lastName: string;
      phone?: string;
    };
    [key: string]: any;
  }): Promise<User> {
    try {
      console.log('[Auth] Starting registration...', { email: userData.email, role: userData.role });
      const response: { success: boolean; user?: any; token?: string; message?: string } = await apiClient.register(userData);
      console.log('[Auth] Registration response received:', { success: response.success, hasUser: !!response.user, hasToken: !!response.token });

      if (response.success && response.user && response.token) {
        // Store the token (apiClient.register doesn't auto-store it)
        apiClient.setToken(response.token);

        // Handle both _id and id from backend
        const userId = response.user.id || response.user._id;
        if (!userId) {
          throw new Error('User ID is missing from response');
        }

        const user: User = {
          id: userId.toString(),
          email: response.user.email,
          name: `${userData.profile.firstName} ${userData.profile.lastName}`,
          role: response.user.role,
          profile: response.user.profile,
        };

        console.log('[Auth] User object created:', { id: user.id, email: user.email, role: user.role });

        // Auto-login after registration
        if (typeof window !== 'undefined') {
          localStorage.setItem('user-role', user.role);
          localStorage.setItem('user-data', JSON.stringify(user));
          localStorage.setItem('user', JSON.stringify(response.user));
          localStorage.setItem('auth-token', response.token);
          document.cookie = `user-role=${user.role}; path=/; max-age=604800`;
          console.log('[Auth] User data stored in localStorage');
        }

        // Connect to notifications
        try {
          socketClient.connect(user.id, user.role);
        } catch (socketError) {
          console.warn('[Auth] Socket connection failed (non-critical):', socketError);
        }

        console.log('[Auth] Registration successful, returning user');
        return user;
      }

      throw new Error(response.message || 'Registration failed - invalid response format');
    } catch (error: any) {
      console.error('[Auth] Registration error:', error);
      throw new Error(error.message || 'Registration failed. Please try again.');
    }
  },

  // Logout function
  logout() {
    apiClient.clearToken();
    socketClient.disconnect();

    if (typeof window !== 'undefined') {
      localStorage.removeItem('user-role');
      localStorage.removeItem('user-data');
      localStorage.removeItem('user');

      // Clear cookies
      document.cookie = 'user-role=; path=/; max-age=0';
    }
  },

  // Get current user from localStorage (for client-side)
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;

    const userData = localStorage.getItem('user-data');
    if (!userData) return null;

    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  },

  // Fetch current user from backend
  async fetchCurrentUser(): Promise<User | null> {
    try {
      const response: { success: boolean; user?: any; message?: string } = await apiClient.getCurrentUser();

      if (response.success && response.user) {
        const user: User = {
          id: response.user.id,
          email: response.user.email,
          name: response.user.profile
            ? `${response.user.profile.firstName} ${response.user.profile.lastName}`
            : response.user.email,
          role: response.user.role,
          profile: response.user.profile,
          farmDetails: response.user.farmDetails,
          restaurantDetails: response.user.restaurantDetails,
          distributorDetails: response.user.distributorDetails,
          inspectorDetails: response.user.inspectorDetails,
        };

        // Update localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('user-data', JSON.stringify(user));
        }

        return user;
      }

      return null;
    } catch (error) {
      console.error('Fetch current user error:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('auth-token');
  },

  // Update user profile
  async updateProfile(updates: any): Promise<User | null> {
    try {
      const response: { success: boolean; user?: any; message?: string } = await apiClient.updateProfile(updates);

      if (response.success && response.user) {
        const user: User = {
          id: response.user.id,
          email: response.user.email,
          name: response.user.profile
            ? `${response.user.profile.firstName} ${response.user.profile.lastName}`
            : response.user.email,
          role: response.user.role,
          profile: response.user.profile,
          farmDetails: response.user.farmDetails,
          restaurantDetails: response.user.restaurantDetails,
          distributorDetails: response.user.distributorDetails,
          inspectorDetails: response.user.inspectorDetails,
        };

        // Update localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('user-data', JSON.stringify(user));
        }

        return user;
      }

      return null;
    } catch (error) {
      console.error('Update profile error:', error);
      return null;
    }
  },
};
