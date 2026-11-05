import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Plus, Edit3, Trash2, CheckCircle2, XCircle, 
  ExternalLink, Eye, MousePointerClick, RefreshCw, Upload, Image as ImageIcon,
  Check, X, Link as LinkIcon, ShieldCheck
} from 'lucide-react';
import { fetchApi } from '../../utils/api';
import { AdItem } from '../../components/HomeAdBanner';

interface AdsSubTabProps {
  onToast: (type: 'success' | 'error', message: string) => void;
}

const PRESET_AD_IMAGES = [
  { label: 'Promo Spesial Diskon 30%', path: 'images/promo-banner-1.jpg' },
  { label: 'Paket Bonus Tempered Glass 9H', path: 'images/promo-banner-tempered-glass.jpg' },
  { label: 'Workshop Spesialis HP Meja', path: 'images/spesialis-hp-banner.jpg' }
];

export default function AdsSubTab({ onToast }: AdsSubTabProps) {
  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<AdItem | null>(null);

  const [form, setForm] = useState({
    title: '',
    headline: '',
    description: '',
    badge: '⚡ GARANSI SPESIAL 90 HARI',
    imageUrl: 'images/promo-banner-1.jpg',
    targetUrl: '/pesan-servis?problem=baterai',
    ctaText: 'Klaim Servis Baterai ↗',
    theme: 'gold' as 'gold' | 'emerald' | 'dark' | 'blue',
    location: 'home_under_steps',
    active: true
  });

  const [imagePreview, setImagePreview] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdItem | null>(null);

  const loadAds = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/api/ads/admin');
      if (res.ok && res.data && res.data.success && Array.isArray(res.data.data)) {
        setAds(res.data.data);
      }
    } catch (err) {
      console.error('Error loading ads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAds();
  }, []);

  const handleOpenAdd = () => {
    setEditingAd(null);
    setForm({
      title: '',
      headline: '',
      description: '',
      badge: '⚡ GARANSI SPESIAL 90 HARI',
      imageUrl: 'images/promo-banner-1.jpg',
      targetUrl: '/pesan-servis?problem=baterai',
      ctaText: 'Klaim Servis Baterai ↗',
      theme: 'gold',
      location: 'home_under_steps',
      active: true
    });
    setImagePreview('/images/promo-banner-1.jpg');
    setModalOpen(true);
  };

  const handleOpenEdit = (ad: AdItem) => {
    setEditingAd(ad);
    setForm({
      title: ad.title || '',
      headline: ad.headline || ad.title || '',
      description: ad.description || '',
      badge: ad.badge || '🔥 PROMO SPESIAL',
      imageUrl: ad.imageUrl || 'images/promo-banner-1.jpg',
      targetUrl: ad.targetUrl || '/pesan-servis',
      ctaText: ad.ctaText || 'Lihat Promo ↗',
      theme: (ad.theme as any) || 'gold',
      location: ad.location || 'home_under_steps',
      active: ad.active !== false
    });
    setImagePreview(
      ad.imageUrl?.startsWith('http') || ad.imageUrl?.startsWith('data:image')
        ? ad.imageUrl
        : `/${(ad.imageUrl || 'images/promo-banner-1.jpg').replace(/^\//, '')}`
    );
    setModalOpen(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      onToast('error', 'Ukuran foto maksimal 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setForm((prev) => ({ ...prev, imageUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() && !form.headline.trim()) {
      onToast('error', 'Judul atau headline iklan wajib diisi.');
      return;
    }

    try {
      if (editingAd) {
        const res = await fetchApi(`/api/ads/${editingAd.id}`, {
          method: 'PATCH',
          body: form
        });
        if (res.ok && res.data && res.data.success) {
          onToast('success', `Iklan "${form.title}" berhasil diperbarui di database!`);
          setModalOpen(false);
          loadAds();
        } else {
          onToast('error', res.data?.error || 'Gagal memperbarui iklan.');
        }
      } else {
        const res = await fetchApi('/api/ads', {
          method: 'POST',
          body: form
        });
        if (res.ok && res.data && res.data.success) {
          onToast('success', `Iklan baru "${form.title}" berhasil ditambahkan ke database!`);
          setModalOpen(false);
          loadAds();
        } else {
          onToast('error', res.data?.error || 'Gagal menambahkan iklan.');
        }
      }
    } catch (err: any) {
      onToast('error', err.message || 'Terjadi kesalahan sistem.');
    }
  };

  const handleToggle = async (ad: AdItem) => {
    try {
      const res = await fetchApi(`/api/ads/${ad.id}/toggle`, {
        method: 'PATCH'
      });
      if (res.ok && res.data && res.data.success) {
        onToast('success', `Status iklan "${ad.title}" diubah.`);
        setAds((prev) =>
          prev.map((item) => (item.id === ad.id ? { ...item, active: !item.active } : item))
        );
      } else {
        onToast('error', 'Gagal mengubah status iklan.');
      }
    } catch (err: any) {
      onToast('error', err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetchApi(`/api/ads/${deleteTarget.id}`, {
        method: 'DELETE'
      });
      if (res.ok && res.data && res.data.success) {
        onToast('success', `Iklan "${deleteTarget.title}" berhasil dihapus dari database.`);
        setAds((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      } else {
        onToast('error', 'Gagal menghapus iklan.');
      }
    } catch (err: any) {
      onToast('error', err.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  const activeCount = ads.filter((a) => a.active !== false).length;
  const totalClicks = ads.reduce((acc, a) => acc + (Number(a.clicksCount) || 0), 0);

  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-bold text-slate-800">
            Database Iklan PostgreSQL: {activeCount} Iklan Aktif
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs text-slate-500">
            Total {totalClicks} Klik Pelanggan
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadAds}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh Data Iklan"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Iklan Baru</span>
          </button>
        </div>
      </div>

      {/* Ads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ads.map((ad) => {
          const imgSrc = ad.imageUrl?.startsWith('http') || ad.imageUrl?.startsWith('data:image')
            ? ad.imageUrl
            : `/${(ad.imageUrl || 'images/promo-banner-1.jpg').replace(/^\//, '')}`;

          return (
            <div
              key={ad.id}
              className={`bg-white rounded-2xl border overflow-hidden shadow-xs flex flex-col justify-between transition-all ${
                ad.active ? 'border-amber-200/90 hover:border-amber-400' : 'border-slate-200 opacity-60'
              }`}
            >
              {/* Image & Badge Header */}
              <div className="relative aspect-16/9 bg-slate-900 overflow-hidden">
                <img
                  src={imgSrc}
                  alt={ad.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/images/promo-banner-1.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 shadow-xs">
                    {ad.badge || 'IKLAN SPESIAL'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ad.active
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {ad.active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>

                <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                  <h4 className="text-xs font-bold truncate drop-shadow-sm">{ad.title}</h4>
                  <span className="text-[10px] text-amber-300 font-mono block">Tema: {ad.theme || 'gold'}</span>
                </div>
              </div>

              {/* Body Info */}
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <strong className="text-xs font-bold text-slate-900 block leading-snug line-clamp-2">
                    {ad.headline}
                  </strong>
                  <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                    {ad.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <MousePointerClick className="w-3.5 h-3.5 text-amber-600" />
                      <strong>{ad.clicksCount || 0} Klik</strong>
                    </span>
                    <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                      CTA: {ad.ctaText || 'Lihat ↗'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleToggle(ad)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        ad.active
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {ad.active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(ad)}
                      className="p-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 cursor-pointer transition-colors"
                      title="Edit Iklan"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(ad)}
                      className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer transition-colors"
                      title="Hapus Iklan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Edit / Tambah Iklan */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>{editingAd ? 'Edit Iklan Database' : 'Buat Iklan Baru'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Singkat Iklan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Garansi Baterai 90 Hari"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Headline Utama (Tampil Besar) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ganti Baterai Original — Garansi Resmi 90 Hari Penuh!"
                  value={form.headline}
                  onChange={(e) => setForm({ ...form, headline: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi Penawaran / Benefit
                </label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan keuntungan promo iklan, pengerjaan cepat, suku cadang original..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Label Badge Promo
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: ⚡ GARANSI SPESIAL 90 HARI"
                    value={form.badge}
                    onChange={(e) => setForm({ ...form, badge: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tema Warna Desain
                  </label>
                  <select
                    value={form.theme}
                    onChange={(e) => setForm({ ...form, theme: e.target.value as any })}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 font-medium"
                  >
                    <option value="gold">Emas / Luxury Gold</option>
                    <option value="emerald">Hijau / Emerald</option>
                    <option value="dark">Gelap / Dark Sleek</option>
                    <option value="blue">Biru / Tech Blue</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teks Tombol Aksi (CTA)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Klaim Servis Baterai ↗"
                    value={form.ctaText}
                    onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Link Tujuan (Internal / WA)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: /pesan-servis atau WA"
                    value={form.targetUrl}
                    onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Gambar Iklan */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-slate-700">
                  Foto / Banner Iklan
                </label>

                {imagePreview && (
                  <div className="relative aspect-16/9 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 mb-2">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-dashed border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-amber-700" />
                    <span>Unggah File Foto Iklan</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Preset image buttons */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {PRESET_AD_IMAGES.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, imageUrl: p.path }));
                        setImagePreview(`/${p.path}`);
                      }}
                      className="text-[10px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="adActiveCheck"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="adActiveCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Aktifkan Iklan Sekarang di Beranda
                </label>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  {editingAd ? 'Simpan Perubahan' : 'Buat Iklan Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3">
            <h4 className="text-sm font-bold text-slate-900">Konfirmasi Hapus Iklan</h4>
            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin menghapus iklan <strong>"{deleteTarget.title}"</strong> dari database?
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
              >
                Hapus Iklan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

