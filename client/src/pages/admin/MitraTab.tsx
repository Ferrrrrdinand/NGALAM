import React, { useState, useMemo } from 'react';
import { 
  Banknote, X, Users, Wallet, ArrowDownRight, 
  Edit3, Key, Phone, Eye, EyeOff, Search,
  QrCode, Printer, Download, Copy, Check, ExternalLink, ShieldCheck, Tag, Sparkles,
  FolderArchive, CheckSquare, Square, DownloadCloud, PlusCircle
} from 'lucide-react';
import { formatRp, fetchApi } from '../../utils/api';
import EditMitraModal from './EditMitraModal';
import QrStickerCard from '../../components/QrStickerCard';
import { downloadSingleMitraCard, downloadBulkMitraZip } from '../../utils/qrCardGenerator';

export default function MitraTab({
  mitras,
  loading,
  payoutModalMitra,
  setPayoutModalMitra,
  payoutAmount,
  setPayoutAmount,
  handlePayoutSubmit,
  onMitraUpdated,
  onRefresh
}: {
  mitras: any[];
  loading?: boolean;
  payoutModalMitra?: any;
  setPayoutModalMitra?: (m: any) => void;
  payoutAmount?: string;
  setPayoutAmount?: (amt: string) => void;
  handlePayoutSubmit?: (e: React.FormEvent) => void;
  onMitraUpdated?: (updated: any) => void;
  onRefresh?: () => void;
}) {
  const [editingMitra, setEditingMitra] = useState<any>(null);
  const [selectedQrMitra, setSelectedQrMitra] = useState<any>(null);
  const [showBatchPrintModal, setShowBatchPrintModal] = useState(false);
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string | null>(null);
  const [generatingBatch, setGeneratingBatch] = useState(false);

  const handleGenerateNext100Mitra = async () => {
    if (!confirm('Buat 100 slot akun Mitra Pre-Registered berikutnya ke database?')) return;
    setGeneratingBatch(true);
    try {
      const res = await fetchApi('/api/mitra/generate-batch', { method: 'POST' });
      if (res.ok && res.data && res.data.success) {
        alert(res.data.message || 'Berhasil menambahkan 100 slot mitra baru.');
        if (onRefresh) onRefresh();
      } else {
        alert('Gagal menambahkan slot mitra: ' + (res.data?.error || res.statusText || 'Terjadi kesalahan.'));
      }
    } catch (err: any) {
      console.error(err);
      alert('Terjadi kesalahan: ' + (err.message || 'Koneksi gagal.'));
    } finally {
      setGeneratingBatch(false);
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isPreGenerated = (m: any) => 
    String(m.id || '').startsWith('USR-MITRA-PRE-') || String(m.referralCode || '').startsWith('MITRA-');

  const isAssigned = (m: any) => 
    Boolean(m.phone && String(m.phone).trim() && !String(m.name || '').startsWith('Mitra Rekanan '));

  const preGeneratedList = useMemo(() => {
    return mitras
      .filter(isPreGenerated)
      .sort((a, b) => {
        const numA = parseInt(String(a.referralCode || a.id || '').replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(String(b.referralCode || b.id || '').replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      });
  }, [mitras]);

  const unassignedCount = preGeneratedList.filter((m) => !isAssigned(m)).length;

  const getMitraSortKey = (m: any): { isPre: boolean; num: number; code: string } => {
    const ref = String(m.referralCode || m.referral_code || '').toUpperCase().trim();
    const id = String(m.id || '').toUpperCase().trim();
    const username = String(m.username || '').toUpperCase().trim();
    const name = String(m.name || '').toUpperCase().trim();

    // Cek pola MITRA-001 s/d MITRA-999...
    const match = ref.match(/MITRA-(\d+)/) || id.match(/MITRA-PRE-(\d+)/) || username.match(/MITRA_PRE_(\d+)/) || name.match(/MITRA REKANAN (\d+)/);
    if (match) {
      return { isPre: true, num: parseInt(match[1], 10), code: ref };
    }
    return { isPre: false, num: 999999, code: ref || id };
  };

  const filteredMitras = useMemo(() => {
    return mitras
      .filter((m) => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return (
          (m.name && m.name.toLowerCase().includes(s)) ||
          (m.username && m.username.toLowerCase().includes(s)) ||
          (m.phone && m.phone.includes(s)) ||
          (m.referralCode && m.referralCode.toLowerCase().includes(s)) ||
          (m.plateNumber && m.plateNumber.toLowerCase().includes(s)) ||
          (s === 'unassigned' && isPreGenerated(m) && !isAssigned(m)) ||
          (s === 'pre' && isPreGenerated(m))
        );
      })
      .sort((a, b) => {
        const keyA = getMitraSortKey(a);
        const keyB = getMitraSortKey(b);

        // Jika keduanya adalah mitra berurutan MITRA-001 s/d MITRA-100+
        if (keyA.isPre && keyB.isPre) {
          return keyA.num - keyB.num;
        }
        // Jika salah satu mitra berurutan MITRA-..., prioritaskan MITRA-001 dst di atas
        if (keyA.isPre && !keyB.isPre) return -1;
        if (!keyA.isPre && keyB.isPre) return 1;

        // Fallback untuk custom mitra lainnya
        return String(a.name || '').localeCompare(String(b.name || ''));
      });
  }, [mitras, searchTerm]);

  const getBatchItems = () => {
    if (batchFilter === 'unassigned') {
      return preGeneratedList.filter((m) => !isAssigned(m));
    }
    if (batchFilter.startsWith('batch_')) {
      const idx = parseInt(batchFilter.replace('batch_', ''), 10);
      if (!isNaN(idx)) {
        return preGeneratedList.slice(idx * 25, (idx + 1) * 25);
      }
    }
    if (batchFilter === 'batch1') return preGeneratedList.slice(0, 25);
    if (batchFilter === 'batch2') return preGeneratedList.slice(25, 50);
    if (batchFilter === 'batch3') return preGeneratedList.slice(50, 75);
    if (batchFilter === 'batch4') return preGeneratedList.slice(75, 100);
    return preGeneratedList;
  };

  const getBookingUrl = (refCode: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ngalamfixpro.com';
    return `${origin}/pesan-servis?ref=${encodeURIComponent(refCode || '')}`;
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleDownloadAllZip = async () => {
    setDownloadingZip(true);
    setDownloadProgress(`Menyiapkan (0/${preGeneratedList.length})...`);
    try {
      const allMitras = preGeneratedList.map((m, idx) => ({
        index: idx + 1,
        referralCode: m.referralCode,
        id: m.id,
        name: m.name,
        phone: m.phone
      }));
      await downloadBulkMitraZip(
        allMitras, 
        `Koleksi_${preGeneratedList.length}_QR_Code_Mitra.zip`,
        (curr, total) => setDownloadProgress(`Memproses ${curr}/${total}...`)
      );
    } catch (err: any) {
      console.warn('Client-side ZIP failed, falling back to server-side ZIP generator...', err);
      setDownloadProgress('Mengunduh dari server...');
      window.location.href = '/api/mitra/download-qr-zip';
    } finally {
      setDownloadingZip(false);
      setDownloadProgress(null);
    }
  };

  const handleDownloadSelectedZip = async () => {
    if (selectedCodes.length === 0) {
      alert('Pilih minimal 1 QR code untuk diunduh dalam format ZIP.');
      return;
    }

    setDownloadingZip(true);
    const selectedList = preGeneratedList
      .filter((m) => selectedCodes.includes(m.referralCode))
      .map((m, idx) => ({
        index: idx + 1,
        referralCode: m.referralCode,
        id: m.id,
        name: m.name,
        phone: m.phone
      }));
    setDownloadProgress(`Menyiapkan (0/${selectedList.length})...`);
    try {
      await downloadBulkMitraZip(
        selectedList, 
        `QR_Code_Mitra_${selectedList.length}_Pilihan.zip`,
        (curr, total) => setDownloadProgress(`Memproses ${curr}/${total}...`)
      );
    } catch (err: any) {
      console.warn('Client-side ZIP failed, falling back to server-side ZIP generator...', err);
      setDownloadProgress('Mengunduh dari server...');
      window.location.href = `/api/mitra/download-qr-zip?codes=${encodeURIComponent(selectedCodes.join(','))}`;
    } finally {
      setDownloadingZip(false);
      setDownloadProgress(null);
    }
  };

  const toggleSelectCode = (code: string) => {
    setSelectedCodes((prev) => 
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const selectAllVisible = () => {
    const currentCodes = getBatchItems().map((m) => m.referralCode);
    const allSelected = currentCodes.length > 0 && currentCodes.every((c) => selectedCodes.includes(c));
    if (allSelected) {
      setSelectedCodes((prev) => prev.filter((c) => !currentCodes.includes(c)));
    } else {
      setSelectedCodes((prev) => Array.from(new Set([...prev, ...currentCodes])));
    }
  };

  const selectAll100 = () => {
    const all100Codes = preGeneratedList.map((m) => m.referralCode);
    setSelectedCodes(all100Codes);
  };

  const clearSelection = () => {
    setSelectedCodes([]);
  };

  const totalBalance = mitras.reduce((acc, m) => acc + (Number(m.balance) || 0), 0);
  const totalCommission = mitras.reduce((acc, m) => acc + (Number(m.totalCommission) || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-600" />
            <span>Manajemen Kredensial &amp; Komisi Mitra Driver / Rekanan</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Admin dapat melihat nomor WhatsApp, kata sandi, rekening, kode referral barcode, serta mengedit profil mitra secara langsung.
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, WhatsApp, plat, ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
          />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Mitra Aktif
            </span>
            <div className="text-2xl font-black text-slate-900">
              {mitras.length} Mitra
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Terverifikasi di database</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200/40">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">
              Saldo Siap Ditarik
            </span>
            <div className="text-2xl font-black text-emerald-700">
              {formatRp(totalBalance)}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Kewajiban kasir ke mitra</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-200/40">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block">
              Total Komisi Diberikan
            </span>
            <div className="text-2xl font-black text-slate-900">
              {formatRp(totalCommission)}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Akumulasi bagi hasil 5%</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200/40">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Banner 100 QR Code Pre-Generated */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-amber-500/15 border border-amber-300 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
              <Sparkles className="w-3 h-3" />
              {preGeneratedList.length} QR Code Siap Pakai
            </span>
            <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
              {preGeneratedList.length > 0 ? `${preGeneratedList[0].referralCode} s/d ${preGeneratedList[preGeneratedList.length - 1].referralCode}` : 'MITRA-001 s/d MITRA-100'}
            </span>
            {unassignedCount > 0 && (
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                {unassignedCount} Belum Ada Pemilik
              </span>
            )}
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-900">
            Koleksi Stiker QR Code Referral {preGeneratedList.length} Mitra Workshop
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Kode referral (<code>MITRA-...</code>) dan ID mitra terkunci permanen. Anda bisa langsung mencetak lembar stiker QR untuk dibagikan ke driver ojol atau toko rekanan, lalu input nama pemiliknya kapan saja saat mitra aktif.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
          <button
            type="button"
            onClick={handleGenerateNext100Mitra}
            disabled={generatingBatch}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md shadow-slate-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            title="Buat 100 slot akun mitra pre-registered baru ke database"
          >
            <PlusCircle className={`w-4 h-4 text-amber-400 ${generatingBatch ? 'animate-spin' : ''}`} />
            <span>{generatingBatch ? 'Membuat 100 Mitra...' : '+ Tambah 100 Mitra'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadAllZip}
            disabled={downloadingZip}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            title="Download seluruh file QR code dalam 1 arsip ZIP"
          >
            <FolderArchive className="w-4 h-4" />
            <span>{downloadProgress || (downloadingZip ? 'Menyiapkan...' : `Unduh Semua (${preGeneratedList.length}) ZIP`)}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowBatchPrintModal(true)}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak &amp; Pilih QR</span>
          </button>
          <button
            type="button"
            onClick={() => setSearchTerm(searchTerm === 'unassigned' ? '' : 'unassigned')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
              searchTerm === 'unassigned'
                ? 'bg-amber-100 text-amber-900 border-amber-400'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-amber-700" />
            <span>{searchTerm === 'unassigned' ? 'Tampilkan Semua' : 'Filter Belum Terisi'}</span>
          </button>
        </div>
      </div>

      {/* Mitra Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Tabel Data Kredensial, Rekening &amp; Komisi Mitra</h3>
            <p className="text-[11px] text-slate-500">Klik tombol Edit untuk memperbarui nama, nomor telepon, kata sandi, rekening, atau status mitra.</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 border border-amber-200/60 text-amber-800 rounded-lg">
            Menampilkan {filteredMitras.length} dari {mitras.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200/80 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Profil &amp; Username</th>
                <th className="py-3.5 px-4">Kontak &amp; Kata Sandi</th>
                <th className="py-3.5 px-4">Profesi / Kendaraan</th>
                <th className="py-3.5 px-4">Rekening / E-Wallet</th>
                <th className="py-3.5 px-4">Referral &amp; Saldo</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-amber-600 animate-spin"></div>
                      <span className="text-xs font-semibold text-slate-500">Memuat data mitra...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredMitras.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    {searchTerm ? 'Tidak ada mitra yang cocok dengan pencarian.' : 'Belum ada mitra driver / rekanan terdaftar.'}
                  </td>
                </tr>
              ) : (
                filteredMitras.map((m, idx) => {
                  const unwithdrawn = m.balance !== undefined ? m.balance : (m.totalCommission || 0);
                  const isPassRevealed = Boolean(revealedPasswords[m.id]);
                  const displayPassword = m.plainPassword || (m.password && !String(m.password).startsWith('$2') ? m.password : '');
                  const isHashed = Boolean(m.password && String(m.password).startsWith('$2'));

                  return (
                    <tr key={m.id || idx} className="hover:bg-amber-50/20 transition-colors">
                      {/* Profil & Username */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl shrink-0">{m.avatar || '🛵'}</span>
                          <div>
                            <strong className="text-slate-900 block text-xs font-bold leading-tight">{m.name}</strong>
                            <span className="text-[11px] font-mono text-amber-700 font-semibold block mt-0.5">@{m.username}</span>
                          </div>
                        </div>
                      </td>

                      {/* Kontak & Kata Sandi */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <a
                            href={`https://wa.me/62${String(m.phone || '').replace(/^0/, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                            title="Chat WhatsApp Mitra"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{m.phone || '-'}</span>
                          </a>

                          <div className="flex items-center gap-1.5">
                            <Key className="w-3 h-3 text-amber-600 shrink-0" />
                            {displayPassword ? (
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-[11px] font-bold bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded border border-amber-200">
                                  {isPassRevealed ? displayPassword : '••••••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => togglePasswordVisibility(m.id)}
                                  className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                                  title={isPassRevealed ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                                >
                                  {isPassRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                </button>
                              </div>
                            ) : isHashed ? (
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono" title="Terenkripsi Bcrypt. Klik tombol Edit untuk ubah kata sandi">
                                🔒 Terenkripsi Bcrypt
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-mono">-</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Profesi & Kendaraan */}
                      <td className="py-3.5 px-4">
                        <span className="text-slate-800 font-medium block text-xs">{m.category || m.vehicleType || 'Mitra Driver'}</span>
                        {m.plateNumber ? (
                          <span className="inline-block font-mono font-bold text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 mt-0.5">
                            {m.plateNumber}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 block mt-0.5">Tanpa Plat</span>
                        )}
                      </td>

                      {/* Rekening Bank */}
                      <td className="py-3.5 px-4">
                        {m.bankAccount ? (
                          <span className="text-xs font-semibold text-slate-800 block">
                            {m.bankAccount}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Belum diisi</span>
                        )}
                      </td>

                      {/* Referral & Saldo */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="font-mono font-bold bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded text-[11px] inline-block">
                            {m.referralCode}
                          </span>
                          {isPreGenerated(m) && (
                            <button
                              type="button"
                              onClick={() => setSelectedQrMitra(m)}
                              className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500 hover:bg-amber-600 text-white cursor-pointer shadow-2xs transition-all flex items-center gap-0.5"
                              title="Lihat Stiker QR Code"
                            >
                              <QrCode className="w-2.5 h-2.5" />
                              <span>QR</span>
                            </button>
                          )}
                        </div>
                        <div className="text-[11px]">
                          <span className="text-slate-500">Saldo: </span>
                          <strong className={unwithdrawn > 0 ? 'text-emerald-700 font-bold' : 'text-slate-500 font-medium'}>
                            {formatRp(unwithdrawn)}
                          </strong>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          String(m.status || '').toLowerCase().includes('aktif') || String(m.status || '').toLowerCase().includes('siaga')
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            String(m.status || '').toLowerCase().includes('aktif') || String(m.status || '').toLowerCase().includes('siaga')
                              ? 'bg-emerald-500'
                              : 'bg-amber-500'
                          }`} />
                          <span>{m.status || (isPreGenerated(m) && !isAssigned(m) ? 'Menunggu Aktivasi' : 'Siaga / Aktif')}</span>
                        </span>
                      </td>

                      {/* Aksi Admin */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedQrMitra(m)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs cursor-pointer shadow-2xs transition-all"
                            title="Lihat & Unduh QR Code Stiker Mitra"
                          >
                            <QrCode className="w-3.5 h-3.5 text-slate-700" />
                            <span>QR</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingMitra(m)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer shadow-2xs transition-all border ${
                              isPreGenerated(m) && !isAssigned(m)
                                ? 'border-amber-400 bg-amber-500 hover:bg-amber-600 text-white font-extrabold shadow-sm'
                                : 'border-amber-300 bg-amber-50/80 hover:bg-amber-100 text-amber-900 font-bold'
                            }`}
                            title={isPreGenerated(m) && !isAssigned(m) ? "Input pemilik akun mitra ini" : "Edit data & kata sandi mitra"}
                          >
                            <Edit3 className={`w-3.5 h-3.5 ${isPreGenerated(m) && !isAssigned(m) ? 'text-white' : 'text-amber-700'}`} />
                            <span>{isPreGenerated(m) && !isAssigned(m) ? "Input Pemilik" : "Edit"}</span>
                          </button>

                          {setPayoutModalMitra && setPayoutAmount && (
                            <button
                              disabled={unwithdrawn <= 0}
                              onClick={() => {
                                setPayoutModalMitra(m);
                                setPayoutAmount(String(unwithdrawn));
                              }}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium text-xs transition-all ${
                                unwithdrawn > 0
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-2xs'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              <Banknote className="w-3.5 h-3.5" />
                              <span>Cairkan</span>
                            </button>
                          )}
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

      {/* Modal Edit Mitra */}
      {editingMitra && (
        <EditMitraModal
          mitra={editingMitra}
          onClose={() => setEditingMitra(null)}
          onSuccess={(updated) => {
            if (onMitraUpdated) {
              onMitraUpdated(updated);
            }
          }}
        />
      )}

      {/* Modal Payout Kasir */}
      {payoutModalMitra && setPayoutModalMitra && setPayoutAmount && handlePayoutSubmit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Pencairan Saldo Komisi Mitra</span>
              </h3>
              <button
                onClick={() => setPayoutModalMitra(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Nama Mitra:</span>
                <strong className="text-slate-800">{payoutModalMitra.name} ({payoutModalMitra.category || 'Driver'})</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Rekening Tujuan:</span>
                <span className="font-mono font-medium text-slate-800">{payoutModalMitra.bankAccount || '-'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Saldo Tersedia:</span>
                <strong className="text-emerald-700 font-bold">{formatRp(payoutModalMitra.balance || 0)}</strong>
              </div>
            </div>

            <form onSubmit={handlePayoutSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nominal Dicairkan (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold font-mono">Rp</span>
                  <input
                    type="number"
                    required
                    min="1000"
                    max={payoutModalMitra.balance || 999999999}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-mono font-bold transition-all text-slate-900"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPayoutModalMitra(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs cursor-pointer transition-all"
                >
                  Konfirmasi Pencairan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Single QR Code Mitra */}
      {selectedQrMitra && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 border border-amber-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    Stiker QR Code Mitra
                  </h3>
                  <span className="text-[11px] font-mono text-amber-700 font-bold">
                    {selectedQrMitra.referralCode} • {selectedQrMitra.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedQrMitra(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Kartu Stiker Preview */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white text-center space-y-2.5 shadow-xl border border-amber-500/30">
              <div className="flex items-center justify-between text-[11px] text-amber-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">
                <span>Ngalam Fix Pro</span>
                <span className="bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded font-mono font-bold">
                  Mitra Resmi #{String(selectedQrMitra.referralCode || '').replace(/\D/g, '').padStart(3, '0')}
                </span>
              </div>

              <div className="mx-auto max-w-[280px]">
                <QrStickerCard
                  type="mitra"
                  numStr={String(selectedQrMitra.referralCode || '').replace(/\D/g, '').padStart(3, '0')}
                  qrId={selectedQrMitra.referralCode}
                  systemId={selectedQrMitra.id}
                  code={selectedQrMitra.referralCode}
                  targetUrl={getBookingUrl(selectedQrMitra.referralCode)}
                  name={selectedQrMitra.name}
                  phone={selectedQrMitra.phone}
                  showCheckbox={false}
                  onDownloadSingle={() => downloadSingleMitraCard(selectedQrMitra)}
                />
              </div>

              <div>
                <p className="text-[11px] text-slate-300">
                  {isAssigned(selectedQrMitra) ? (
                    <span className="text-emerald-400 font-bold">👤 Pemilik: {selectedQrMitra.name} ({selectedQrMitra.phone})</span>
                  ) : (
                    <span className="text-amber-300/90 italic">Belum Ada Pemilik (Stiker Siap Diberikan)</span>
                  )}
                </p>
              </div>
            </div>

            {/* Input Link Booking */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-600">Link Booking Referral</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={getBookingUrl(selectedQrMitra.referralCode)}
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-700"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(getBookingUrl(selectedQrMitra.referralCode))}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => downloadSingleMitraCard(selectedQrMitra)}
                className="py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs cursor-pointer text-center"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh PNG</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 px-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs cursor-pointer text-center"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Cetak</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const m = selectedQrMitra;
                  setSelectedQrMitra(null);
                  setEditingMitra(m);
                }}
                className="py-2.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isAssigned(selectedQrMitra) ? 'Edit' : 'Pemilik'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Batch Cetak 100 Stiker QR Code */}
      {showBatchPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full p-6 shadow-2xl space-y-5 my-6 animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4 no-print">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <Printer className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-black text-slate-900">
                    Cetak &amp; Unduh Koleksi QR Code 100 Mitra
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Pilih QR mana saja yang ingin diunduh dalam arsip ZIP, atau gunakan 1 tombol cepat untuk mendownload seluruh 100 QR.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* 1-Click Fast Download ALL 100 */}
                <button
                  type="button"
                  onClick={handleDownloadAllZip}
                  disabled={downloadingZip}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
                  title="Unduh seluruh 100 file QR code mitra sekaligus (.zip)"
                >
                  <FolderArchive className="w-4 h-4" />
                  <span>{downloadProgress || (downloadingZip ? 'Menyiapkan ZIP...' : 'Unduh Semua 100 (.ZIP)')}</span>
                </button>

                {/* Download Selected as ZIP */}
                <button
                  type="button"
                  onClick={handleDownloadSelectedZip}
                  disabled={selectedCodes.length === 0 || downloadingZip}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                    selectedCodes.length > 0 && !downloadingZip
                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                  title={selectedCodes.length > 0 ? `Unduh ${selectedCodes.length} file QR terpilih dalam file ZIP` : 'Pilih minimal 1 QR untuk mengunduh ZIP'}
                >
                  <DownloadCloud className={`w-4 h-4 ${downloadingZip ? 'animate-bounce' : ''}`} />
                  <span>{downloadProgress || `Unduh ZIP Terpilih (${selectedCodes.length})`}</span>
                </button>

                {/* Print Sheet */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-slate-900/20 cursor-pointer transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Stiker ({getBatchItems().length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowBatchPrintModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter Group Tabs (No Print) */}
            <div className="flex flex-wrap items-center justify-between gap-2 no-print">
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs">
                <button
                  type="button"
                  onClick={() => setBatchFilter('all')}
                  className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    batchFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({preGeneratedList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBatchFilter('unassigned')}
                  className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    batchFilter === 'unassigned' ? 'bg-white text-amber-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Belum Terisi ({unassignedCount})
                </button>
                {Array.from({ length: Math.ceil(preGeneratedList.length / 25) }).map((_, bIdx) => {
                  const bKey = `batch_${bIdx}`;
                  const fromNum = String(bIdx * 25 + 1).padStart(3, '0');
                  const toNum = String(Math.min((bIdx + 1) * 25, preGeneratedList.length)).padStart(3, '0');
                  const isCur = batchFilter === bKey || (bIdx === 0 && batchFilter === 'batch1') || (bIdx === 1 && batchFilter === 'batch2') || (bIdx === 2 && batchFilter === 'batch3') || (bIdx === 3 && batchFilter === 'batch4');
                  return (
                    <button
                      key={bKey}
                      type="button"
                      onClick={() => setBatchFilter(bKey)}
                      className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                        isCur ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {fromNum} - {toNum}
                    </button>
                  );
                })}
              </div>

              {/* Selection Controls Toolbar */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={selectAllVisible}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pilih Yang Tampil</span>
                </button>
                <button
                  type="button"
                  onClick={selectAll100}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer"
                >
                  Pilih Semua ({preGeneratedList.length})
                </button>
                {selectedCodes.length > 0 && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition-all cursor-pointer"
                  >
                    Batal ({selectedCodes.length})
                  </button>
                )}
                <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 font-extrabold border border-amber-200/60">
                  {selectedCodes.length} Dipilih
                </span>
              </div>
            </div>

            {/* Printable Grid Area */}
            <div id="mitra-batch-print-area" className="max-h-[66vh] overflow-y-auto p-2">
              <style>{`
                @media print {
                  body * {
                    visibility: hidden !important;
                  }
                  #mitra-batch-print-area, #mitra-batch-print-area * {
                    visibility: visible !important;
                  }
                  #mitra-batch-print-area {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    max-height: none !important;
                    overflow: visible !important;
                    padding: 0 !important;
                    margin: 0 !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                  .qr-sticker-card {
                    break-inside: avoid !important;
                    page-break-inside: avoid !important;
                    border: 1.5px dashed #000000 !important;
                  }
                }
              `}</style>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {getBatchItems().map((m) => {
                  const isSelected = selectedCodes.includes(m.referralCode);
                  const numStr = String(m.referralCode || '').replace(/\D/g, '').padStart(3, '0') || '001';

                  return (
                    <QrStickerCard
                      key={m.id}
                      type="mitra"
                      numStr={numStr}
                      qrId={m.referralCode}
                      systemId={m.id}
                      code={m.referralCode}
                      targetUrl={getBookingUrl(m.referralCode)}
                      name={m.name}
                      phone={m.phone}
                      isSelected={isSelected}
                      onToggleSelect={() => toggleSelectCode(m.referralCode)}
                      onDownloadSingle={() => downloadSingleMitraCard(m)}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
