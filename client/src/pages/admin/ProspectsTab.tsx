import React, { useState } from 'react';
import { 
  Users, Search, Phone, Calendar, ArrowRight, MessageCircle, 
  Trash2, RefreshCw, Sparkles, CheckCircle2, Clock, Share2, 
  ExternalLink, UserCheck, Wrench, ShieldCheck, Filter
} from 'lucide-react';
import { fetchApi, formatDateId } from '../../utils/api';

interface ProspectItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  referralCode?: string;
  referredByMitra?: string;
  registeredVia?: string;
  claimed?: boolean;
  claimedAt?: string;
  rawData?: any;
  createdAt: string;
}

interface ProspectsTabProps {
  prospects: ProspectItem[];
  loading?: boolean;
  onRefresh: () => void;
  onConvertToWalkin?: (prospect: { name: string; phone: string; referralCode?: string }) => void;
  onToast?: (type: 'success' | 'error', message: string) => void;
}

export default function ProspectsTab({
  prospects,
  loading,
  onRefresh,
  onConvertToWalkin,
  onToast
}: ProspectsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'today' | 'mitra' | 'unclaimed' | 'claimed'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Hitung statistik leads
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const todayCount = prospects.filter(p => {
    try {
      const pDate = p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : '';
      return pDate === todayStr;
    } catch (_) {
      return false;
    }
  }).length;

  const mitraCount = prospects.filter(p => Boolean(p.referredByMitra)).length;
  const claimedCount = prospects.filter(p => Boolean(p.claimed)).length;
  const unclaimedCount = prospects.length - claimedCount;

  // Filter list
  const filteredProspects = prospects.filter((p) => {
    // Filter search text
    const s = searchTerm.toLowerCase();
    const matchSearch = !s || (
      (p.name && p.name.toLowerCase().includes(s)) ||
      (p.phone && p.phone.includes(s)) ||
      (p.id && p.id.toLowerCase().includes(s)) ||
      (p.referralCode && p.referralCode.toLowerCase().includes(s)) ||
      (p.referredByMitra && p.referredByMitra.toLowerCase().includes(s))
    );

    if (!matchSearch) return false;

    // Filter status tab
    if (filterType === 'today') {
      try {
        const pDate = p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : '';
        return pDate === todayStr;
      } catch (_) {
        return false;
      }
    }
    if (filterType === 'mitra') return Boolean(p.referredByMitra);
    if (filterType === 'claimed') return Boolean(p.claimed);
    if (filterType === 'unclaimed') return !p.claimed;

    return true;
  });

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Yakin ingin menghapus data calon pelanggan "${name}" (${id})?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetchApi(`/api/admin/prospects/${id}`, { method: 'DELETE' });
      if (res.ok && res.data && res.data.success) {
        onToast?.('success', `Calon pelanggan ${name} berhasil dihapus.`);
        onRefresh();
      } else {
        onToast?.('error', res.data?.message || 'Gagal menghapus data calon pelanggan.');
      }
    } catch (_) {
      onToast?.('error', 'Terjadi kesalahan jaringan.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatWaUrl = (phone: string, name: string) => {
    let clean = (phone || '').replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    else if (!clean.startsWith('62')) clean = '62' + clean;

    const message = encodeURIComponent(
      `Halo Kak ${name}, salam hangat dari Ngalam Fix Pro (Workshop Spesialis Servis HP & iPhone Malang)! 👋\n\nTerima kasih sudah berkunjung ke website kami. Apakah ada kendala pada HP atau iPhone Kakak yang ingin dikonsultasikan? Teknisi lab kami siap membantu pengecekan dan estimasi biaya secara gratis.`
    );

    return `https://wa.me/${clean}?text=${message}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            <span>Log Calon Pelanggan (Leads Masuk Web)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Rekam jejak seluruh pengunjung yang memasukkan nama dan nomor WhatsApp saat pertama kali membuka website. Data ini tersimpan di database PostgreSQL dan siap di-follow up atau dikonversi menjadi antrean servis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Calon Pelanggan</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{prospects.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-blue-500" /> Tersimpan di Database
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Masuk Hari Ini</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{todayCount}</div>
          <div className="text-[11px] text-amber-700/80 mt-0.5 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Pengunjung Baru Hari Ini
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Referral Mitra Afiliasi</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{mitraCount}</div>
          <div className="text-[11px] text-emerald-700/80 mt-0.5 flex items-center gap-1">
            <Share2 className="w-3.5 h-3.5" /> Bawa Kode Referral
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Siap Follow Up</div>
          <div className="text-2xl font-black text-slate-800 mt-1">{unclaimedCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> {claimedCount} sudah jadi member
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({prospects.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'today'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Hari Ini ({todayCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('unclaimed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'unclaimed'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Belum Jadi Member ({unclaimedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('mitra')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'mitra'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Dari Mitra ({mitraCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('claimed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'claimed'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Sudah Member ({claimedCount})
          </button>
        </div>

        {/* Search Field */}
        <div className="relative min-w-[240px] md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, nomor WA, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
          />
        </div>
      </div>

      {/* Prospects Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Calon Pelanggan</th>
                <th className="py-3 px-4">WhatsApp / Kontak</th>
                <th className="py-3 px-4">Kode Referral / Sumber</th>
                <th className="py-3 px-4">Waktu Daftar</th>
                <th className="py-3 px-4">Status Akun</th>
                <th className="py-3 px-4 text-right">Aksi Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProspects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-slate-500">Tidak ada data calon pelanggan yang sesuai.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {searchTerm ? 'Coba ubah kata kunci pencarian Anda.' : 'Setiap pengunjung yang mengisi nama & WA pada modal web akan otomatis muncul di sini.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProspects.map((p) => {
                  const initials = (p.name || 'CP').slice(0, 2).toUpperCase();
                  const isClaimed = Boolean(p.claimed);

                  return (
                    <tr key={p.id} className="hover:bg-amber-50/30 transition-colors">
                      {/* Name & ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Phone / WA */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-mono font-bold text-slate-800 text-xs">{p.phone}</span>
                        </div>
                        {p.email && (
                          <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[180px]">{p.email}</div>
                        )}
                      </td>

                      {/* Source & Referral */}
                      <td className="py-3.5 px-4">
                        {p.referredByMitra ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                            <Share2 className="w-3 h-3 text-emerald-600" />
                            <span>Mitra: {p.referredByMitra}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span>{p.registeredVia || 'Landing Modal'}</span>
                          </span>
                        )}
                        {p.referralCode && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Ref: {p.referralCode}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{formatDateId(p.createdAt)}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isClaimed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Member Akun</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Prospek Baru</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* WhatsApp Chat Button */}
                          <a
                            href={formatWaUrl(p.phone, p.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[11px] transition-colors"
                            title="Chat WhatsApp untuk follow up penawaran servis"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Follow Up WA</span>
                          </a>

                          {/* Convert to Walkin Button */}
                          {onConvertToWalkin && (
                            <button
                              type="button"
                              onClick={() => onConvertToWalkin({
                                name: p.name,
                                phone: p.phone,
                                referralCode: p.referredByMitra || p.referralCode || ''
                              })}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-[11px] transition-colors cursor-pointer"
                              title="Pindahkan ke form Walk-in Meja 1 untuk daftarkan servis"
                            >
                              <Wrench className="w-3.5 h-3.5 text-amber-600" />
                              <span>Bikin Servis</span>
                            </button>
                          )}

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.name)}
                            disabled={deletingId === p.id}
                            className="p-1.5 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50"
                            title="Hapus calon pelanggan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
