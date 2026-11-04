import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchApi } from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const storedStaff = sessionStorage.getItem('ngalam_auth_user') || localStorage.getItem('ngalam_auth_user');
      return storedStaff ? JSON.parse(storedStaff) : null;
    } catch (_) {
      return null;
    }
  });

  const [customer, setCustomer] = useState(() => {
    try {
      const storedCust = sessionStorage.getItem('ngalam_customer_session') || localStorage.getItem('ngalam_customer_session');
      return storedCust ? JSON.parse(storedCust) : null;
    } catch (_) {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hanya verifikasi ke server jika memang ada token staff tersimpan.
    // Menghindari request /api/auth/me yang tidak perlu pada pengunjung biasa.
    const hasStaffToken = sessionStorage.getItem('ngalam_jwt_token') || localStorage.getItem('ngalam_jwt_token');
    if (!hasStaffToken) {
      setLoading(false);
      return;
    }

    fetchApi('/api/auth/me')
      .then(({ ok, data }) => {
        if (ok && data.success && data.user) {
          setUser(data.user);
          const isRemember = Boolean(data.user.rememberMe);
          const targetStorage = isRemember ? localStorage : sessionStorage;
          targetStorage.setItem('ngalam_auth_user', JSON.stringify(data.user));
          if (data.user.token) {
            targetStorage.setItem('ngalam_jwt_token', data.user.token);
          }
        } else {
          // Hanya bersihkan jika server eksplisit menyatakan 401 dan bukan network glitch
          const hasLocalToken = sessionStorage.getItem('ngalam_jwt_token') || localStorage.getItem('ngalam_jwt_token');
          if (!hasLocalToken) {
            setUser(null);
            localStorage.removeItem('ngalam_auth_user');
            localStorage.removeItem('ngalam_jwt_token');
            sessionStorage.removeItem('ngalam_auth_user');
            sessionStorage.removeItem('ngalam_jwt_token');
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loginCustomer = useCallback((custData, rememberMe = true) => {
    setCustomer(custData);
    const targetStorage = rememberMe ? localStorage : sessionStorage;
    const otherStorage = rememberMe ? sessionStorage : localStorage;

    targetStorage.setItem('ngalam_customer_session', JSON.stringify(custData));
    if (custData && custData.token) {
      targetStorage.setItem('ngalam_customer_token', custData.token);
    }
    otherStorage.removeItem('ngalam_customer_session');
    otherStorage.removeItem('ngalam_customer_token');
  }, []);

  const logoutCustomer = useCallback(async () => {
    await fetchApi('/api/customer/logout', { method: 'POST' }).catch(() => {});
    setCustomer(null);
    localStorage.removeItem('ngalam_customer_session');
    localStorage.removeItem('ngalam_customer_token');
    sessionStorage.removeItem('ngalam_customer_session');
    sessionStorage.removeItem('ngalam_customer_token');
    document.cookie = 'ngalam_customer_token=; path=/; max-age=0; SameSite=Lax';
  }, []);

  const loginStaff = useCallback(async (identifier, password, role, referralCode, rememberMe = true) => {
    const res = await fetchApi('/api/auth/login', {
      method: 'POST',
      body: { identifier, password, role, referralCode, rememberMe }
    });

    if (res.ok && res.data.success) {
      const staffUser = res.data.user;
      setUser(staffUser);

      const isRemember = Boolean(rememberMe);
      const targetStorage = isRemember ? localStorage : sessionStorage;
      const otherStorage = isRemember ? sessionStorage : localStorage;

      targetStorage.setItem('ngalam_auth_user', JSON.stringify(staffUser));
      if (staffUser.token) {
        targetStorage.setItem('ngalam_jwt_token', staffUser.token);
        const maxAge = isRemember ? 2592000 : 86400;
        document.cookie = `ngalam_token=${staffUser.token}; path=/; max-age=${maxAge}; SameSite=Lax`;
      }
      otherStorage.removeItem('ngalam_auth_user');
      otherStorage.removeItem('ngalam_jwt_token');

      return { success: true, user: staffUser };
    }

    return { success: false, error: res.data.error || res.data.message || 'Login gagal' };
  }, []);

  const logoutStaff = useCallback(async () => {
    await fetchApi('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    localStorage.removeItem('ngalam_auth_user');
    localStorage.removeItem('ngalam_jwt_token');
    sessionStorage.removeItem('ngalam_auth_user');
    sessionStorage.removeItem('ngalam_jwt_token');
    document.cookie = 'ngalam_token=; path=/; max-age=0; SameSite=Lax';
  }, []);

  return (
    <AuthContext.Provider value={{ user, customer, loading, loginCustomer, logoutCustomer, loginStaff, logoutStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
