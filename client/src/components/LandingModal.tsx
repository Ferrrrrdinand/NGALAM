import React, { useState, useEffect } from 'react';

interface LandingModalProps {
  onClose: () => void;
  referralCode?: string;
}

export default function LandingModal({ onClose, referralCode }: LandingModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim()) {
      setError('Nama wajib diisi');
      return;
    }
    
    if (!phone.trim()) {
      setError('Nomor WhatsApp wajib diisi');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/register-initial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name.trim(), 
          phone: phone.trim(),
          ref: referralCode || localStorage.getItem('ngalam_affiliate_ref') || ''
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('ngalam_temp_user_id', data.tempUserId);
        localStorage.setItem('ngalam_user_referral_code', data.referralCode);
        if (data.referredByMitra) {
          localStorage.setItem('ngalam_affiliate_ref', data.referredByMitra);
        }
        onClose();
      } else {
        setError(data.message || 'Terjadi kesalahan. Silakan coba lagi.');
      }
    } catch (err) {
      setError('Koneksi gagal. Periksa internet Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-[fadeIn_0.3s_ease-out]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          aria-label="Tutup"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">👋</div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            Selamat Datang!
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Isi data Anda untuk melanjutkan ke dashboard
          </p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama lengkap"
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all"
              disabled={loading}
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Nomor WhatsApp
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all"
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {loading ? 'Menyimpan...' : 'Lanjutkan'}
          </button>
        </form>
        
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4">
          Dengan melanjutkan, Anda akan diminta login dengan Google untuk verifikasi akun
        </p>
      </div>
    </div>
  );
}
