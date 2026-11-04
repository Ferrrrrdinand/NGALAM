import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ShieldCheck, Lock, User, AlertCircle, CheckCircle2,
  Maximize2, Minimize2, ArrowLeft, Eye, EyeOff,
  Users, KeyRound, Shield, Zap, Building2, UserPlus, LogIn, ExternalLink, Wrench
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../utils/api';
import './AdminLogin.css';

export default function AdminLogin() {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  
  // Login Form State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regRole, setRegRole] = useState('admin');
  const [regReferral, setRegReferral] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Live Clock & Fullscreen State
  const [clockStr, setClockStr] = useState('Memuat Waktu...');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { loginStaff } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const updateClock = () => {
      try {
        const now = new Date();
        const options = { timeZone: 'Asia/Jakarta', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
        const timeStr = now.toLocaleTimeString('id-ID', options).replace(/\./g, ':');
        setClockStr(`${timeStr} WIB`);
      } catch (_) {
        setClockStr('WIB');
      }
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);

    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('fullscreenchange', onFsChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await loginStaff(identifier.trim(), password, 'admin', '', rememberMe);
      if (res.success) {
        const redirect = searchParams.get('redirect') || '/admin';
        navigate(redirect);
      } else {
        setErrorMsg(res.error || 'Username atau password salah.');
      }
    } catch {
      setErrorMsg('Gagal terhubung ke server autentikasi.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setRegLoading(true);

    try {
      const data = await fetchApi('/api/auth/register-admin', {
        method: 'POST',
        body: JSON.stringify({
          name: regName.trim(),
          username: regUsername.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim(),
          password: regPassword,
          role: regRole,
          referralCode: regReferral.trim()
        })
      });

      if (data.success) {
        setSuccessMsg(data.message || 'Pendaftaran staf berhasil! Silakan masuk sistem.');
        setActiveTab('login');
        setIdentifier(regUsername.trim());
        setPassword('');
      } else {
        setErrorMsg(data.message || data.error || 'Pendaftaran staf gagal.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem saat mendaftar.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="admin-fullscreen-container" id="adminFullscreenRoot">
      {/* LEFT SIDE: WORKSHOP SHOWCASE & OPERATIONAL OVERVIEW */}
      <aside className="admin-showcase-panel">
        <div className="showcase-content">
          
          {/* Brand Logo & Pill */}
          <div className="showcase-header">
            <Link className="showcase-brand" to="/">
              <img src="/images/logo-ngalam-fix-pro.jpg" alt="Logo Ngalam Fix Pro" className="showcase-logo-img" />
              <div>
                <div className="showcase-brand-name">Ngalam Fix Pro</div>
                <small style={{ color: '#000000', fontWeight: 800, fontSize: '0.76rem', letterSpacing: '0.04em' }}>
                  PROFESSIONAL WORKSHOP SYSTEM
                </small>
              </div>
            </Link>
            <span className="showcase-badge">SUPER ADMIN &amp; OWNER</span>
          </div>

          {/* Hero Headline */}
          <div className="eyebrow-pill" style={{ marginBottom: '14px', background: '#fffdf5', border: '1.5px solid #d4af37', color: '#000000', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 800 }}>
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>PUSAT KENDALI SUPER ADMIN &amp; OWNER</span>
          </div>

          <h1 className="showcase-hero-title">
            Pusat Kontrol Operasional Bengkel.<br />
            <span className="showcase-gradient-text">Akses Khusus Super Admin &amp; Owner.</span>
          </h1>

          <p className="showcase-desc">
            Kelola pembukuan kas besar, analitik omset, master data teknisi lab, pengaturan sistem, dan pengawasan operasional servis HP Ngalam Fix Pro.
          </p>

          {/* Role Highlights */}
          <div className="showcase-cards">
            {/* Unified Lab & Front Desk Banner */}
            <div className="showcase-card" style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd' }}>
              <div className="showcase-card-icon" style={{ background: '#e0f2fe', color: '#0284c7', border: '1.5px solid #7dd3fc' }}>
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="showcase-card-title" style={{ color: '#0369a1' }}>Petugas Kasir &amp; Front Desk Meja 1</div>
                <p className="showcase-card-text" style={{ color: '#0c4a6e' }}>
                  Sistem Kasir POS &amp; Penerimaan Unit Walk-in kini terpadu langsung ke akun pimpinan workshop.
                </p>
              </div>
            </div>

            <div className="showcase-card">
              <div className="showcase-card-icon" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', borderColor: '#fde68a', color: '#b45309' }}>
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="showcase-card-title">Admin &amp; Workshop Super User</div>
                <p className="showcase-card-text">
                  Akses kontrol penuh seluruh sistem, pembukuan kas besar/omset, banner promosi, dan database teknisi.
                </p>
              </div>
            </div>
          </div>

          {/* Live Status Bar */}
          <div className="showcase-status-bar">
            <div className="status-indicator">
              <span className="pulse-dot"></span>
              <span>Server Workshop: Online &amp; Terhubung</span>
            </div>
            <div className="live-clock-badge" id="liveClockDisplay">
              {clockStr}
            </div>
          </div>

        </div>

        {/* Showcase Footer Badges */}
        <div className="showcase-footer">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            Enkripsi TLS 256-bit
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Dual-Role Session Guard
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Building2 className="w-3.5 h-3.5 text-blue-500" />
            Malang Workshop Center
          </span>
        </div>
      </aside>

      {/* RIGHT SIDE: AUTHENTICATION FORM PANEL */}
      <main className="admin-auth-panel">
        {/* Top Toolbar (Back Link + Fullscreen Toggle) */}
        <div className="auth-top-toolbar">
          <Link to="/" className="btn-toolbar-link">
            <ArrowLeft className="w-4 h-4" />
            <span>Ke Beranda</span>
          </Link>

          <button 
            type="button" 
            onClick={toggleFullscreen} 
            className={`btn-fullscreen-toggle ${isFullscreen ? 'active' : ''}`}
            title="Klik untuk mengaktifkan mode layar penuh (F11)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh'}</span>
          </button>
        </div>

        {/* Auth Card Container */}
        <div className="auth-card-container">
          {/* Card Header */}
          <div style={{ textAlign: 'center', marginBottom: '22px' }}>
            <img 
              src="/images/logo-ngalam-fix-pro.jpg" 
              alt="Logo Ngalam Fix Pro" 
              style={{ width: '68px', height: '68px', borderRadius: '18px', margin: '0 auto 12px', display: 'block', border: '2px solid rgba(212, 175, 55, 0.6)', boxShadow: '0 8px 25px rgba(212, 175, 55, 0.25)' }} 
            />
            <h2 style={{ fontSize: '1.35rem', color: '#000000', margin: '0 0 6px', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
              Otentikasi Super Admin &amp; Owner
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0, fontWeight: 600 }}>
              Masukkan kredensial akun Admin atau Owner untuk membuka kontrol sistem.
            </p>
          </div>

          {/* Toggle Tabs: Login vs Registrasi Staf */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '14px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: activeTab === 'login' ? '#ffffff' : 'transparent',
                color: activeTab === 'login' ? '#b45309' : '#64748b',
                boxShadow: activeTab === 'login' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <KeyRound className="w-4 h-4" />
              <span>Masuk Sistem</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: activeTab === 'register' ? '#ffffff' : 'transparent',
                color: activeTab === 'register' ? '#b45309' : '#64748b',
                boxShadow: activeTab === 'register' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrasi Staf Baru</span>
            </button>
          </div>

          {/* Portal Kasir Quick Switcher Banner */}
          <div style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: '12px', padding: '10px 14px', marginBottom: '18px', fontSize: '0.84rem', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck className="w-4 h-4 text-sky-600" /> Akses Terpadu Kasir Meja 1 &amp; Lab Teknisi
            </span>
            <span style={{ color: '#0284c7', fontWeight: 800, fontSize: '0.78rem' }}>2 Akun Pimpinan</span>
          </div>

          {/* Alert Messages */}
          {errorMsg && (
            <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', marginBottom: '18px', fontSize: '0.86rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', marginBottom: '18px', fontSize: '0.86rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* LOGIN TAB */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} noValidate>
              <div className="auth-input-wrapper">
                <label htmlFor="adminIdentifier">Username atau Email Akun *</label>
                <div className="auth-input-inner">
                  <span className="auth-input-icon">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    id="adminIdentifier"
                    className="auth-input-control"
                    placeholder="Masukkan username atau email"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="auth-input-wrapper">
                <label htmlFor="adminPassword">Kata Sandi (Password) *</label>
                <div className="auth-input-inner">
                  <span className="auth-input-icon">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="adminPassword"
                    className="auth-input-control"
                    placeholder="Masukkan kata sandi"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', marginBottom: '22px', fontSize: '0.86rem', color: '#000000', flexWrap: 'wrap', gap: '10px', fontWeight: 600 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)} 
                  />
                  <span>Ingat Sesi di Komputer Ini</span>
                </label>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#b45309', fontSize: '0.8rem', fontWeight: 800 }}>
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Akses Terenkripsi TLS 256-bit</span>
                </span>
              </div>

              <button type="submit" disabled={loading} className="auth-submit-btn">
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Memvalidasi Kredensial...' : 'Buka Akses Penuh Admin Super User'}</span>
              </button>
            </form>
          )}

          {/* REGISTER TAB */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} noValidate>
              <div className="auth-input-wrapper">
                <label htmlFor="regAdminName">Nama Lengkap Admin / Manager *</label>
                <div className="auth-input-inner">
                  <span className="auth-input-icon"><User className="w-4 h-4" /></span>
                  <input
                    type="text"
                    id="regAdminName"
                    className="auth-input-control"
                    placeholder="Contoh: Ferdinand / Super Admin"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="auth-input-wrapper">
                <label htmlFor="regAdminUser">Username Login *</label>
                <div className="auth-input-inner">
                  <span className="auth-input-icon"><Shield className="w-4 h-4" /></span>
                  <input
                    type="text"
                    id="regAdminUser"
                    className="auth-input-control"
                    placeholder="Contoh: admin atau owner"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="auth-input-wrapper">
                  <label htmlFor="regAdminEmail">Email (Opsional)</label>
                  <div className="auth-input-inner">
                    <input
                      type="email"
                      id="regAdminEmail"
                      className="auth-input-control"
                      style={{ paddingLeft: '14px' }}
                      placeholder="admin@ngalamfix.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div className="auth-input-wrapper">
                  <label htmlFor="regAdminPhone">No. WhatsApp (Opsional)</label>
                  <div className="auth-input-inner">
                    <input
                      type="tel"
                      id="regAdminPhone"
                      className="auth-input-control"
                      style={{ paddingLeft: '14px' }}
                      placeholder="081234567890"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      autoComplete="tel"
                    />
                  </div>
                </div>
              </div>

              <div className="auth-input-wrapper">
                <label htmlFor="regAdminPass">Kata Sandi (Password) *</label>
                <div className="auth-input-inner">
                  <span className="auth-input-icon"><Lock className="w-4 h-4" /></span>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    id="regAdminPass"
                    className="auth-input-control"
                    placeholder="Minimal 6 karakter"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    title={showRegPassword ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="auth-input-wrapper">
                <label htmlFor="regAdminRole">Peran / Hak Akses Staf *</label>
                <select
                  id="regAdminRole"
                  className="auth-input-control"
                  style={{ cursor: 'pointer', fontWeight: 700, color: '#000000', paddingLeft: '16px' }}
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                >
                  <option value="admin">Admin Super User (Akses &amp; Kontrol Penuh Seluruh Sistem)</option>
                  <option value="kasir">Kasir Meja 1 (Input Unit Servis &amp; Struk)</option>
                </select>
              </div>

              <div className="auth-input-wrapper" style={{ background: '#fffdf5', border: '1.5px dashed #d4af37', padding: '14px', borderRadius: '14px', marginTop: '10px' }}>
                <label htmlFor="regAdminReferral" style={{ color: '#000000', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <KeyRound className="w-4 h-4 text-amber-700" />
                  <span>Kode Referral Otorisasi Super Admin *</span>
                </label>
                <div className="auth-input-inner">
                  <input
                    type="text"
                    id="regAdminReferral"
                    className="auth-input-control"
                    placeholder="MASUKKAN KODE REFERRAL OTORISASI..."
                    value={regReferral}
                    onChange={(e) => setRegReferral(e.target.value)}
                    style={{ borderColor: '#d4af37', background: '#ffffff', letterSpacing: '1.5px', fontFamily: 'monospace', fontSize: '0.92rem', fontWeight: 700, textTransform: 'uppercase', color: '#000000', paddingLeft: '14px' }}
                  />
                </div>
                <small style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: '#78350f', fontSize: '0.78rem', fontWeight: 600 }}>
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>Calon pimpinan workshop wajib memasukkan kode referral otorisasi resmi untuk verifikasi keamanan.</span>
                </small>
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className="btn"
                style={{ width: '100%', padding: '14px', fontSize: '1.02rem', fontWeight: 700, borderRadius: '14px', background: 'linear-gradient(135deg, #059669, #10b981)', color: '#ffffff', border: 'none', boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '18px', cursor: 'pointer' }}
              >
                <UserPlus className="w-4 h-4" />
                <span>{regLoading ? 'Memproses Pendaftaran...' : 'Daftarkan Akun Staf Admin'}</span>
              </button>
            </form>
          )}

          {/* Bottom Separation Links */}
          <div className="auth-bottom-links">
            <div style={{ marginBottom: '10px' }}>
              <span>Petugas Kasir Front Desk? </span>
              <button 
                type="button" 
                onClick={() => { setActiveTab('login'); setIdentifier('admin'); }} 
                style={{ color: '#0284c7', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Login Kasir Meja 1 ↗
              </button>
            </div>
            <div>
              <span>Bukan Staf Workshop? </span>
              <Link to="/teknisi/login" style={{ color: '#0f172a', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Wrench className="w-3.5 h-3.5 text-amber-700" />
                <span>Login Teknisi</span>
              </Link>
              <span> atau </span>
              <Link to="/lacak" style={{ color: '#0f172a', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Lacak Servis Pelanggan</span>
              </Link>
            </div>
          </div>

        </div>

        <div style={{ height: '10px' }}></div>
      </main>
    </div>
  );
}
