import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PublicLayout from './components/PublicLayout';

// Pages
import Home from './pages/Home';
import Layanan from './pages/Layanan';
import PesanServis from './pages/PesanServis';
import Lacak from './pages/Lacak';
import Kontak from './pages/Kontak';
import Mitra from './pages/Mitra';
import CustomerLogin from './pages/CustomerLogin';
import AdminLogin from './pages/AdminLogin';

// Dashboard berat dimuat terpisah agar halaman publik lebih cepat
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

export default function App() {
  const location = useLocation();

  // Tangkap parameter referral link/scan QR secara global
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(location.search);
      const refParam = searchParams.get('ref') || searchParams.get('referral');
      if (refParam) {
        const cleanRef = refParam.trim().toUpperCase();
        // Cek apakah kode referral ini sudah pernah digunakan untuk booking di browser ini
        let used = [];
        try {
          used = JSON.parse(localStorage.getItem('ngalam_used_referrals') || '[]');
        } catch (_) {}

        if (Array.isArray(used) && used.includes(cleanRef)) {
          console.warn(`[Affiliate] Kode referral ${cleanRef} sudah pernah digunakan dan tidak valid lagi untuk pemesanan berikutnya.`);
        } else {
          localStorage.setItem('ngalam_affiliate_ref', cleanRef);
        }
      }
    } catch (_) {}
  }, [location.search]);

  return (
    <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Memuat dashboard...</div>}>
    <Routes>
      {/* Public Pages with Permanent Navbar, Footer, and Chatbot */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/index.html" element={<Navigate to="/" replace />} />
        <Route path="/layanan" element={<Layanan />} />
        <Route path="/pesan-servis" element={<PesanServis />} />
        <Route path="/lacak" element={<Lacak />} />
        <Route path="/kontak" element={<Kontak />} />
        <Route path="/mitra" element={<Mitra />} />
        <Route path="/login" element={<CustomerLogin />} />
      </Route>

      {/* Single Admin Auth Portal */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Single Admin Workspace */}
      <Route path="/admin" element={<AdminDashboard />} />

      {/* Legacy staff portal URLs now use the single admin portal */}
      <Route path="/kasir/login" element={<Navigate to="/admin/login" replace />} />
      <Route path="/teknisi/login" element={<Navigate to="/admin/login" replace />} />
      <Route path="/kasir" element={<Navigate to="/admin" replace />} />
      <Route path="/teknisi" element={<Navigate to="/admin" replace />} />

      {/* Catch-all redirect to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}
