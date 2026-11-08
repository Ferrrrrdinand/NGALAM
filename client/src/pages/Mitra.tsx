import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Bike, Store, Sparkles, CheckCircle2, 
  AlertCircle, Download, Copy, Check, LogOut,
  Smartphone, Wrench, Coins, ExternalLink, Lightbulb
} from 'lucide-react';
import { fetchApi, formatRp } from '../utils/api';
import './Mitra.css';

export default function Mitra() {
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [mitraSession, setMitraSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', message: '' }
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleAuthPending, setGoogleAuthPending] = useState(() => (
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('auth') === 'google'
  ));
  const [needsPhone, setNeedsPhone] = useState(false);
  const [profilePhone, setProfilePhone] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);

  // Form Login
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Form Register
  const [regForm, setRegForm] = useState({
    name: '',
    category: 'Mitra Kurir Ojek Online (Motor)',
    phone: '',
    username: '',
    password: '',
    email: ''
  });

  // QR Code & Link state
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalCommission: 0,
    totalOrders: 0,
    commissionRate: 10,
    orders: []
  });

  // Check stored session on mount
  useEffect(() => {
    const isGoogleCallback = new URLSearchParams(window.location.search).get('auth') === 'google';
    if (isGoogleCallback) return;
    try {
      const stored = localStorage.getItem('ngalam_mitra_session') || sessionStorage.getItem('ngalam_mitra_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.referralCode || parsed.username)) {
          setMitraSession(parsed);
        }
      }
    } catch (_) {}
  }, []);

  // Pulihkan sesi setelah redirect Google OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') !== 'google') return;

    const oauthError = params.get('error');
    if (oauthError) {
      const messages = {
        staff_account_exists: 'Email ini terdaftar sebagai akun staf. Gunakan email lain.',
        google_not_configured: 'Login Google belum dikonfigurasi di server.',
        invalid_state: 'Sesi login Google tidak valid. Silakan coba lagi.',
        token_exchange_failed: 'Gagal menukar kode otorisasi Google.',
        profile_fetch_failed: 'Gagal mengambil profil Google.'
      };
      setAlert({ type: 'error', message: messages[oauthError] || `Login Google gagal: ${oauthError}` });
      setGoogleAuthPending(false);
      window.history.replaceState({}, '', '/mitra');
      return;
    }

    setGoogleLoading(true);
    fetchApi('/api/mitra/auth/session')
      .then(({ ok, data }) => {
        if (ok && data.success && data.driver) {
          if (data.driver.needsPhone) {
            setNeedsPhone(true);
            setAlert({ type: 'success', message: 'Akun Google terhubung. Lengkapi nomor WhatsApp untuk mengaktifkan komisi.' });
          } else {
            setMitraSession(data.driver);
            localStorage.setItem('ngalam_mitra_session', JSON.stringify(data.driver));
            setAlert({ type: 'success', message: `Selamat datang Mitra, ${data.driver.name}!` });
          }
        } else {
          setAlert({ type: 'error', message: data.message || 'Sesi Google tidak valid. Silakan coba lagi.' });
        }
      })
      .catch(() => setAlert({ type: 'error', message: 'Gagal memulihkan sesi Google.' }))
      .finally(() => {
        setGoogleLoading(false);
        setGoogleAuthPending(false);
        window.history.replaceState({}, '', '/mitra');
      });
  }, []);

  // Generate QR Code when mitraSession is available
  useEffect(() => {
    if (!mitraSession?.referralCode) {
      setQrDataUrl('');
      return;
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ngalamfixpro.com';
    const targetUrl = `${origin}/?ref=${encodeURIComponent(mitraSession.referralCode)}`;

    QRCode.toDataURL(targetUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#064e3b',
        light: '#ffffff'
      }
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('[Mitra QR Error]', err));

    // Fetch live dashboard & order stats
    fetchApi(`/api/mitra/check?query=${encodeURIComponent(mitraSession.referralCode)}`)
      .then(({ ok, data }) => {
        if (ok && data.success && data.data) {
          const d = data.data;
          setDashboardStats({
            totalCommission: d.totalCommission || d.balance || 0,
            totalOrders: d.totalOrders || 0,
            commissionRate: d.commissionRate || 10,
            orders: d.referredOrders || []
          });
        }
      })
      .catch(() => {});
  }, [mitraSession]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);

    try {
      const res = await fetchApi('/api/mitra/login', {
        method: 'POST',
        body: {
          identifier: loginId.trim(),
          password: loginPassword.trim()
        }
      });

      if (res.ok && res.data.success && res.data.driver) {
        const driver = res.data.driver;
        setMitraSession(driver);
        localStorage.setItem('ngalam_mitra_session', JSON.stringify(driver));
        setAlert({ type: 'success', message: res.data.message || `Selamat datang Mitra, ${driver.name}!` });
      } else {
        setAlert({
          type: 'error',
          message: res.data.message || res.data.error || 'Username / No. WhatsApp atau kata sandi tidak cocok.'
        });
      }
    } catch {
      setAlert({ type: 'error', message: 'Gagal terhubung ke server autentikasi.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);

    try {
      const res = await fetchApi('/api/mitra/register', {
        method: 'POST',
        body: {
          name: regForm.name.trim(),
          category: regForm.category,
          phone: regForm.phone.trim(),
          username: regForm.username.trim(),
          password: regForm.password.trim(),
          email: regForm.email.trim()
        }
      });

      const driver = res.data.driver || res.data.mitra || res.data.data;
      if (res.ok && res.data.success && driver) {
        setMitraSession(driver);
        localStorage.setItem('ngalam_mitra_session', JSON.stringify(driver));
        setAlert({
          type: 'success',
          message: res.data.message || `Registrasi berhasil! Kode referral Anda: ${driver.referralCode}`
        });
      } else {
        setAlert({
          type: 'error',
          message: res.data.message || res.data.error || 'Pendaftaran akun mitra gagal.'
        });
      }
    } catch {
      setAlert({ type: 'error', message: 'Gagal terhubung ke server pendaftaran.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    window.location.href = '/api/mitra/auth/google';
  };

  const handleCompletePhone = async (e) => {
    e.preventDefault();
    setAlert(null);
    setPhoneLoading(true);
    try {
      const res = await fetchApi('/api/mitra/auth/complete-profile', {
        method: 'POST',
        body: { phone: profilePhone.trim() }
      });
      if (res.ok && res.data.success && res.data.driver) {
        const driver = res.data.driver;
        setMitraSession(driver);
        localStorage.setItem('ngalam_mitra_session', JSON.stringify(driver));
        setNeedsPhone(false);
        setAlert({ type: 'success', message: res.data.message || 'Profil mitra berhasil dilengkapi.' });
      } else {
        setAlert({ type: 'error', message: res.data.message || 'Gagal menyimpan nomor WhatsApp.' });
      }
    } catch {
      setAlert({ type: 'error', message: 'Gagal terhubung ke server.' });
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ngalam_mitra_session');
    sessionStorage.removeItem('ngalam_mitra_session');
    setMitraSession(null);
    setAlert({ type: 'success', message: 'Anda telah berhasil keluar dari akun mitra.' });
  };

  const handleCopyLink = () => {
    if (!mitraSession?.referralCode) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ngalamfixpro.com';
    const link = `${origin}/?ref=${encodeURIComponent(mitraSession.referralCode)}`;
    navigator.clipboard?.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="mitra-container">
      {googleAuthPending ? (
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>
          <div className="mitra-card" style={{ textAlign: 'center', padding: '36px 24px' }}>
            <Sparkles className="w-8 h-8 text-emerald-600" style={{ margin: '0 auto 12px' }} />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 8px', color: '#000000' }}>
              Menghubungkan Akun Google
            </h2>
            <p style={{ fontSize: '0.86rem', color: '#475569', margin: 0 }}>
              Memeriksa sesi mitra dan status nomor WhatsApp...
            </p>
          </div>
        </div>
      ) : needsPhone ? (
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>
          <div className="mitra-card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px', color: '#000000' }}>
              Lengkapi Nomor WhatsApp
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#475569', margin: '0 0 18px', lineHeight: 1.5 }}>
              Akun Google Anda sudah terhubung. Nomor WhatsApp wajib diisi untuk konfirmasi pencairan komisi dan notifikasi order.
            </p>
            {alert && (
              <div style={{
                padding: '12px 14px',
                borderRadius: '10px',
                marginBottom: '16px',
                fontSize: '0.85rem',
                background: alert.type === 'success' ? '#ecfdf5' : '#fef2f2',
                border: `1px solid ${alert.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                color: alert.type === 'success' ? '#065f46' : '#991b1b'
              }}>
                {alert.message}
              </div>
            )}
            <form onSubmit={handleCompletePhone}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>
                  Nomor WhatsApp Aktif <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="tel"
                  required
                  className="form-control-input"
                  placeholder="Contoh: 081234567899"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                />
              </div>
              <button type="submit" disabled={phoneLoading} className="btn-mitra-primary">
                <span>{phoneLoading ? 'Menyimpan...' : 'Simpan & Buka Dashboard Mitra'}</span>
              </button>
            </form>
          </div>
        </div>
      ) : !mitraSession ? (
        <div id="mitraAuthSection">
          {/* HERO BANNER & HEADER */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div className="mitra-hero-badge">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Bike className="w-4 h-4 text-emerald-600" />
                <Store className="w-4 h-4 text-emerald-600" />
                <span>PROGRAM RESMI KEMITRAAN & AFILIASI QR CODE</span>
              </span>
            </div>
            <h1 className="mitra-hero-title">
              Rekomendasikan Servis HP,<br />
              <span style={{ color: '#059669' }}>Dapatkan Komisi 10% Per Transaksi!</span>
            </h1>
            <p className="mitra-hero-desc">
              Khusus Mitra Driver Ojol (Gojek, Grab, Maxim, Shopee) dan Toko/Bengkel Rekanan Malang. Setiap mitra memiliki <strong>Kode Unik Otomatis</strong> & <strong>QR Code Pribadi</strong>. Pelanggan cukup scan QR Code Anda saat memesan servis, dan komisi otomatis masuk ke akun Anda!
            </p>
          </div>

          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '13px 16px',
                marginBottom: '14px',
                borderRadius: '12px',
                border: '1px solid #d1d5db',
                background: '#ffffff',
                color: '#111827',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: googleLoading ? 'wait' : 'pointer'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.3-.1-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.5 39.6 16.2 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.2 5.2C36.9 40.4 44 36 44 24c0-1.3-.1-2.3-.4-3.5z"/>
              </svg>
              <span>{googleLoading ? 'Menghubungkan...' : authTab === 'register' ? 'Daftar Cepat dengan Google' : 'Masuk / Daftar dengan Google'}</span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px' }}>ATAU AKUN MITRA</span>
              <span style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>

            {/* TAB TOGGLE */}
            <div style={{ display: 'flex', gap: '10px', background: '#f1f5f9', padding: '6px', borderRadius: '14px', marginBottom: '24px' }}>
              <button
                type="button"
                className={`auth-tab-btn ${authTab === 'login' ? 'active' : ''}`}
                onClick={() => { setAuthTab('login'); setAlert(null); }}
              >
                Masuk Akun Mitra
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${authTab === 'register' ? 'active' : ''}`}
                onClick={() => { setAuthTab('register'); setAlert(null); }}
              >
                Daftar Mitra Baru
              </button>
            </div>

            {/* ALERT BOX */}
            {alert && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  fontSize: '0.9rem',
                  lineHeight: 1.4,
                  background: alert.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  border: `1px solid ${alert.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                  color: alert.type === 'success' ? '#065f46' : '#991b1b'
                }}
              >
                {alert.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span><b>{alert.type === 'success' ? 'Berhasil: ' : 'Peringatan: '}</b>{alert.message}</span>
              </div>
            )}

            {/* FORM 1: LOGIN */}
            {authTab === 'login' && (
              <div className="mitra-card">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px', color: '#000000' }}>
                  Masuk ke Portal Mitra
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#000000', margin: '0 0 20px' }}>
                  Hanya akun mitra yang terdaftar resmi di database sistem yang dapat mengakses. Akun mitra juga dapat masuk ke portal pelanggan dengan kredensial yang sama.
                </p>

                <form onSubmit={handleLogin}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>
                      Username / No. WhatsApp / Kode Afiliasi
                    </label>
                    <input
                      type="text"
                      required
                      className="form-control-input"
                      placeholder="Contoh: mitra_andi atau 081234567811"
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>
                      Kata Sandi Akun
                    </label>
                    <input
                      type="password"
                      required
                      className="form-control-input"
                      placeholder="Masukkan kata sandi mitra"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </div>

                  <button type="submit" disabled={loading} className="btn-mitra-primary">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles className="w-4 h-4" />
                      <span>{loading ? 'Memvalidasi...' : 'Masuk ke Dashboard Mitra'}</span>
                    </span>
                  </button>
                </form>
              </div>
            )}

            {/* FORM 2: REGISTER */}
            {authTab === 'register' && (
              <div className="mitra-card">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px', color: '#000000' }}>
                  Pendaftaran Akun Mitra Baru
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#000000', margin: '0 0 20px' }}>
                  Kode unik afiliasi & QR Code akan <strong>dibuat secara otomatis</strong> dan langsung tersimpan di database sistem.
                </p>

                <form onSubmit={handleRegister}>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>
                      Nama Lengkap Mitra / Toko <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="form-control-input"
                      placeholder="Contoh: Budi Prasetyo (Gojek Lowokwaru)"
                      value={regForm.name}
                      onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                    />
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>
                      Kategori Mitra Armada <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      className="form-control-input"
                      value={regForm.category}
                      onChange={(e) => setRegForm({ ...regForm, category: e.target.value })}
                    >
                      <option value="Mitra Kurir Ojek Online (Motor)">Mitra Kurir Ojek Online (Motor)</option>
                      <option value="Mitra Driver Mobil / Antar-Jemput">Mitra Driver Mobil / Antar-Jemput</option>
                      <option value="Mitra Bengkel / Toko Aksesoris Rekanan">Mitra Bengkel / Toko Rekanan</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>
                      Nomor WhatsApp Aktif <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      autoComplete="tel"
                      className="form-control-input"
                      placeholder="Contoh: 081234567899"
                      value={regForm.phone}
                      onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    />
                    <small style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', marginTop: '4px' }}>
                      Digunakan untuk konfirmasi penarikan komisi & notifikasi order servis.
                    </small>
                  </div>

                   <div className="mitra-register-form-grid">
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>
                        Username Akun <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        autoComplete="username"
                        className="form-control-input"
                        placeholder="mitra_budi"
                        value={regForm.username}
                        onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>
                        Kata Sandi <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        autoComplete="new-password"
                        className="form-control-input"
                        placeholder="Minimal 6 karakter"
                        value={regForm.password}
                        onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>
                      Email (Opsional)
                    </label>
                    <input
                      type="email"
                      autoComplete="email"
                      className="form-control-input"
                      placeholder="budi@gmail.com"
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    />
                  </div>

                  <button type="submit" disabled={loading} className="btn-mitra-primary">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles className="w-4 h-4" />
                      <span>{loading ? 'Mendaftarkan...' : 'Buat Akun & Dapatkan QR Code'}</span>
                    </span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div id="mitraDashboardSection">
          {/* TOP BANNER */}
          <div className="mitra-card mitra-banner-card">
            <div className="mitra-banner-flex">
              <div className="mitra-banner-info">
                <div className="mitra-banner-icon">
                  <Bike className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="mitra-banner-badge-row">
                    <span style={{ background: '#10b981', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: '9999px', letterSpacing: '0.5px' }}>
                      MITRA RESMI TERDAFTAR
                    </span>
                    <span className="mitra-verified-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Terverifikasi di Database Mitra
                    </span>
                  </div>
                  <h2 className="mitra-banner-title">
                    {mitraSession.name || mitraSession.username}
                  </h2>
                  <p className="mitra-banner-sub">
                    {mitraSession.category || 'Mitra Afiliasi Workshop'} • WA: {mitraSession.phone || '-'}
                  </p>
                </div>
              </div>
              <div>
                <button type="button" onClick={handleLogout} className="mitra-logout-btn">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <LogOut className="w-4 h-4 text-emerald-800" /> Keluar Akun
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* GRID: QR CODE CARD & STATS */}
          <div className="mitra-dashboard-grid">
            {/* LEFT: QR CODE & AFFILIATE LINK */}
            <div className="qr-card">
              <div className="mitra-qr-tag">
                <span>SCAN LANGSUNG KE PESAN SERVIS</span>
              </div>
              <h3 className="mitra-qr-title">
                QR Code Afiliasi Anda
              </h3>
              <p className="mitra-qr-desc">
                Tunjukkan QR Code ini kepada pelanggan Anda atau tempel di motor/helm/toko Anda. Pelanggan cukup scan untuk masuk ke web Ngalam Fix Pro, dan saat memesan servis kode referral Anda otomatis terpasang!
              </p>

              <div className="qr-image-wrapper">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code Afiliasi Mitra" />
                ) : (
                  <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Membuat QR Code...</div>
                )}
              </div>

              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#000000', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Kode Unik Afiliasi Anda
                </div>
                <div className="code-pill">
                  {mitraSession.referralCode}
                </div>
              </div>

              {/* ACTIONS */}
              <div className="mitra-qr-actions">
                <div className="mitra-qr-input-row">
                  <input
                    type="text"
                    readOnly
                    className="form-control-input mitra-qr-input"
                    value={typeof window !== 'undefined' ? `${window.location.origin}/?ref=${mitraSession.referralCode}` : ''}
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="mitra-qr-copy-btn"
                  >
                    {copied ? 'Tersalin!' : 'Salin Link'}
                  </button>
                </div>
                {qrDataUrl && (
                  <a
                    href={qrDataUrl}
                    download={`QR_Afiliasi_${mitraSession.referralCode}.png`}
                    className="mitra-qr-download-btn"
                  >
                    <Download className="w-4 h-4 text-white" /> Unduh Gambar QR Code (PNG)
                  </a>
                )}
              </div>
            </div>

            {/* RIGHT: COMMISSION STATS & HOW IT WORKS */}
            <div>
              {/* METRIC STATS */}
              <div className="mitra-stats-grid">
                <div className="stat-metric-card" style={{ borderLeft: '4px solid #10b981' }}>
                  <div className="stat-metric-label">Total Komisi Didapat</div>
                  <div className="stat-metric-val" style={{ color: '#059669' }}>
                    {formatRp(dashboardStats.totalCommission)}
                  </div>
                  <small style={{ color: '#000000', fontSize: '0.75rem' }}>Tercatat di Database</small>
                </div>
                <div className="stat-metric-card" style={{ borderLeft: '4px solid #d4af37' }}>
                  <div className="stat-metric-label">Servis Tereferensi</div>
                  <div className="stat-metric-val" style={{ color: '#b45309' }}>
                    {dashboardStats.totalOrders}
                  </div>
                  <small style={{ color: '#000000', fontSize: '0.75rem' }}>Total unit smartphone</small>
                </div>
                <div className="stat-metric-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                  <div className="stat-metric-label">Tingkat Komisi Anda</div>
                  <div className="stat-metric-val" style={{ color: '#d97706' }}>
                    {dashboardStats.commissionRate}%
                  </div>
                  <small style={{ color: '#000000', fontSize: '0.75rem' }}>Dari total harga servis</small>
                </div>
              </div>

              {/* HOW IT WORKS STEP */}
              <div className="mitra-card mitra-section-card">
                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, margin: '0 0 14px', color: '#000000', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>Cara Kerja Komisi Afiliasi Ngalam Fix Pro</span>
                </h4>
                <div className="mitra-steps-grid">
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <Smartphone className="w-6 h-6 text-emerald-600" />
                    </div>
                    <strong style={{ fontSize: '0.85rem', color: '#000000', display: 'block', marginBottom: '4px' }}>
                      1. Pelanggan Scan QR
                    </strong>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#000000', lineHeight: 1.35 }}>
                      Pelanggan scan QR Code Anda dan formulir booking mendeteksi Anda sebagai mitra perekomendasi.
                    </p>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <Wrench className="w-6 h-6 text-amber-600" />
                    </div>
                    <strong style={{ fontSize: '0.85rem', color: '#000000', display: 'block', marginBottom: '4px' }}>
                      2. Teknisi Tangani Unit
                    </strong>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#000000', lineHeight: 1.35 }}>
                      Teknisi kami memperbaiki perangkat dengan garansi resmi (baterai 90 hari, servis lain 7–30 hari). Jasa servis tetap berjalan profesional.
                    </p>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <Coins className="w-6 h-6 text-emerald-600" />
                    </div>
                    <strong style={{ fontSize: '0.85rem', color: '#000000', display: 'block', marginBottom: '4px' }}>
                      3. Komisi 10% Otomatis
                    </strong>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#000000', lineHeight: 1.35 }}>
                      Komisi 10% langsung dihitung dan dicatat di database sistem.
                    </p>
                  </div>
                </div>
              </div>

              {/* REFERRED ORDERS TABLE */}
              <div className="mitra-card mitra-table-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#000000' }}>
                    Daftar Servis Pelanggan Afiliasi Anda
                  </h3>
                  <span style={{ fontSize: '0.8rem', background: '#ecfdf5', color: '#059669', fontWeight: 700, padding: '4px 10px', borderRadius: '9999px' }}>
                    {dashboardStats.orders.length} Unit
                  </span>
                </div>

                <div className="mitra-table-wrapper">
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#000000', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '10px 12px' }}>No. Tiket</th>
                        <th style={{ padding: '10px 12px' }}>Pelanggan</th>
                        <th style={{ padding: '10px 12px' }}>Smartphone</th>
                        <th style={{ padding: '10px 12px' }}>Status</th>
                        <th style={{ padding: '10px 12px' }}>Biaya Servis</th>
                        <th style={{ padding: '10px 12px', color: '#059669' }}>Komisi Anda</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardStats.orders.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                            Belum ada servis yang menggunakan kode afiliasi Anda. Bagikan QR Code Anda untuk mulai mendapatkan komisi!
                          </td>
                        </tr>
                      ) : (
                        dashboardStats.orders.map((o, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 700 }}>
                              {o.ticketId || o.id}
                            </td>
                            <td style={{ padding: '12px' }}>{o.customerName || '-'}</td>
                            <td style={{ padding: '12px' }}>{o.phoneType || o.device || '-'}</td>
                            <td style={{ padding: '12px' }}>
                              <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: '#f1f5f9' }}>
                                {o.status || 'Diproses'}
                              </span>
                            </td>
                            <td style={{ padding: '12px', fontWeight: 600 }}>{formatRp(o.totalCost || o.price || 0)}</td>
                            <td style={{ padding: '12px', fontWeight: 700, color: '#059669' }}>
                              {formatRp(Math.round((o.totalCost || o.price || 0) * 0.1))}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
