import React, { useState, useEffect } from 'react';
import {
  Gift,
  Tag,
  CheckCircle2,
  XCircle,
  Plus,
  Edit3,
  Trash2,
  Image as ImageIcon,
  RotateCcw,
  Percent,
  Calendar,
  Users,
  Check,
  ExternalLink,
  Eye,
  X,
  Sparkles,
  Upload,
  AlertCircle
} from 'lucide-react';
import { fetchApi, formatRp, formatDateId } from '../../utils/api';
import AdsSubTab from './AdsSubTab';

export interface PromoBanner {
  id: string;
  title: string;
  description?: string;
  badgeTag?: string;
  badgePill?: string;
  theme?: string;
  promoCode?: string;
  buttonText?: string;
  buttonLink?: string;
  image?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface PromoCode {
  id: string;
  code: string;
  name?: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minSpend?: number;
  maxDiscount?: number;
  validFrom?: string;
  validUntil?: string;
  usageLimit?: number;
  usedCount?: number;
  active: boolean;
  createdAt?: string;
  [key: string]: any;
}

interface PromosTabProps {
  promos: PromoBanner[];
  onRefresh?: () => void;
  setPromos?: React.Dispatch<React.SetStateAction<PromoBanner[]>>;
}

const PRESET_BANNER_IMAGES = [
  { label: 'Spesialis HP & Workshop Meja', path: 'images/spesialis-hp-banner.jpg' },
  { label: 'Promo Spesial Diskon 30%', path: 'images/promo-banner-1.jpg' },
  { label: 'Paket Bonus Tempered Glass 9H', path: 'images/promo-banner-tempered-glass.jpg' }
];

const THEME_OPTIONS = [
  { id: 'amber', label: 'Emas / Amber (Luxury)', pillBg: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  { id: 'red', label: 'Merah / Rose (Promo Panas)', pillBg: 'linear-gradient(135deg, #ef4444, #dc2626)' },
  { id: 'green', label: 'Hijau / Emerald (Hemat)', pillBg: 'linear-gradient(135deg, #10b981, #059669)' },
  { id: 'purple', label: 'Ungu / Violet (Spesial)', pillBg: 'linear-gradient(135deg, #7c3aed, #6366f1)' },
  { id: 'blue', label: 'Biru / Indigo (Teknisi)', pillBg: 'linear-gradient(135deg, #2563eb, #3b82f6)' },
  { id: 'cyan', label: 'Cyan / Teal (Flash Deal)', pillBg: 'linear-gradient(135deg, #06b6d4, #0284c7)' }
];

export default function PromosTab({ promos = [], onRefresh, setPromos }: PromosTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'banners' | 'ads' | 'vouchers'>('banners');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // --- BANNER MANAGEMENT STATE ---
  const [banners, setBanners] = useState<PromoBanner[]>(promos);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PromoBanner | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    description: '',
    badgeTag: '🔥 PROMO SPESIAL',
    badgePill: '🏷️ DISKON S/D 30%',
    theme: 'amber',
    promoCode: '',
    buttonText: 'Klaim Promo Servis ↗',
    buttonLink: '/pesan-servis',
    image: 'images/spesialis-hp-banner.jpg',
    active: true
  });
  const [imagePreview, setImagePreview] = useState<string>('');

