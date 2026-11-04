import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Wrench, Lock, User, AlertCircle, CheckCircle2,
  Maximize2, Minimize2, ArrowLeft, Eye, EyeOff,
  Clock, Cpu, ShieldCheck, LogIn, Database, KeyRound, UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../utils/api';
import './TechnicianLogin.css';

export default function TechnicianLogin() {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regSpecialty, setRegSpecialty] = useState('Hardware & Board Micro-Soldering');
  const [regReferral, setRegReferral] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Clock & Fullscreen
  const [clockStr, setClockStr] = useState('Memuat Waktu...');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { loginStaff } = useAuth();
  const navigate = useNavigate();

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
      const res = await loginStaff(username.trim(), password, 'teknisi', '', rememberMe);
      if (res.success) {
        navigate('/teknisi');
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
      const data = await fetchApi('/api/auth/register-technician', {
        method: 'POST',
        body: JSON.stringify({
          name: regName.trim(),
          username: regUsername.trim(),
          password: regPassword,
          specialty: regSpecialty,
          referralCode: regReferral.trim()
        })
      });

      if (data.success) {
        setSuccessMsg(data.message || 'Pendaftaran teknisi berhasil! Silakan masuk meja kerja.');
        setActiveTab('login');
        setUsername(regUsername.trim());
        setPassword('');
      } else {
        setErrorMsg(data.message || data.error || 'Pendaftaran teknisi gagal.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem saat mendaftar.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="teknisi-fullscreen-container" id="fullscreenContainer">
      {/* LEFT SIDE: LAB WORKBENCH SHOWCASE & OVERVIEW */}
      <aside className="teknisi-showcase-panel">
        <div className="showcase-content">
          {/* Brand Header */}
          <div className="showcase-header">
            <Link className="showcase-brand" to="/">
              <img src="/images/logo-ngalam-fix-pro.jpg" alt="Logo Ngalam Fix Pro" className="showcase-logo-img" />
              <div>
                <div className="showcase-brand-name">Ngalam Fix Pro</div>
                <small style={{ color: '#000000', fontWeight: 800, fontSize: '0.76rem', letterSpacing: '0.05em' }}>
                  WORKSHOP HARDWARE LAB
                </small>
              </div>
            </Link>
            <span className="showcase-badge-pill">PORTAL KHUSUS TEKNISI</span>
          </div>

          {/* Headline */}
          <h1 className="showcase-hero-title">
            Meja Kerja Lab Spesialis.<br />
            <span className="showcase-gradient-text">Kelola Antrean &amp; Pengerjaan Unit.</span>
          </h1>
          <p className="showcase-desc">
            Sistem otentikasi mandiri staf teknisi workshop Ngalam Fix Pro. Akses unit HP yang ditugaskan, update status 5 tahapan pengerjaan, dan pencatatan riwayat pergantian sparepart secara real-time.
          </p>

          {/* Feature Cards */}
          <div className="showcase-cards">
            <div className="showcase-card">
              <div className="showcase-card-icon">
                <Wrench className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="showcase-card-title">Meja Lab &amp; Penugasan Real-Time</div>
                <p className="showcase-card-text">
                  Pantau antrean unit HP yang ditugaskan oleh Admin Meja 1 langsung di layar kerja lab tanpa perlu berkas fisik manual.
                </p>
              </div>
            </div>

            <div className="showcase-card">
              <div className="showcase-card-icon">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="showcase-card-title">5 Tahapan Servis Terintegrasi</div>
                <p className="showcase-card-text">
                  Kelola status: Diterima &rarr; Diagnosa &rarr; Tunggu Part &rarr; Dikerjakan &rarr; Selesai / Siap Diambil.
                </p>
              </div>
            </div>

            <div className="showcase-card">
              <div className="showcase-card-icon">
                <Cpu className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="showcase-card-title">Log Sparepart &amp; Catatan Teknis</div>
                <p className="showcase-card-text">
                  Pencatatan pergantian panel OLED, pemindahan IC TrueTone, kalibrasi Face ID, dan pembersihan ultrasonic.
                </p>
              </div>
            </div>
          </div>

          {/* Live Lab Status Widget */}
          <div className="showcase-status-bar">
            <div className="status-indicator">
              <span className="pulse-dot"></span>
              <span>Meja Lab Terhubung Real-Time</span>
            </div>
            <div className="live-clock-badge" id="liveClockDisplay">
              {clockStr}
            </div>
          </div>
        </div>

        {/* Left Panel Footer */}
        <div className="showcase-footer">
          <div>© 2026 Ngalam Fix Pro • Standar Lab Transparan Kota Malang</div>
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Lock className="w-3.5 h-3.5 text-emerald-600" /> Enkripsi Sesi Lab Terlindungi
            </span>
          </div>
        </div>
      </aside>

      {/* RIGHT SIDE: AUTHENTICATION FORM PANEL */}
      <main className="teknisi-auth-panel">
        {/* Top Utilities Toolbar */}
        <div className="auth-top-toolbar">
          <Link to="/" className="btn-toolbar-link">
            <ArrowLeft className="w-4 h-4" />
            <span>Ke Beranda Utama</span>
          </Link>
          <button 
            type="button" 
            className="btn-toolbar-link" 
            onClick={toggleFullscreen} 
            title="Beralih ke Layar Penuh"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}</span>
          </button>
        </div>

        {/* Centered Auth Card */}
        <div className="auth-box-container">
          <div style={{ textAlign: 'center', marginBottom: '22px' }}>
            <img 
              src="/images/logo-ngalam-fix-pro.jpg" 
              alt="Logo Ngalam Fix Pro" 
              style={{ width: '64px', height: '64px', borderRadius: '16px', margin: '0 auto 12px', display: 'block', border: '2px solid rgba(212, 175, 55, 0.6)', boxShadow: '0 8px 25px rgba(212, 175, 55, 0.25)' }} 
            />
            <h2 style={{ fontSize: '1.35rem', color: '#000000', margin: '0 0 6px', fontWeight: 800 }}>
              Otentikasi Teknisi Workshop Lab
            </h2>
            <p style={{ color: '#000000', fontSize: '0.86rem', margin: '0 0 10px', fontWeight: 600 }}>
              Silakan masukkan username dan kata sandi meja lab Anda.
            </p>
            <div id="techDbSyncPill" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}>
              <span id="techDbSyncDot" style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e' }}></span>
              <span>Meja Lab Siap &amp; Terhubung Database Terpadu</span>
            </div>
          </div>

          {/* Unified Desk Banner */}
          <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '12px', padding: '10px 14px', marginBottom: '18px', fontSize: '0.82rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Akses Teknisi Lab dapat langsung dibuka menggunakan akun <b>Admin / Owner</b>.</span>
          </div>

          {/* Alert Notification Box */}
          {errorMsg && (
            <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', marginBottom: '18px', fontSize: '0.88rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', marginBottom: '18px', fontSize: '0.88rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Toggle Tabs */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '14px', marginBottom: '22px', border: '1px solid #e2e8f0' }}>
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
              <span>Masuk Meja Kerja</span>
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
              <span>Registrasi Teknisi Baru</span>
            </button>
          </div>

          {/* LOGIN TAB */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} noValidate>
              <div className="auth-input-wrapper">
                <label htmlFor="loginIdentifier">Username Akun Teknisi *</label>
                <div className="auth-input-inner">
                  <span className="auth-input-icon"><User className="w-4 h-4" /></span>
                  <input
                    type="text"
                    id="loginIdentifier"
                    className="auth-input-control"
                    placeholder="Contoh: ferdinand / admin"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="auth-input-wrapper">
                <label htmlFor="loginPassword">Kata Sandi Meja Lab *</label>
                <div className="auth-input-inner">
                  <span className="auth-input-icon"><Lock className="w-4 h-4" /></span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="loginPassword"
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
                    title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', marginBottom: '22px', fontSize: '0.84rem', color: '#000000', flexWrap: 'wrap', gap: '8px', fontWeight: 600 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Ingat Sesi di Komputer Lab</span>
                </label>
                <span style={{ color: '#0284c7', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Lock className="w-3.5 h-3.5" /> Enkripsi SHA-256
                </span>
              </div>

              <button type="submit" disabled={loading} className="auth-submit-btn">
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Memvalidasi Sesi Lab...' : 'Buka Meja Kerja Teknisi'}</span>
              </button>
            </form>
          )}

          {/* REGISTER TAB */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} noValidate>
              <div className="auth-input-wrapper">
                <label htmlFor="regName">Nama Lengkap Teknisi *</label>
                <div className="auth-input-inner">
                  <span className="auth-input-icon"><User className="w-4 h-4" /></span>
                  <input
                    type="text"
                    id="regName"
                    className="auth-input-control"
                    placeholder="Contoh: Ferdinand / Teknisi Pro"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-input-wrapper">
                <label htmlFor="regUsername">Username Login *</label>
                <div className="auth-input-inner">
                  <span className="auth-input-icon"><Wrench className="w-4 h-4" /></span>
                  <input
                    type="text"
                    id="regUsername"
                    className="auth-input-control"
                    placeholder="Contoh: ferdinand"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-input-wrapper">
                <label htmlFor="regPassword">Kata Sandi (Password) *</label>
                <div className="auth-input-inner">
                  <span className="auth-input-icon"><Lock className="w-4 h-4" /></span>
                  <input
                    type="password"
                    id="regPassword"
                    className="auth-input-control"
                    placeholder="Minimal 6 karakter"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-input-wrapper">
                <label htmlFor="regSpecialty">Spesialisasi Lab *</label>
                <select
                  id="regSpecialty"
                  className="auth-input-control"
                  style={{ cursor: 'pointer', fontWeight: 700, color: '#000000', paddingLeft: '14px' }}
                  value={regSpecialty}
                  onChange={(e) => setRegSpecialty(e.target.value)}
                >
                  <option value="Hardware & Board Micro-Soldering">Hardware &amp; Board Micro-Soldering</option>
                  <option value="Spesialis Layar OLED & Glass OCA">Spesialis Layar OLED &amp; Glass OCA</option>
                  <option value="Spesialis Mesin Mati Total & IC">Spesialis Mesin Mati Total &amp; IC</option>
                  <option value="General Smartphone Hardware">General Smartphone Hardware</option>
                </select>
              </div>

              <div className="auth-input-wrapper" style={{ background: '#fffdf5', border: '1.5px dashed #d4af37', padding: '12px', borderRadius: '12px' }}>
                <label htmlFor="regReferral" style={{ color: '#000000', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <KeyRound className="w-4 h-4 text-amber-700" />
                  <span>Kode Referral Otorisasi Workshop *</span>
                </label>
                <input
                  type="text"
                  id="regReferral"
                  className="auth-input-control"
                  placeholder="KODE REFERRAL..."
                  value={regReferral}
                  onChange={(e) => setRegReferral(e.target.value)}
                  style={{ borderColor: '#d4af37', background: '#ffffff', letterSpacing: '1px', textTransform: 'uppercase', paddingLeft: '14px' }}
                />
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className="btn"
                style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 700, borderRadius: '14px', background: 'linear-gradient(135deg, #059669, #10b981)', color: '#ffffff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px', cursor: 'pointer' }}
              >
                <UserPlus className="w-4 h-4" />
                <span>{regLoading ? 'Memproses...' : 'Daftarkan Teknisi'}</span>
              </button>
            </form>
          )}

          {/* Separation Notice */}
          <div className="auth-bottom-links">
            <div style={{ marginBottom: '8px' }}>
              <span>Akses Pimpinan &amp; Kasir? </span>
              <Link to="/admin/login" style={{ color: '#0284c7', fontWeight: 800 }}>
                Portal Owner &amp; Admin ↗
              </Link>
            </div>
            <div>
              <span>Bukan Staf Workshop? </span>
              <Link to="/lacak" style={{ color: '#0f172a', fontWeight: 800 }}>
                Lacak Servis Pelanggan
              </Link>
            </div>
          </div>
        </div>

        <div style={{ height: '10px' }}></div>
      </main>
    </div>
  );
}
