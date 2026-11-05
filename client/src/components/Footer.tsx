import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, ShieldCheck, Bike } from 'lucide-react';
import logoImg from '../assets/images/logo-ngalam-fix-pro.jpg';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footgrid">
        <div className="foot-col">
          <Link className="logo" to="/">
            <div className="logo-badge">
              <img 
                src={logoImg} 
                alt="Logo Ngalam Fix Pro" 
                className="brand-logo-img" 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/images/logo-ngalam-fix-pro.jpg";
                }}
              />
            </div>
            <span>Ngalam <b>Fix Pro</b></span>
          </Link>
          <p style={{ marginTop: '8px' }}>
            Pusat reparasi spesialis smartphone Android dan Apple iPhone terpercaya dengan standar pengerjaan profesional, suku cadang original bergaransi resmi, dan transparansi proses.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '10px', fontSize: '0.78rem', color: '#34d399' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }}></span>
            <span>Workshop Buka Hari Ini • Teknisi Standby</span>
          </div>
          <div className="foot-social-links">
            <a href="https://www.instagram.com/ngalam_fixpro?utm_source=ig_web_button_share_sheet&srtk=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="foot-social-btn ig" title="Instagram Resmi Ngalam Fix Pro (@ngalam_fixpro)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            <a href="https://www.tiktok.com/@ngalam_fix_pro" target="_blank" rel="noopener noreferrer" className="foot-social-btn tiktok" title="TikTok Resmi Ngalam Fix Pro (@ngalam_fix_pro)">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/></svg>
            </a>
            <a href="https://maps.app.goo.gl/q7oQM5TJbKacRHKj7" target="_blank" rel="noopener noreferrer" className="foot-social-btn maps" title="Google Maps & Review Ngalam FixPro">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg>
            </a>
            <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="foot-social-btn yt" title="YouTube Channel Ngalam Fix Pro TV">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
          </div>
        </div>

        <div className="foot-col">
          <strong>Layanan Utama HP</strong>
          <Link to="/layanan">Servis Apple iPhone (iOS)</Link>
          <Link to="/layanan">Servis Android (Samsung, Xiaomi dll)</Link>
          <Link to="/layanan">Ganti Layar OLED & AMOLED</Link>
          <Link to="/layanan">Ganti Baterai Original HP</Link>
          <Link to="/layanan">Reparasi Mesin Mati Total & IC</Link>
        </div>

        <div className="foot-col">
          <strong>Bantuan & Info</strong>
          <Link to="/pesan-servis">Formulir Pesan Servis</Link>
          <Link to="/lacak">Lacak Status Pengerjaan</Link>
          <Link to="/login">Masuk Akun Pelanggan</Link>
          <Link to="/mitra" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Bike style={{ width: '14px', height: '14px', color: '#10b981' }} />
            <span>Portal Mitra &amp; Afiliasi</span>
          </Link>
          <Link to="/admin/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck style={{ width: '14px', height: '14px', color: '#f59e0b' }} />
            <span>Portal Admin Workshop</span>
          </Link>
          <Link to="/kontak">Kebijakan Garansi Resmi Servis</Link>
        </div>

        <div className="foot-col">
          <strong>Hubungi Workshop</strong>
          <div className="foot-contact-item">
            <div>
              <span style={{ color: '#ffffff', fontWeight: 700, marginBottom: '8px', display: 'block' }}>Konsultasi &amp; Tanya Servis:</span>
              <a href="https://wa.me/6281330304321?text=Halo%20Ngalam%20Fix%20Pro,%20saya%20ingin%20tanya%20seputar%20servis%20HP" target="_blank" rel="noopener noreferrer" className="btn-wa-simple-footer" title="Chat WhatsApp Workshop">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                <span>Hubungi WhatsApp Kami ↗</span>
              </a>
            </div>
          </div>
          <div className="foot-contact-item">
            <i><Clock style={{ width: '16px', height: '16px', color: '#f59e0b' }} /></i>
            <div>
              <span style={{ color: '#ffffff', fontWeight: 700 }}>Jam Operasional:</span>
              <p>Senin – Minggu, 10.00 – 20.00 WIB</p>
            </div>
          </div>
          <div className="foot-contact-item">
            <i><MapPin style={{ width: '16px', height: '16px', color: '#f43f5e' }} /></i>
            <div>
              <span style={{ color: '#ffffff', fontWeight: 700 }}>Workshop Resmi:</span>
              <p>Jl. Galunggung, Gadingkasri, Kec. Klojen, Kota Malang (Ngalam FixPro)</p>
            </div>
          </div>
        </div>
      </div>
      <div className="foot-bottom">
        <div className="wrap">
          <p>© 2026 Ngalam Fix Pro. Hak Cipta Dilindungi. Solusi Cepat, Transparan, Bergaransi.</p>
        </div>
      </div>
    </footer>
  );
}