  // --- VOUCHER MANAGEMENT STATE ---
  const [vouchers, setVouchers] = useState<PromoCode[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<PromoCode | null>(null);
  const [voucherForm, setVoucherForm] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 10,
    minSpend: 100000,
    maxDiscount: 100000,
    validUntil: '2026-12-31',
    usageLimit: 100,
    active: true
  });

  // Delete Confirm Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'banner' | 'voucher'; id: string; name: string } | null>(null);

  // Periodic background sync for banners and vouchers
  useEffect(() => {
    const pollTimer = setInterval(() => {
      fetchApi('/api/promos?all=true').then((res) => {
        if (res.ok && res.data && res.data.success && Array.isArray(res.data.data)) {
          setBanners(res.data.data);
          if (setPromos) setPromos(res.data.data);
        }
      }).catch(() => {});

      if (activeSubTab === 'vouchers') {
        fetchApi('/api/promo-codes/admin').then((res) => {
          if (res.ok && res.data && res.data.success && Array.isArray(res.data.data)) {
            setVouchers(res.data.data);
          }
        }).catch(() => {});
      }
    }, 6000);

    return () => clearInterval(pollTimer);
  }, [activeSubTab]);

  // Sync banners when props change
  useEffect(() => {
    if (promos && promos.length > 0) {
      setBanners(promos);
    }
  }, [promos]);

  // Load vouchers when switching to vouchers tab
  const loadVouchers = async () => {
    setLoadingVouchers(true);
    try {
      const res = await fetchApi('/api/promo-codes/admin');
      if (res.ok && res.data && res.data.success) {
        setVouchers(res.data.data || []);
      }
    } catch (err) {
      console.error('Error loading promo codes', err);
    } finally {
      setLoadingVouchers(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'vouchers') {
      loadVouchers();
    }
  }, [activeSubTab]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // --- BANNER ACTIONS ---
  const handleOpenAddBanner = () => {
    setEditingBanner(null);
    setBannerForm({
      title: '',
      description: '',
      badgeTag: '🔥 PROMO SPESIAL',
      badgePill: '🏷️ DISKON S/D 30%',
      theme: 'amber',
      promoCode: '',
      buttonText: 'Klaim Promo Servis ↗',
      buttonLink: '/pesan-servis',
      image: 'images/spesialis-hp-banner.jpg',
      active: true
    });
    setImagePreview('/images/spesialis-hp-banner.jpg');
    setBannerModalOpen(true);
  };

  const handleOpenEditBanner = (b: PromoBanner) => {
    setEditingBanner(b);
    setBannerForm({
      title: b.title || '',
      description: b.description || '',
      badgeTag: b.badgeTag || '🔥 PROMO SPESIAL',
      badgePill: b.badgePill || '✨ DEAL TERBAIK',
      theme: b.theme || 'amber',
      promoCode: b.promoCode || '',
      buttonText: b.buttonText || 'Klaim Promo ↗',
      buttonLink: b.buttonLink || '/pesan-servis',
      image: b.image || 'images/spesialis-hp-banner.jpg',
      active: b.active !== false
    });
    setImagePreview(
      b.image?.startsWith('http') || b.image?.startsWith('data:image')
        ? b.image
        : `/${(b.image || 'images/spesialis-hp-banner.jpg').replace(/^\//, '')}`
    );
    setBannerModalOpen(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast('error', 'Ukuran foto maksimal 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setBannerForm((prev) => ({ ...prev, image: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title.trim()) {
      showToast('error', 'Judul banner promo wajib diisi.');
      return;
    }

    try {
      if (editingBanner) {
        // Update
        const res = await fetchApi(`/api/promos/${editingBanner.id}`, {
          method: 'PUT',
          body: bannerForm
        });
        if (res.ok && res.data && res.data.success) {
          showToast('success', res.data.message || 'Banner promo berhasil diperbarui.');
          setBanners((prev) =>
            prev.map((item) => (item.id === editingBanner.id ? res.data.data : item))
          );
          if (setPromos) {
            setPromos((prev) =>
              prev.map((item) => (item.id === editingBanner.id ? res.data.data : item))
            );
          }
          localStorage.setItem('ngalam_banner_updated', String(Date.now()));
          setBannerModalOpen(false);
          onRefresh?.();
        } else {
          showToast('error', res.data?.error || 'Gagal memperbarui banner promo.');
        }
      } else {
        // Create new
        const res = await fetchApi('/api/promos', {
          method: 'POST',
          body: bannerForm
        });
        if (res.ok && res.data && res.data.success) {
          showToast('success', res.data.message || 'Banner promo baru berhasil ditambahkan.');
          setBanners((prev) => [...prev, res.data.data]);
          if (setPromos) setPromos((prev) => [...prev, res.data.data]);
          localStorage.setItem('ngalam_banner_updated', String(Date.now()));
          setBannerModalOpen(false);
          onRefresh?.();
        } else {
          showToast('error', res.data?.error || 'Gagal menambahkan banner promo.');
        }
      }
    } catch (err: any) {
      showToast('error', err.message || 'Terjadi kesalahan sistem.');
    }
  };

  const handleToggleBanner = async (id: string) => {
    try {
      const res = await fetchApi(`/api/promos/${id}/toggle`, {
        method: 'PATCH'
      });
      if (res.ok && res.data && res.data.success) {
        const updated = res.data.data;
        setBanners((prev) => prev.map((b) => (b.id === id ? updated : b)));
        if (setPromos) setPromos((prev) => prev.map((b) => (b.id === id ? updated : b)));
        localStorage.setItem('ngalam_banner_updated', String(Date.now()));
        showToast(
          'success',
          `Status banner diubah menjadi: ${updated.active ? 'Aktif Tayang' : 'Nonaktif'}`
        );
        onRefresh?.();
      } else {
        showToast('error', res.data?.error || 'Gagal mengubah status banner.');
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleResetBanners = async () => {
    if (!window.confirm('Reset semua banner promo ke pengaturan awal (3 banner standar)?')) {
      return;
    }
    try {
      const res = await fetchApi('/api/promos/reset', { method: 'POST' });
      if (res.ok && res.data && res.data.success) {
        showToast('success', 'Banner promo telah direset ke default.');
        setBanners(res.data.data || []);
        if (setPromos) setPromos(res.data.data || []);
        localStorage.setItem('ngalam_banner_updated', String(Date.now()));
        onRefresh?.();
      } else {
        showToast('error', res.data?.error || 'Gagal mereset banner promo.');
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // --- VOUCHER ACTIONS ---
  const handleOpenAddVoucher = () => {
    setEditingVoucher(null);
    setVoucherForm({
      code: '',
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: 15,
      minSpend: 150000,
      maxDiscount: 100000,
      validUntil: '2026-12-31',
      usageLimit: 100,
      active: true
    });
    setVoucherModalOpen(true);
  };

  const handleOpenEditVoucher = (v: PromoCode) => {
    setEditingVoucher(v);
    setVoucherForm({
      code: v.code || '',
      name: v.name || '',
      description: v.description || '',
      discountType: v.discountType || 'percentage',
      discountValue: v.discountValue || 10,
      minSpend: v.minSpend || 0,
      maxDiscount: v.maxDiscount || 0,
      validUntil: v.validUntil || '2026-12-31',
      usageLimit: v.usageLimit || 100,
      active: v.active !== false
    });
    setVoucherModalOpen(true);
  };

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherForm.code.trim()) {
      showToast('error', 'Kode voucher promo wajib diisi.');
      return;
    }

    try {
      if (editingVoucher) {
        const res = await fetchApi(`/api/promo-codes/${editingVoucher.id}`, {
          method: 'PATCH',
          body: voucherForm
        });
        if (res.ok && res.data && res.data.success) {
          showToast('success', res.data.message || 'Kode voucher berhasil diperbarui.');
          setVouchers((prev) =>
            prev.map((item) => (item.id === editingVoucher.id ? res.data.data : item))
          );
          localStorage.setItem('ngalam_promo_updated', String(Date.now()));
          setVoucherModalOpen(false);
        } else {
          showToast('error', res.data?.error || 'Gagal memperbarui voucher.');
        }
      } else {
        const res = await fetchApi('/api/promo-codes', {
          method: 'POST',
          body: voucherForm
        });
        if (res.ok && res.data && res.data.success) {
          showToast('success', res.data.message || 'Kode voucher baru berhasil dibuat.');
          setVouchers((prev) => [...prev, res.data.data]);
          localStorage.setItem('ngalam_promo_updated', String(Date.now()));
          setVoucherModalOpen(false);
        } else {
          showToast('error', res.data?.error || 'Gagal membuat voucher.');
        }
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleToggleVoucher = async (v: PromoCode) => {
    try {
      const res = await fetchApi(`/api/promo-codes/${v.id}`, {
        method: 'PATCH',
        body: { active: !v.active }
      });
      if (res.ok && res.data && res.data.success) {
        const updated = res.data.data;
        setVouchers((prev) => prev.map((item) => (item.id === v.id ? updated : item)));
        localStorage.setItem('ngalam_promo_updated', String(Date.now()));
        showToast('success', `Status voucher "${v.code}" diubah menjadi: ${updated.active ? 'Aktif' : 'Non-aktif'}`);
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Confirm delete execution
  const executeDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === 'banner') {
        const res = await fetchApi(`/api/promos/${deleteTarget.id}`, {
          method: 'DELETE'
        });
        if (res.ok && res.data && res.data.success) {
          showToast('success', `Banner promo "${deleteTarget.name}" berhasil dihapus.`);
          setBanners((prev) => prev.filter((b) => b.id !== deleteTarget.id));
          if (setPromos) setPromos((prev) => prev.filter((b) => b.id !== deleteTarget.id));
          localStorage.setItem('ngalam_banner_updated', String(Date.now()));
          onRefresh?.();
        } else {
          showToast('error', res.data?.error || 'Gagal menghapus banner.');
        }
      } else {
        const res = await fetchApi(`/api/promo-codes/${deleteTarget.id}`, {
          method: 'DELETE'
        });
        if (res.ok && res.data && res.data.success) {
          showToast('success', `Kode voucher "${deleteTarget.name}" berhasil dihapus.`);
          setVouchers((prev) => prev.filter((v) => v.id !== deleteTarget.id));
          localStorage.setItem('ngalam_promo_updated', String(Date.now()));
        } else {
          showToast('error', res.data?.error || 'Gagal menghapus voucher.');
        }
      }
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  const activeBannersCount = banners.filter((b) => b.active !== false).length;
  const activeVouchersCount = vouchers.filter((v) => v.active !== false).length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold animate-slideIn ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner Navigation & Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Pusat Manajemen Banner &amp; Diskon Promo
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Live Editor
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Kelola banner slider beranda, ganti foto promo, atur potongan harga, dan buat kupon voucher diskon yang siap diklaim oleh pelanggan.
          </p>
        </div>

        {/* Sub-Tab Navigation Switcher */}
        <div className="flex items-center gap-2 bg-slate-100/90 p-1 rounded-xl shrink-0 border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveSubTab('banners')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'banners'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
            <span>Banner Slider</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              {banners.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('ads')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'ads'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Iklan Beranda Bawah</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Live DB
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('vouchers')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'vouchers'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-amber-600" />
            <span>Katalog Voucher</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
              {vouchers.length}
            </span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: BANNER SLIDER HOMEPAGE */}
      {/* ======================================================== */}
      {activeSubTab === 'banners' && (
        <div className="space-y-4">
          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {activeBannersCount} Banner Aktif Tayang
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">{banners.length - activeBannersCount} Nonaktif / Draft</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetBanners}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-2xs"
                title="Reset banner ke 3 template bawaan"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset Bawaan</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAddBanner}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Banner Baru</span>
              </button>
            </div>
          </div>

          {/* Banner Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {banners.length === 0 ? (
              <div className="col-span-full bg-white p-16 rounded-2xl border border-slate-200/80 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto mb-3">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Belum ada banner promo</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Tambahkan banner pertama Anda agar muncul di slider beranda website utama.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddBanner}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Banner Sekarang
                </button>
              </div>
            ) : (
              banners.map((b, idx) => {
                const imgPath = b.image?.startsWith('http') || b.image?.startsWith('data:image')
                  ? b.image
                  : `/${(b.image || 'images/spesialis-hp-banner.jpg').replace(/^\//, '')}`;

                return (
                  <div
                    key={b.id || idx}
                    className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Banner Visual Image Preview */}
                      <div className="relative aspect-16/9 bg-slate-900 overflow-hidden border-b border-slate-100">
                        <img
                          src={imgPath}
                          alt={b.title}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/images/spesialis-hp-banner.jpg';
                          }}
                        />

                        {/* Badges Over Image */}
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-950/80 text-white backdrop-blur-xs border border-white/20">
                            {b.badgeTag || 'PROMO SPESIAL'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-mono">
                            {b.badgePill || 'PROMO'}
                          </span>
                        </div>

                        {/* Promo Code Float Pill */}
                        {b.promoCode && (
                          <div className="absolute bottom-2 left-2.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-slate-900/90 text-amber-300 px-2 py-0.5 rounded border border-amber-400/40 backdrop-blur-xs">
                              <Tag className="w-2.5 h-2.5" />
                              {b.promoCode}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content Section */}
                      <div className="p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-400 font-semibold">
                            ID: {b.id}
                          </span>

                          {/* Toggle Status Switch */}
                          <button
                            type="button"
                            onClick={() => handleToggleBanner(b.id)}
                            className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                              b.active !== false
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                            }`}
                            title="Klik untuk mengubah status tayang banner"
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                b.active !== false ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            ></span>
                            <span>{b.active !== false ? 'Aktif Tayang' : 'Non-aktif / Draft'}</span>
                          </button>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                          {b.title}
                        </h4>

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {b.description || 'Tidak ada deskripsi.'}
                        </p>

                        {/* CTA Link Preview */}
                        <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
                          <span className="truncate max-w-[170px]">
                            Tombol: <strong className="text-slate-700">{b.buttonText || 'Klaim'}</strong>
                          </span>
                          <span className="font-mono text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 truncate max-w-[120px]">
                            {b.buttonLink || '/pesan-servis'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditBanner(b)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:border-amber-400 hover:text-amber-800 transition-all shadow-2xs"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                        <span>Edit Banner</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({
                            type: 'banner',
                            id: b.id,
                            name: b.title
                          })
                        }
                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-white text-slate-400 border border-slate-200 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-all"
                        title="Hapus Banner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: IKLAN & SPONSOR BERANDA BAWAH (DATABASE IKLAN) */}
      {/* ======================================================== */}
      {activeSubTab === 'ads' && <AdsSubTab onToast={showToast} />}

      {/* ======================================================== */}
      {/* TAB 3: VOUCHER & KODE PROMO */}
      {/* ======================================================== */}
      {activeSubTab === 'vouchers' && (
        <div className="space-y-4">
          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {activeVouchersCount} Kode Promo Aktif
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">
                {vouchers.length - activeVouchersCount} Nonaktif / Expired
              </span>
            </div>

            <button
              type="button"
              onClick={handleOpenAddVoucher}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buat Kode Promo Baru</span>
            </button>
          </div>

          {/* Vouchers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vouchers.length === 0 ? (
              <div className="col-span-full bg-white p-16 rounded-2xl border border-slate-200/80 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto mb-3">
                  <Tag className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Belum ada kode promo</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Buat kode kupon diskon agar pelanggan dapat menggunakannya saat pesan servis.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddVoucher}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Buat Kode Promo
                </button>
              </div>
            ) : (
              vouchers.map((v) => {
                const isPercent = v.discountType === 'percentage';
                const discountFormatted = isPercent
                  ? `${v.discountValue}%`
                  : formatRp(v.discountValue);

                return (
                  <div
                    key={v.id}
                    className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-xs font-mono font-bold bg-amber-50 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-lg">
                          <Tag className="w-3.5 h-3.5 text-amber-600" />
                          {v.code}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleToggleVoucher(v)}
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                            v.active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              v.active ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          ></span>
                          <span>{v.active ? 'Aktif' : 'Non-aktif'}</span>
                        </button>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{v.name || v.code}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                          {v.description || 'Tidak ada keterangan voucher.'}
                        </p>
                      </div>

                      {/* Discount Details Box */}
                      <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200/60 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wide block">
                            Potongan Diskon
                          </span>
                          <span className="text-lg font-black text-amber-900 font-mono">
                            {discountFormatted}
                          </span>
                        </div>

                        {v.maxDiscount && isPercent && (
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 uppercase font-medium block">
                              Maksimal Diskon
                            </span>
                            <span className="text-xs font-bold text-slate-700 font-mono">
                              {formatRp(v.maxDiscount)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Meta Information */}
                      <div className="space-y-1 text-[11px] text-slate-500 pt-1">
                        <div className="flex items-center justify-between">
                          <span>Min. Transaksi Servis:</span>
                          <strong className="text-slate-700 font-mono">
                            {v.minSpend ? formatRp(v.minSpend) : 'Tanpa Minimum'}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Berlaku Hingga:</span>
                          <strong className="text-slate-700 font-mono">
                            {v.validUntil ? formatDateId(v.validUntil) : 'Selamanya'}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Kuota Pemakaian:</span>
                          <strong className="text-slate-700 font-mono">
                            {v.usedCount || 0} / {v.usageLimit || '∞'} kali
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Voucher Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditVoucher(v)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:border-amber-400 hover:text-amber-800 transition-all shadow-2xs"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                        <span>Edit Voucher</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({
                            type: 'voucher',
                            id: v.id,
                            name: v.code
                          })
                        }
                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-white text-slate-400 border border-slate-200 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-all"
                        title="Hapus Voucher"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TAMBAH / EDIT BANNER PROMO */}
      {/* ======================================================== */}
      {bannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-amber-200/80">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingBanner ? 'Edit Banner Promo Slider' : 'Tambah Banner Promo Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Banner akan langsung tampil pada slider hero beranda website pelanggan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBannerModalOpen(false)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveBanner} className="p-6 space-y-5">
              {/* Image Preview & Upload Box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Foto / Gambar Banner Slider
                </label>
                <div className="relative aspect-16/9 rounded-2xl bg-slate-900 overflow-hidden border-2 border-dashed border-amber-300 flex items-center justify-center group mb-2">
                  <img
                    src={imagePreview || '/images/spesialis-hp-banner.jpg'}
                    alt="Preview Banner"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/images/spesialis-hp-banner.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <label className="cursor-pointer px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold shadow-md hover:bg-amber-50 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-amber-600" />
                      <span>Unggah File Baru</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Preset Image Options */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-500 font-medium">Atau pilih gambar siap pakai:</span>
                  {PRESET_BANNER_IMAGES.map((preset) => (
                    <button
                      key={preset.path}
                      type="button"
                      onClick={() => {
                        setBannerForm((prev) => ({ ...prev, image: preset.path }));
                        setImagePreview(`/${preset.path}`);
                      }}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                        bannerForm.image === preset.path
                          ? 'bg-amber-100 text-amber-900 border-amber-400'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Judul Utama Banner <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Diskon Servis Hingga 30% Ganti Layar OLED & Baterai Original"
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Deskripsi Singkat Promo
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Dapatkan gratis pembersihan mesin sinar UV, cek diagnosa awal di meja transparan, dan jaminan garansi resmi (khusus baterai 90 hari, servis lain 7–30 hari)."
                    value={bannerForm.description}
                    onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              {/* Badges & Color Theme */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tag Badge Kiri Atas
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 🔥 PROMO SPESIAL BULAN INI"
                    value={bannerForm.badgeTag}
                    onChange={(e) => setBannerForm({ ...bannerForm, badgeTag: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Pill Badge Kanan Atas
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 🏷️ DISKON S/D 30%"
                    value={bannerForm.badgePill}
                    onChange={(e) => setBannerForm({ ...bannerForm, badgePill: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 text-slate-900"
                  />
                </div>
              </div>

              {/* Theme Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Aksen Tema Warna Banner
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {THEME_OPTIONS.map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setBannerForm({ ...bannerForm, theme: th.id })}
                      className={`p-2 rounded-xl text-left border flex items-center gap-2 transition-all ${
                        bannerForm.theme === th.id
                          ? 'bg-amber-50/80 border-amber-400 shadow-2xs font-bold text-amber-950'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full shrink-0 shadow-2xs"
                        style={{ background: th.pillBg }}
                      ></span>
                      <span className="text-xs truncate">{th.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Promo Code & Button Config */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kode Kupon (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="NGALAMPROMO30"
                    value={bannerForm.promoCode}
                    onChange={(e) =>
                      setBannerForm({ ...bannerForm, promoCode: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3.5 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl uppercase font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Teks Tombol CTA
                  </label>
                  <input
                    type="text"
                    placeholder="Klaim Promo Servis ↗"
                    value={bannerForm.buttonText}
                    onChange={(e) => setBannerForm({ ...bannerForm, buttonText: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Link Tujuan Tombol
                  </label>
                  <input
                    type="text"
                    placeholder="/pesan-servis atau Link WA"
                    value={bannerForm.buttonLink}
                    onChange={(e) => setBannerForm({ ...bannerForm, buttonLink: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Active Toggle Checkbox */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Status Tayang Banner</span>
                  <span className="text-[11px] text-slate-500">
                    Aktifkan agar banner otomatis tampil pada slider beranda
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bannerForm.active}
                    onChange={(e) => setBannerForm({ ...bannerForm, active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {/* Footer Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setBannerModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all"
                >
                  {editingBanner ? 'Simpan Perubahan Banner' : 'Terbitkan Banner Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TAMBAH / EDIT VOUCHER PROMO */}
      {/* ======================================================== */}
      {voucherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-amber-200/80">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingVoucher ? 'Edit Kode Kupon Promo' : 'Buat Kode Kupon Promo Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kupon dapat dimasukkan pelanggan pada form pesan servis untuk potongan harga.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVoucherModalOpen(false)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveVoucher} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kode Kupon Diskon <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: DISKON50, NGALAMHEMAT"
                  value={voucherForm.code}
                  onChange={(e) =>
                    setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase().trim() })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl font-mono font-bold uppercase text-slate-900 focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Promo / Judul Kupon
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Potongan Langsung Rp 50.000 Servis LCD"
                  value={voucherForm.name}
                  onChange={(e) => setVoucherForm({ ...voucherForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Keterangan Syarat &amp; Ketentuan
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Khusus untuk reparasi ganti layar LCD dan baterai di workshop."
                  value={voucherForm.description}
                  onChange={(e) => setVoucherForm({ ...voucherForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tipe Diskon
                  </label>
                  <select
                    value={voucherForm.discountType}
                    onChange={(e) =>
                      setVoucherForm({
                        ...voucherForm,
                        discountType: e.target.value as 'percentage' | 'fixed'
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal Tetap (Rp)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Besar Diskon {voucherForm.discountType === 'percentage' ? '(%)' : '(Rp)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={voucherForm.discountValue}
                    onChange={(e) =>
                      setVoucherForm({ ...voucherForm, discountValue: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Min Spend & Max Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Minimal Servis (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={voucherForm.minSpend}
                    onChange={(e) =>
                      setVoucherForm({ ...voucherForm, minSpend: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Maks. Diskon (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={voucherForm.maxDiscount}
                    onChange={(e) =>
                      setVoucherForm({ ...voucherForm, maxDiscount: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>
              </div>

              {/* Expiry Date & Usage Limit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Masa Berlaku Sampai
                  </label>
                  <input
                    type="date"
                    value={voucherForm.validUntil}
                    onChange={(e) =>
                      setVoucherForm({ ...voucherForm, validUntil: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Batas Kuota Pemakaian
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={voucherForm.usageLimit}
                    onChange={(e) =>
                      setVoucherForm({ ...voucherForm, usageLimit: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Status Kupon</span>
                  <span className="text-[11px] text-slate-500">
                    Kupon dapat langsung digunakan oleh pelanggan
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={voucherForm.active}
                    onChange={(e) => setVoucherForm({ ...voucherForm, active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setVoucherModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all"
                >
                  {editingVoucher ? 'Simpan Perubahan' : 'Terbitkan Kode Kupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: KONFIRMASI HAPUS */}
      {/* ======================================================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-rose-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Hapus {deleteTarget.type === 'banner' ? 'Banner Promo' : 'Kode Voucher'}?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus <strong>"{deleteTarget.name}"</strong>? Aksi ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                Ya, Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
