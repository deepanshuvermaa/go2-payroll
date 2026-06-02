import { create } from 'zustand';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { jwtDecode } from 'jwt-decode';
import CryptoJS from 'crypto-js';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  subscription: null,
  loading: false,
  error: null,

  // Initialize auth from localStorage
  initializeAuth: async () => {
    set({ loading: true });
    try {
      const token = localStorage.getItem('authToken');

      if (!token) {
        set({ isAuthenticated: false, loading: false });
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp > currentTime) {
          const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
          const subscription = JSON.parse(localStorage.getItem('userSubscription') || 'null');

          set({
            user,
            token,
            subscription,
            isAuthenticated: true,
            loading: false
          });
        } else {
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          set({ isAuthenticated: false, loading: false });
        }
      } catch (error) {
        console.error('Token decode failed:', error);
        localStorage.removeItem('authToken');
        set({ isAuthenticated: false, loading: false });
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      set({ isAuthenticated: false, loading: false });
    }
  },

  // Login
  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      let response, user, token, refreshToken, subscription;

      try {
        // Try backend authentication
        response = await authAPI.login(credentials);
        const responseData = response.data.data || response.data;
        ({ user, token, refreshToken, subscription } = responseData);

        if (!token || !user) {
          throw new Error('Invalid response from server');
        }

        // Cache credentials for offline login
        // Derive key from user email to avoid hardcoded keys
        const derivedKey = CryptoJS.SHA256(`go2-payroll-${credentials.email}-offline`).toString();
        const encryptedPassword = CryptoJS.AES.encrypt(
          credentials.password,
          derivedKey
        ).toString();

        localStorage.setItem('offline_credentials', JSON.stringify({
          email: credentials.email,
          password: encryptedPassword,
          lastLogin: Date.now()
        }));

      } catch (backendError) {
        // Try offline login
        console.warn('Backend unavailable, attempting offline login...');

        const cachedUser = localStorage.getItem('currentUser');
        const cachedToken = localStorage.getItem('authToken');
        const cachedSubscription = localStorage.getItem('userSubscription');
        const cachedOfflineCredentials = localStorage.getItem('offline_credentials');

        if (!cachedUser || !cachedToken || !cachedOfflineCredentials) {
          throw new Error('Cannot login offline - No cached credentials found. Please connect to internet for first login.');
        }

        const offlineCredentials = JSON.parse(cachedOfflineCredentials);
        const derivedKey = CryptoJS.SHA256(`go2-payroll-${credentials.email}-offline`).toString();
        const decryptedPassword = CryptoJS.AES.decrypt(
          offlineCredentials.password,
          derivedKey
        ).toString(CryptoJS.enc.Utf8);

        if (credentials.email !== offlineCredentials.email || credentials.password !== decryptedPassword) {
          throw new Error('Invalid credentials');
        }

        // Offline login successful
        user = JSON.parse(cachedUser);
        token = cachedToken;
        subscription = cachedSubscription ? JSON.parse(cachedSubscription) : null;

        toast.success('Logged in (Offline Mode)');
      }

      // Store auth data
      localStorage.setItem('authToken', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('currentUser', JSON.stringify(user));
      if (subscription) localStorage.setItem('userSubscription', JSON.stringify(subscription));

      set({
        user,
        token,
        subscription,
        isAuthenticated: true,
        loading: false,
        error: null
      });

      toast.success(`Welcome back, ${user.name || user.email}!`);
      // Trigger background data sync
      import('../services/apiSync.js').then(m => m.default.fullSync()).catch(() => {});
      return { success: true };

    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      set({ loading: false, error: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  // Register
  register: async (userData) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.register(userData);
      const { user, token, refreshToken, subscription } = response.data.data || response.data;

      // Store auth data
      localStorage.setItem('authToken', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('currentUser', JSON.stringify(user));
      if (subscription) localStorage.setItem('userSubscription', JSON.stringify(subscription));

      set({
        user,
        token,
        subscription,
        isAuthenticated: true,
        loading: false,
        error: null
      });

      toast.success('Registration successful!');
      return { success: true };

    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      set({ loading: false, error: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  // Logout
  logout: async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    }

    // Clear auth data including offline credentials
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userSubscription');
    localStorage.removeItem('offline_credentials');

    set({
      user: null,
      token: null,
      subscription: null,
      isAuthenticated: false,
      loading: false,
      error: null
    });

    toast.success('Logged out successfully');
  },

  // Check subscription
  checkSubscription: () => {
    const subscription = get().subscription;

    if (!subscription) {
      return {
        isActive: false,
        canAddStaff: false,
        maxStaff: 0,
        message: 'No active subscription'
      };
    }

    const isActive = subscription.status === 'active';
    const plan = subscription.plan || 'trial';

    // Get plan limits from config
    const planLimits = {
      trial: { maxStaff: 5 },
      basic: { maxStaff: 25 },
      premium: { maxStaff: 50 },
      platinum: { maxStaff: 999 }
    };

    const limit = planLimits[plan] || planLimits.trial;

    return {
      isActive,
      canAddStaff: isActive,
      maxStaff: limit.maxStaff,
      plan,
      message: isActive ? 'Subscription active' : 'Subscription expired'
    };
  }
}));

export default useAuthStore;
