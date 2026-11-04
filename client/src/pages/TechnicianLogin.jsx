import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Wrench, Lock, User, AlertCircle,
  Maximize2, Minimize2, ArrowLeft, Eye, EyeOff,
  Clock, Cpu, ShieldCheck, LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './TechnicianLogin.css';

export default function TechnicianLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

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
            Portal login staf teknisi workshop Ngalam Fix Pro. Akses unit HP yang ditugaskan, update status 5 tahapan pengerjaan, dan pencatatan riwayat pergantian sparepart secara real-time.
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
            <span>Gunakan akun teknisi yang terdaftar atau akun <b>admin</b> untuk membuka meja lab.</span>
          </div>

          {/* Alert Notification Box */}
          {errorMsg && (
            <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', marginBottom: '18px', fontSize: '0.88rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} noValidate>
              <div className="auth-input-wrapper">
                <label htmlFor="loginIdentifier">Username Akun Teknisi *</label>
                <div className="auth-input-inner">
                  <span className="auth-input-icon"><User className="w-4 h-4" /></span>
                  <input
                    type="text"
                    id="loginIdentifier"
                    className="auth-input-control"
                    placeholder="Username teknisi atau admin"
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

          {/* Separation Notice */}
          <div className="auth-bottom-links">
            <div style={{ marginBottom: '8px' }}>
              <span>Akses Pimpinan &amp; Kasir? </span>
              <Link to="/admin/login" style={{ color: '#0284c7', fontWeight: 800 }}>
                Portal Admin ↗
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
