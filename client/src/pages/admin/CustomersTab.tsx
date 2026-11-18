import React, { useState, useMemo } from 'react';
import { 
  UserCheck, Search, Phone, Mail, Key, Eye, EyeOff, Edit3, ShieldCheck, 
  ShoppingBag, MapPin, Tag, QrCode, Printer, FolderArchive, DownloadCloud, 
  X, CheckSquare, Square
} from 'lucide-react';
import { formatRp } from '../../utils/api';
import EditCustomerModal from './EditCustomerModal';
import MemberQrCardModal from '../../components/MemberQrCardModal';
import QrStickerCard from '../../components/QrStickerCard';
import { downloadSingleMemberCard, downloadBulkMemberZip } from '../../utils/qrCardGenerator';

interface CustomersTabProps {
  customers: any[];
  loading?: boolean;
  onCustomerUpdated?: (updated: any) => void;
}

export default function CustomersTab({
  customers,
  loading,
  onCustomerUpdated
}: CustomersTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [selectedCustomerQr, setSelectedCustomerQr] = useState<any>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // Batch Print & ZIP 100 Member state
  const [showBatchPrintModal, setShowBatchPrintModal] = useState(false);
  const [batchFilter, setBatchFilter] = useState<'all' | 'registered' | 'batch1' | 'batch2' | 'batch3' | 'batch4'>('all');
  const [selectedMemberCodes, setSelectedMemberCodes] = useState<string[]>([]);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // Koleksi 100 Slot Member QR (Pelanggan Terdaftar + Slot VIP Siaga)
  const memberList100 = useMemo(() => {
    const list = [];
    for (let i = 1; i <= 100; i++) {
      const numStr = String(i).padStart(3, '0');
      const existing = customers[i - 1];
      const memberCode = `MBR-${numStr}`;
      if (existing) {
        list.push({
          index: i,
          numStr,
          id: existing.id || `USR-CUST-PRE-${numStr}`,
          code: memberCode,
          name: existing.name || `Member Prioritas #${numStr}`,
          whatsapp: existing.whatsapp || existing.phone || '',
          phone: existing.phone || existing.whatsapp || '',
          district: existing.district || 'Kota Malang',
          status: existing.status || 'Aktif',
          isRegistered: true,
          original: existing
        });
      } else {
        list.push({
          index: i,
          numStr,
          id: `USR-MBR-PRE-${numStr}`,
          code: memberCode,
          name: `Member Baru #${numStr}`,
          whatsapp: '',
          phone: '',
          district: 'Kota Malang',
          status: 'Siap Digunakan',
          isRegistered: false,
          original: null
        });
      }
    }
    return list;
  }, [customers]);

  const toggleSelectMemberCode = (code: string) => {
    setSelectedMemberCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const getBatchMembers = () => {
    if (batchFilter === 'registered') return memberList100.filter((m) => m.isRegistered);
    if (batchFilter === 'batch1') return memberList100.slice(0, 25);
    if (batchFilter === 'batch2') return memberList100.slice(25, 50);
    if (batchFilter === 'batch3') return memberList100.slice(50, 75);
    if (batchFilter === 'batch4') return memberList100.slice(75, 100);
    return memberList100;
  };

  const handleDownloadAllMembersZip = async () => {
    setDownloadingZip(true);
    try {
      await downloadBulkMemberZip(
        memberList100.map((m) => ({
          index: m.index,
          id: m.id,
          name: m.name,
          whatsapp: m.whatsapp,
          phone: m.phone,
          district: m.district,
          status: m.status
        })),
        '100_QR_Code_Member_NgalamFixPro.zip'
      );
    } catch (err: any) {
      console.error(err);
      alert('Gagal membuat file ZIP member: ' + (err.message || 'Silakan coba lagi.'));
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleDownloadSelectedMembersZip = async () => {
    if (selectedMemberCodes.length === 0) {
      alert('Pilih minimal 1 QR member untuk diunduh.');
      return;
    }
    const selected = memberList100
      .filter((m) => selectedMemberCodes.includes(m.code))
      .map((m) => ({
        index: m.index,
        id: m.id,
        name: m.name,
        whatsapp: m.whatsapp,
        phone: m.phone,
        district: m.district,
        status: m.status
      }));

    setDownloadingZip(true);
    try {
      await downloadBulkMemberZip(selected, `QR_Member_${selected.length}_Pilihan.zip`);
    } catch (err: any) {
      console.error(err);
      alert('Gagal membuat file ZIP member: ' + (err.message || 'Silakan coba lagi.'));
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleSelectAllInBatch = () => {
    const currentCodes = getBatchMembers().map((m) => m.code);
    const allSelected = currentCodes.every((c) => selectedMemberCodes.includes(c));
    if (allSelected) {
      setSelectedMemberCodes((prev) => prev.filter((c) => !currentCodes.includes(c)));
    } else {
      setSelectedMemberCodes((prev) => Array.from(new Set([...prev, ...currentCodes])));
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredCustomers = customers.filter((c) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(s)) ||
      (c.username && c.username.toLowerCase().includes(s)) ||
      (c.whatsapp && c.whatsapp.includes(s)) ||
      (c.email && c.email.toLowerCase().includes(s)) ||
      (c.district && c.district.toLowerCase().includes(s)) ||
      (c.referredByMitra && c.referredByMitra.toLowerCase().includes(s))
    );
  });

  const totalOrders = customers.reduce((sum, c) => sum + (Number(c.ordersCount) || 0), 0);
  const totalSpent = customers.reduce((sum, c) => sum + (Number(c.totalSpent) || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-600" />
            <span>Manajemen Akun &amp; Kredensial Pelanggan (Customers)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pantau akun pelanggan terdaftar, lihat kata sandi login, riwayat klaim garansi, serta cetak kartu QR Code Member.
          </p>
        </div>

        {/* Action Controls: Search & Bulk Print Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowBatchPrintModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-slate-900/20 cursor-pointer transition-all whitespace-nowrap"
            title="Buka jendela cetak stiker & download 100 QR Code Member sekaligus"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Batch Cetak &amp; ZIP 100 QR Member</span>
          </button>

          {/* Search Bar */}
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, WhatsApp, email, wilayah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Pelanggan Terdaftar
            </span>
            <div className="text-2xl font-black text-slate-900">
              {customers.length} Member
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Tersimpan di database PostgreSQL</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200/40">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">
              Total Riwayat Servis
            </span>
            <div className="text-2xl font-black text-slate-900">
              {totalOrders} Unit Servis
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Perangkat yang pernah diservis</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-200/40">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block">
              Akumulasi Nilai Transaksi
            </span>
            <div className="text-2xl font-black text-slate-900">
              {formatRp(totalSpent)}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Total belanja seluruh pelanggan</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200/40">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Tabel Akun &amp; Kredensial Pelanggan</h3>
            <p className="text-[11px] text-slate-500">Klik tombol Edit untuk mengubah nama, nomor telepon, kata sandi, email, atau status pelanggan.</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 border border-amber-200/60 text-amber-800 rounded-lg">
            Menampilkan {filteredCustomers.length} dari {customers.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200/80 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Nama Pelanggan</th>
                <th className="py-3.5 px-4">Kontak WhatsApp &amp; Email</th>
                <th className="py-3.5 px-4">Kata Sandi Akun</th>
                <th className="py-3.5 px-4">Wilayah &amp; Mitra Pengajak</th>
                <th className="py-3.5 px-4">Riwayat Servis</th>
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
                      <span className="text-xs font-semibold text-slate-500">Memuat data pelanggan...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    {searchTerm ? 'Tidak ada pelanggan yang cocok dengan pencarian.' : 'Belum ada akun pelanggan terdaftar.'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c, idx) => {
                  const isPassRevealed = Boolean(revealedPasswords[c.id]);
                  const displayPassword = c.plainPassword || (c.password && !String(c.password).startsWith('$2') ? c.password : '');
                  const isHashed = Boolean(c.password && String(c.password).startsWith('$2'));

                  return (
                    <tr key={idx} className="hover:bg-amber-50/20 transition-colors">
                      {/* Nama Pelanggan */}
                      <td className="py-3.5 px-4">
                        <strong className="text-slate-900 block text-xs font-bold leading-tight">{c.name}</strong>
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">ID: {c.id}</span>
                        {c.registeredAt && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">Reg: {c.registeredAt}</span>
                        )}
                      </td>

                      {/* Kontak */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <a
                            href={`https://wa.me/62${String(c.whatsapp || c.phone || '').replace(/^0/, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                            title="Chat WhatsApp Pelanggan"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{c.whatsapp || c.phone || '-'}</span>
                          </a>

                          {c.email ? (
                            <div className="flex items-center gap-1 text-[11px] text-slate-600 truncate max-w-[180px]">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{c.email}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic block">Tanpa email</span>
                          )}
                        </div>
                      </td>

                      {/* Kata Sandi Akun */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <Key className="w-3 h-3 text-amber-600 shrink-0" />
                          {displayPassword ? (
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-[11px] font-bold bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded border border-amber-200">
                                {isPassRevealed ? displayPassword : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(c.id)}
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
                      </td>

                      {/* Wilayah & Mitra Pengajak */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-slate-800 font-medium text-xs">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{c.district || 'Kota Malang'}</span>
                          </div>

                          {c.referredByMitra ? (
                            <div className="flex items-center gap-1">
                              <Tag className="w-3 h-3 text-amber-600 shrink-0" />
                              <span className="font-mono font-bold text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                                Ref: {c.referredByMitra}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 block">Jalur Mandiri</span>
                          )}
                        </div>
                      </td>

                      {/* Riwayat Servis */}
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-bold text-slate-900 block">
                          {c.ordersCount || 0} Kali Servis
                        </span>
                        <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
                          {formatRp(c.totalSpent || 0)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          String(c.status || '').toLowerCase().includes('aktif')
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            String(c.status || '').toLowerCase().includes('aktif') ? 'bg-emerald-500' : 'bg-red-500'
                          }`} />
                          <span>{c.status || 'Aktif'}</span>
                        </span>
                      </td>

                      {/* Aksi Admin */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedCustomerQr(c)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs cursor-pointer shadow-2xs transition-all"
                            title="Lihat & Cetak Kartu QR Code Member"
                          >
                            <QrCode className="w-3.5 h-3.5 text-amber-600" />
                            <span>QR Member</span>
                          </button>

                          <button
                            onClick={() => setEditingCustomer(c)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50/80 hover:bg-amber-100 text-amber-900 font-bold text-xs cursor-pointer shadow-2xs transition-all"
                            title="Edit data & kata sandi pelanggan"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                            <span>Edit</span>
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

      {/* Modal Edit Customer */}
      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSuccess={(updated) => {
            if (onCustomerUpdated) {
              onCustomerUpdated(updated);
            }
          }}
        />
      )}

      {/* Modal Kartu QR Code Member */}
      {selectedCustomerQr && (
        <MemberQrCardModal
          customer={selectedCustomerQr}
          onClose={() => setSelectedCustomerQr(null)}
        />
      )}

      {/* Modal Batch Cetak & Unduh 100 QR Code Member */}
      {showBatchPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full p-6 shadow-2xl space-y-5 my-6 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4 no-print">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <Printer className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-black text-slate-900">
                    Cetak &amp; Unduh Koleksi QR Code 100 Member Prioritas
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Pilih kartu QR Member mana saja yang ingin diunduh (.ZIP) secara in-memory, atau gunakan 1 tombol cepat untuk mendownload seluruh 100 file QR Member tanpa simpan lokal.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadAllMembersZip}
                  disabled={downloadingZip}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
                  title="Unduh seluruh 100 kartu QR Member dalam file ZIP (In-Memory)"
                >
                  <FolderArchive className="w-4 h-4" />
                  <span>{downloadingZip ? 'Menyiapkan ZIP...' : 'Unduh Semua 100 (.ZIP)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSelectedMembersZip}
                  disabled={selectedMemberCodes.length === 0 || downloadingZip}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                    selectedMemberCodes.length > 0 && !downloadingZip
                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                  title={selectedMemberCodes.length > 0 ? `Unduh ${selectedMemberCodes.length} QR terpilih` : 'Pilih minimal 1 QR'}
                >
                  <DownloadCloud className={`w-4 h-4 ${downloadingZip ? 'animate-bounce' : ''}`} />
                  <span>{`Unduh ZIP Terpilih (${selectedMemberCodes.length})`}</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-slate-900/20 cursor-pointer transition-all"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>Cetak Stiker ({getBatchMembers().length})</span>
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

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 no-print">
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs">
                <button
                  type="button"
                  onClick={() => setBatchFilter('all')}
                  className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    batchFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua (100)
                </button>
                <button
                  type="button"
                  onClick={() => setBatchFilter('registered')}
                  className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    batchFilter === 'registered' ? 'bg-white text-amber-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Terdaftar ({customers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBatchFilter('batch1')}
                  className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    batchFilter === 'batch1' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  001 - 025
                </button>
                <button
                  type="button"
                  onClick={() => setBatchFilter('batch2')}
                  className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    batchFilter === 'batch2' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  026 - 050
                </button>
                <button
                  type="button"
                  onClick={() => setBatchFilter('batch3')}
                  className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    batchFilter === 'batch3' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  051 - 075
                </button>
                <button
                  type="button"
                  onClick={() => setBatchFilter('batch4')}
                  className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    batchFilter === 'batch4' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  076 - 100
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllInBatch}
                  className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Pilih Semua di Tab Ini</span>
                </button>
              </div>
            </div>

            {/* Grid Area */}
            <div id="member-batch-print-area" className="max-h-[60vh] overflow-y-auto p-1">
              <style>{`
                @media print {
                  body * {
                    visibility: hidden !important;
                  }
                  #member-batch-print-area, #member-batch-print-area * {
                    visibility: visible !important;
                  }
                  #member-batch-print-area {
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
                {getBatchMembers().map((m) => {
                  const isSelected = selectedMemberCodes.includes(m.code);
                  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ngalamfixpro.com';
                  const targetUrl = `${origin}/lacak?search=${encodeURIComponent(m.whatsapp || m.phone || m.id)}&member=${encodeURIComponent(m.id)}`;

                  return (
                    <QrStickerCard
                      key={m.id}
                      type="member"
                      numStr={m.numStr}
                      qrId={m.code}
                      systemId={m.id}
                      code={m.code}
                      targetUrl={targetUrl}
                      name={m.name}
                      phone={m.whatsapp || m.phone}
                      district={m.district}
                      isSelected={isSelected}
                      onToggleSelect={() => toggleSelectMemberCode(m.code)}
                      onDownloadSingle={() => downloadSingleMemberCard(m)}
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

