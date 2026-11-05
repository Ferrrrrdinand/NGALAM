import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { User, AlertCircle, Phone, Mail, Lock, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { fetchApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/images/logo-ngalam-fix-pro.jpg';

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
  const [googleAuthPending, setGoogleAuthPending] = useState(() => (
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('auth') === 'google'
  ));
  const [errorMsg, setErrorMsg] = useState('');
  const { customer, loginCustomer, logoutCustomer } = useAuth();

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
        staff_account_exists: 'Email ini terdaftar sebagai akun staf. Gunakan portal staf.',
        customer_account_exists: 'Email ini sudah terdaftar pada akun lain.',
        server_error: 'Terjadi kesalahan server saat login Google.'
      };
      setErrorMsg(messages[oauthError] || `Login Google gagal: ${oauthError}`);
      setGoogleAuthPending(false);
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
        .finally(() => {
          setLoading(false);
          setGoogleAuthPending(false);
        });
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
        body: { phone, whatsapp: phone, email: phone, pin, password: pin, rememberMe }
      });

      if (res.ok && res.data.success) {
        loginCustomer(res.data.customer || res.data.data, rememberMe);
      } else {
        setErrorMsg(res.data.message || 'Nomor WhatsApp / Email atau Password salah.');
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

  if (googleAuthPending) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xl text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto">
            <User className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Menghubungkan Akun Google</h2>
          <p className="text-xs text-slate-500">Memeriksa sesi pelanggan dan status nomor WhatsApp...</p>
        </div>
      </div>
    );
  }

  if (customer && !needsPhone) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto shadow-inner">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Halo, {customer.name}!</h2>
            <p className="text-xs text-slate-500 mt-1">
              Member Pelanggan Aktif: <b className="text-slate-700">{customer.whatsapp || customer.phone}</b>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Wilayah:</span>
              <strong className="text-xs font-bold text-slate-800">{customer.district || 'Kota Malang'}</strong>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Status:</span>
              <strong className="text-xs font-bold text-emerald-600">Garansi Lab Prioritas</strong>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <Link 
              to="/pesan-servis" 
              className="w-full py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-md shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
            >
              <span>Booking Servis Baru</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              to={`/lacak?id=${customer.whatsapp || customer.phone}`} 
              className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              <span>Cek Riwayat Servis Saya</span>
            </Link>
            <button
              onClick={logoutCustomer}
              className="text-xs font-semibold text-rose-500 hover:text-rose-700 pt-2 transition-colors cursor-pointer"
            >
              Keluar dari Akun
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-500 shadow-md shadow-amber-500/20 p-1 bg-white">
    <img 
      src={logoImg} 
      alt="Logo Ngalam Fix Pro" 
      className="w-full h-full object-cover rounded-xl" 
      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/images/logo-ngalam-fix-pro.jpg"; }} 
    />
  </div>
</div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            {needsPhone ? 'Lengkapi Nomor WhatsApp' : tab === 'login' ? 'Masuk Portal Member' : 'Daftar Akun Member Baru'}
          </h1>
          <p className="text-xs text-slate-500">
            {needsPhone
              ? 'Nomor WhatsApp wajib diisi agar kami dapat menghubungi Anda terkait tiket servis.'
              : 'Pantau garansi resmi unit & riwayat servis HP di lab workshop kami'}
          </p>
        </div>

        {!needsPhone && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-center justify-between gap-2">
            <span>Hanya ingin cek status pengerjaan saat ini?</span>
            <Link to="/lacak" className="font-bold underline text-emerald-700 whitespace-nowrap">
              Lacak Unit ↗
            </Link>
          </div>
        )}

        {!needsPhone && (
          <div className="space-y-4">
            <a
              href="/api/customer/auth/google"
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-xs sm:text-sm font-bold text-slate-700 shadow-2xs flex items-center justify-center gap-2.5 transition-all"
            >
              <GoogleIcon />
              <span>{tab === 'register' ? 'Daftar Cepat dengan Google' : 'Masuk / Daftar dengan Google'}</span>
            </a>

            <div className="flex items-center gap-3 text-slate-400 text-xs">
              <span className="flex-1 h-px bg-slate-200"></span>
              <span>atau akun member</span>
              <span className="flex-1 h-px bg-slate-200"></span>
            </div>

            {/* Tab switch */}
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => { setTab('login'); setErrorMsg(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  tab === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Masuk Member
              </button>
              <button
                type="button"
                onClick={() => { setTab('register'); setErrorMsg(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  tab === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Daftar Baru
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Needs Phone Form */}
        {needsPhone ? (
          <form onSubmit={handleCompleteProfile} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nomor WhatsApp Aktif *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  placeholder="08123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Wilayah / Kecamatan Malang (Opsional)
              </label>
              <input
                type="text"
                placeholder="Lowokwaru / Klojen / Sukun"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-md transition-all"
            >
              <span>{loading ? 'Menyimpan...' : 'Simpan & Buka Dashboard ↗'}</span>
            </button>
            <button
              type="button"
              onClick={logoutCustomer}
              className="w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-600 pt-1"
            >
              Batal & Keluar
            </button>
          </form>
        ) : tab === 'login' ? (
          /* Login Form */
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Email / Nomor WhatsApp *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Email, WhatsApp, atau username"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Masukkan password akun"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Ingat saya di perangkat ini</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-md shadow-amber-500/25 transition-all"
            >
              <span>{loading ? 'Memvalidasi...' : 'Buka Dashboard Member ↗'}</span>
            </button>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nama Lengkap *
              </label>
              <input
                type="text"
                required
                placeholder="Nama Lengkap Anda"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                placeholder="email@anda.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nomor WhatsApp Aktif *
              </label>
              <input
                type="tel"
                required
                placeholder="08123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Wilayah / Kecamatan Malang (Opsional)
              </label>
              <input
                type="text"
                placeholder="Lowokwaru / Klojen / Sukun"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Password Akun (Min. 6 Karakter) *
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Buat password akun"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-md shadow-amber-500/25 transition-all pt-2"
            >
              <span>{loading ? 'Mendaftarkan...' : 'Daftar Member Sekarang ↗'}</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
