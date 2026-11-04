import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Search, User, X, Home, 
  Smartphone, ClipboardList, MapPin, Bike, ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { customer } = useAuth();

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className="header">
        <div className="wrap nav">
          <Link className="logo" to="/">
            <div className="logo-badge">
              <img src="/images/logo-ngalam-fix-pro.jpg" alt="Logo Ngalam Fix Pro" className="brand-logo-img" />
            </div>
            <span>Ngalam <b>Fix Pro</b></span>
            {location.pathname === '/mitra' && (
              <span className="logo-pill" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#059669' }}>
                MITRA AFILIASI
              </span>
            )}
          </Link>

          <div className="navend">
            <Link className="navend-login navend-lacak" id="navLacakBtn" to="/lacak" title="Lacak Progres Unit Servis">
              <span className="flex items-center gap-1"><Search className="w-3.5 h-3.5" /> Lacak Unit</span>
            </Link>
            
            {customer ? (
              <Link className="navend-login" id="navLoginBtn" to="/login" title="Member Pelanggan">
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {customer.name || 'Member'}</span>
              </Link>
            ) : (
              <Link className="navend-login" id="navLoginBtn" to="/login" title="Masuk Akun Member Pelanggan">
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> Masuk</span>
              </Link>
            )}

            <Link className="btn small" to="/pesan-servis">
              <span>Pesan Servis</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>

            {/* Burger Toggle Button */}
            <button 
              type="button" 
              className={`menu-toggle-btn ${mobileMenuOpen ? 'active' : ''}`} 
              id="menuToggleBtn" 
              aria-label="Buka Menu Navigasi"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            <div className={`nav-dropdown-menu ${mobileMenuOpen ? 'show' : ''}`} id="navDropdownMenu">
              <div className="nav-dropdown-header">
                <span className="nav-dropdown-title">MENU NAVIGASI</span>
                <button type="button" className="nav-dropdown-close" id="navDropdownClose" onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="nav-dropdown-links">
                <Link 
                  to="/" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`nav-dropdown-item theme-beranda ${isActive('/') ? 'active' : ''}`} 
                  style={{ background: '#fffdf5', border: '1.5px solid #d4af37', boxShadow: '0 0 0 2px rgba(212, 175, 55, 0.4)' }}
                >
                  <span className="nav-dropdown-item-icon" style={{ background: '#fffbeb' }}>
                    <Home className="w-4 h-4 text-amber-600" />
                  </span>
                  <div className="nav-dropdown-item-text">
                    <strong style={{ color: '#000000' }}>Beranda</strong>
                    <small style={{ color: '#b45309' }}>Halaman utama & ringkasan</small>
                  </div>
                  {isActive('/') && <span className="nav-dropdown-active-dot"></span>}
                </Link>

                <Link 
                  to="/layanan" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`nav-dropdown-item theme-layanan ${isActive('/layanan') ? 'active' : ''}`} 
                  style={{ background: '#fffdf5', border: '1px solid #fef08a' }}
                >
                  <span className="nav-dropdown-item-icon" style={{ background: '#e0f2fe' }}>
                    <Smartphone className="w-4 h-4 text-sky-600" />
                  </span>
                  <div className="nav-dropdown-item-text">
                    <strong style={{ color: '#b45309' }}>Layanan Servis</strong>
                    <small style={{ color: '#000000' }}>Servis HP Android & iPhone</small>
                  </div>
                </Link>

                <Link 
                  to="/pesan-servis" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`nav-dropdown-item theme-pesan ${isActive('/pesan-servis') ? 'active' : ''}`} 
                  style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
                >
                  <span className="nav-dropdown-item-icon" style={{ background: '#dcfce7' }}>
                    <ClipboardList className="w-4 h-4 text-emerald-600" />
                  </span>
                  <div className="nav-dropdown-item-text">
                    <strong style={{ color: '#16a34a' }}>Pesan Servis</strong>
                    <small style={{ color: '#000000' }}>Booking perbaikan online</small>
                  </div>
                </Link>

                <Link 
                  to="/kontak" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`nav-dropdown-item theme-kontak ${isActive('/kontak') ? 'active' : ''}`} 
                  style={{ background: '#fff1f2', border: '1px solid #fecdd3' }}
                >
                  <span className="nav-dropdown-item-icon" style={{ background: '#ffe4e6' }}>
                    <MapPin className="w-4 h-4 text-rose-600" />
                  </span>
                  <div className="nav-dropdown-item-text">
                    <strong style={{ color: '#e11d48' }}>Kontak & Lokasi</strong>
                    <small style={{ color: '#000000' }}>Workshop & nomor telepon</small>
                  </div>
                </Link>

                <Link 
                  to="/lacak" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`nav-dropdown-item theme-lacak ${isActive('/lacak') ? 'active' : ''}`} 
                  style={{ background: '#eef2ff', border: '1px solid #c7d2fe' }}
                >
                  <span className="nav-dropdown-item-icon" style={{ background: '#e0e7ff' }}>
                    <Search className="w-4 h-4 text-indigo-600" />
                  </span>
                  <div className="nav-dropdown-item-text">
                    <strong style={{ color: '#4f46e5' }}>Lacak Status Perangkat</strong>
                    <small style={{ color: '#000000' }}>Cek tiket progres servis real-time</small>
                  </div>
                </Link>

                <Link 
                  to="/login" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`nav-dropdown-item theme-member ${isActive('/login') ? 'active' : ''}`} 
                  style={{ background: '#faf5ff', border: '1px solid #e9d5ff' }}
                >
                  <span className="nav-dropdown-item-icon" style={{ background: '#f3e8ff' }}>
                    <User className="w-4 h-4 text-purple-600" />
                  </span>
                  <div className="nav-dropdown-item-text">
                    <strong style={{ color: '#9333ea' }}>Masuk Akun Pelanggan</strong>
                    <small style={{ color: '#000000' }}>Member portal & riwayat HP</small>
                  </div>
                </Link>
              </div>

              <div className="nav-dropdown-divider"></div>

              <div className="nav-dropdown-section">
                <span className="nav-dropdown-subtitle" style={{ color: '#000000', fontWeight: 800 }}>PORTAL MITRA & ADMIN</span>
                <Link 
                  to="/mitra" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="nav-dropdown-item theme-mitra" 
                  style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
                >
                  <span className="nav-dropdown-item-icon" style={{ background: '#dcfce7' }}>
                    <Bike className="w-4 h-4 text-emerald-600" />
                  </span>
                  <div className="nav-dropdown-item-text">
                    <strong style={{ color: '#059669' }}>Portal Mitra & QR Afiliasi</strong>
                    <small style={{ color: '#000000' }}>Komisi 10% & referral QR Code</small>
                  </div>
                </Link>

                <Link 
                  to="/admin/login" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="nav-dropdown-item theme-admin" 
                  style={{ background: '#fff1f2', border: '1px solid #fecdd3' }}
                >
                  <span className="nav-dropdown-item-icon" style={{ background: '#ffe4e6' }}>
                    <ShieldCheck className="w-4 h-4 text-rose-600" />
                  </span>
                  <div className="nav-dropdown-item-text">
                    <strong style={{ color: '#e11d48' }}>Portal Admin</strong>
                    <small style={{ color: '#000000' }}>Kelola operasional workshop</small>
                  </div>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Full-Page Backdrop Overlay (Placed outside header so it dims the entire viewport, not trapped by header's backdrop-filter) */}
      <div 
        className={`nav-backdrop ${mobileMenuOpen ? 'show' : ''}`} 
        id="navBackdrop"
        onClick={() => setMobileMenuOpen(false)}
      ></div>
    </>
  );
}
