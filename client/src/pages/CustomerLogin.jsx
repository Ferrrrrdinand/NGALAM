import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { User, AlertCircle, Phone, Mail, Lock } from 'lucide-react';
import { fetchApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 34.8 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.5l6.3 5.3C37.1 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export default function CustomerLogin() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState('login'); // 'login' | 'register' | 'complete'
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [district, setDistrict] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { customer, loginCustomer, logoutCustomer } = useAuth();

  // Tangani redirect balik dari Google OAuth
  useEffect(() => {
    const auth = searchParams.get('auth');
    const mode = searchParams.get('mode') || searchParams.get('tab');
    const oauthError = searchParams.get('error');

    if (oauthError) {
      const messages = {
        access_denied: 'Login Google dibatalkan.',
        invalid_state: 'Sesi login Google tidak valid. Silakan coba lagi.',
        google_not_configured: 'Login Google belum dikonfigurasi di server.',
        token_exchange_failed: 'Gagal menukar kode otorisasi Google.',
        profile_fetch_failed: 'Gagal mengambil profil Google.',
        server_error: 'Terjadi kesalahan server saat login Google.'
      };
      setErrorMsg(messages[oauthError] || `Login Google gagal: ${oauthError}`);
      return;
    }

    if (auth === 'google') {
      setLoading(true);
      fetchApi('/api/customer/me')
        .then(({ ok, data }) => {
          if (ok && data.success && data.customer) {
            loginCustomer(data.customer, true);
            if (data.customer.needsPhone) setTab('complete');
          } else {
            setErrorMsg(data.message || 'Sesi Google tidak valid. Silakan login ulang.');
          }
        })
        .catch(() => setErrorMsg('Gagal memuat sesi Google.'))
        .finally(() => setLoading(false));
    } else if (mode === 'register') {
      setTab('register');
    }
  }, [searchParams, loginCustomer]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetchApi('/api/customer/login', {
        method: 'POST',
        body: { identifier: phone, pin, password: pin, rememberMe }
      });

      if (res.ok && res.data.success) {
        const cust = res.data.customer || res.data.data;
        loginCustomer(cust, rememberMe);
        if (cust?.needsPhone) setTab('complete');
      } else {
        setErrorMsg(res.data.error || res.data.message || 'Email/WhatsApp atau password salah.');
      }
    } catch {
      setErrorMsg('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetchApi('/api/customer/register', {
        method: 'POST',
        body: { name, phone, whatsapp: phone, email, district, pin, password: pin, rememberMe }
      });

      if (res.ok && res.data.success) {
        loginCustomer(res.data.customer || res.data.data, rememberMe);
      } else {
        setErrorMsg(res.data.error || res.data.message || 'Pendaftaran member gagal.');
      }
    } catch {
      setErrorMsg('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetchApi('/api/customer/complete-profile', {
        method: 'POST',
        body: { whatsapp: phone, district }
      });

      if (res.ok && res.data.success) {
        loginCustomer(res.data.customer, true);
        setTab('login');
        setPhone('');
      } else {
        setErrorMsg(res.data.message || 'Gagal menyimpan nomor WhatsApp.');
      }
    } catch {
      setErrorMsg('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  const needsPhone = customer && (!customer.whatsapp || customer.needsPhone === true);

  if (customer && !needsPhone) {
    return (
      <div className="wrap" style={{ maxWidth: '640px', marginTop: '60px', marginBottom: '80px' }}>
        <div className="card" style={{ padding: '36px', borderRadius: '24px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <User className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#000000' }}>Halo, {customer.name}!</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
            Member Pelanggan Aktif: <b>{customer.whatsapp || customer.phone}</b>
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px', textAlign: 'left' }}>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Wilayah:</span>
              <strong style={{ fontSize: '0.9rem', color: '#000000' }}>{customer.district || 'Malang'}</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Status Member:</span>
              <strong style={{ fontSize: '0.9rem', color: '#059669' }}>Garansi Lab Prioritas</strong>
            </div>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link to="/pesan-servis" className="btn full" style={{ padding: '12px', borderRadius: '12px' }}>
              <span>Booking Servis Baru ↗</span>
            </Link>
            <Link to={`/lacak?id=${customer.whatsapp || customer.phone}`} className="btn outline full" style={{ padding: '12px', borderRadius: '12px' }}>
              <span>Cek Riwayat Servis Saya ↗</span>
            </Link>
            <button
              onClick={logoutCustomer}
              style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600, marginTop: '8px' }}
            >
              Keluar dari Akun
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ maxWidth: '520px', marginTop: '60px', marginBottom: '80px' }}>
      <div className="card" style={{ padding: '36px 28px', borderRadius: '24px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div className="logo-badge" style={{ width: '56px', height: '56px', margin: '0 auto 12px', borderRadius: '14px', overflow: 'hidden' }}>
            <img src="/images/logo-ngalam-fix-pro.jpg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#000000' }}>
            {needsPhone ? 'Lengkapi Nomor WhatsApp' : tab === 'login' ? 'Masuk Portal Member Pelanggan' : 'Daftar Akun Member Baru'}
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
            {needsPhone
              ? 'Nomor WhatsApp wajib diisi agar kami dapat menghubungi Anda terkait servis.'
              : 'Pantau garansi unit 90 hari & riwayat servis HP di lab workshop kami'}
          </p>
        </div>

        {!needsPhone && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '10px 14px', marginBottom: '18px', fontSize: '0.83rem', color: '#166534', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span>Hanya ingin cek status perbaikan saat ini?</span>
            <Link to="/lacak" style={{ color: '#15803d', fontWeight: 800, textDecoration: 'underline' }}>
              Lacak Unit Cepat ↗
            </Link>
          </div>
        )}

        {!needsPhone && (
          <>
            <a
              href="/api/customer/auth/google"
              className="btn outline full"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px', borderRadius: '12px', fontWeight: 700, textDecoration: 'none' }}
            >
              <GoogleIcon />
              <span>{tab === 'register' ? 'Daftar Cepat dengan Google' : 'Masuk / Daftar dengan Google'}</span>
            </a>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '18px 0', color: '#94a3b8', fontSize: '0.78rem' }}>
              <span style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              <span>atau</span>
              <span style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>

            <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '14px', marginBottom: '22px' }}>
              <button
                type="button"
                onClick={() => { setTab('login'); setErrorMsg(''); }}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                  background: tab === 'login' ? '#ffffff' : 'transparent', color: '#000000',
                  fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                  boxShadow: tab === 'login' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                Masuk Member
              </button>
              <button
                type="button"
                onClick={() => { setTab('register'); setErrorMsg(''); }}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                  background: tab === 'register' ? '#ffffff' : 'transparent', color: '#000000',
                  fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                  boxShadow: tab === 'register' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                Daftar Baru
              </button>
            </div>
          </>
        )}

        {errorMsg && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '10px', fontSize: '0.82rem', marginBottom: '16px' }} className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {needsPhone ? (
          <form onSubmit={handleCompleteProfile}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#000000', marginBottom: '6px' }}>
                Nomor WhatsApp Aktif *
              </label>
              <div style={{ position: 'relative' }}>
                <Phone className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="tel"
                  required
                  className="form-control"
                  placeholder="08123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px 12px 40px', borderRadius: '12px', border: '1.5px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#000000', marginBottom: '6px' }}>
                Wilayah / Kecamatan (Opsional)
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Lowokwaru / Klojen / Sukun"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1' }}
              />
            </div>

            <button type="submit" className="btn full" disabled={loading} style={{ padding: '14px', borderRadius: '12px', fontWeight: 700 }}>
              <span>{loading ? 'Menyimpan...' : 'Simpan & Buka Dashboard ↗'}</span>
            </button>
            <button
              type="button"
              onClick={logoutCustomer}
              style={{ width: '100%', background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600, marginTop: '12px' }}
            >
              Keluar akun
            </button>
          </form>
        ) : tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#000000', marginBottom: '6px' }}>
                Email / Nomor WhatsApp *
              </label>
              <div style={{ position: 'relative' }}>
                <Mail className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="email@anda.com atau 08123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px 12px 40px', borderRadius: '12px', border: '1.5px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#000000', marginBottom: '6px' }}>
                Password *
              </label>
              <div style={{ position: 'relative' }}>
                <Lock className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  required
                  className="form-control"
                  placeholder="Masukkan password akun"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px 12px 40px', borderRadius: '12px', border: '1.5px solid #cbd5e1' }}
                />
              </div>
              <small style={{ color: '#94a3b8', fontSize: '0.74rem' }}>Akun lama tetap bisa memakai PIN tanda terima.</small>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.84rem', color: '#475569' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#2563eb', cursor: 'pointer' }}
                />
                <span>Ingat saya di perangkat ini</span>
              </label>
            </div>

            <button type="submit" className="btn full" disabled={loading} style={{ padding: '14px', borderRadius: '12px', fontWeight: 700 }}>
              <span>{loading ? 'Memvalidasi...' : 'Buka Dashboard Member ↗'}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#000000', marginBottom: '6px' }}>
                Nama Lengkap *
              </label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="Nama Lengkap Pemilik"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#000000', marginBottom: '6px' }}>
                Email *
              </label>
              <input
                type="email"
                required
                className="form-control"
                placeholder="email@anda.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#000000', marginBottom: '6px' }}>
                Nomor WhatsApp Aktif *
              </label>
              <input
                type="tel"
                required
                className="form-control"
                placeholder="08123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#000000', marginBottom: '6px' }}>
                Wilayah / Kecamatan Malang (Opsional)
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Lowokwaru / Klojen / Sukun"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#000000', marginBottom: '6px' }}>
                Password Akun (Minimal 6 Karakter) *
              </label>
              <input
                type="password"
                required
                minLength={6}
                className="form-control"
                placeholder="Buat password akun"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1' }}
              />
            </div>

            <button type="submit" className="btn full" disabled={loading} style={{ padding: '14px', borderRadius: '12px', fontWeight: 700 }}>
              <span>{loading ? 'Mendaftarkan...' : 'Daftar Member Sekarang ↗'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
