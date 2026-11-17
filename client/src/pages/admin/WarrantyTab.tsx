import React, { useState } from 'react';
import { 
  ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle, Clock, 
  Search, Phone, Smartphone, User, FileText, ArrowRight, ExternalLink,
  RefreshCw, Wrench, Calendar, Tag, Check, X, MessageSquare, Send
} from 'lucide-react';
import { fetchApi, formatDateId } from '../../utils/api';

interface WarrantyTabProps {
  warranties: any[];
  stats?: any;
  loading?: boolean;
  onRefresh?: () => void;
}

export default function WarrantyTab({
  warranties = [],
  stats = {},
  loading = false,
  onRefresh
}: WarrantyTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_repair' | 'active' | 'expired'>('all');
  const [selectedWarranty, setSelectedWarranty] = useState<any | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [newClaimStatus, setNewClaimStatus] = useState<'approved' | 'in_repair' | 'resolved' | 'rejected' | 'pending'>('approved');
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter Data
  const filteredWarranties = warranties.filter((w) => {
    // 1. Status Filter
    if (statusFilter === 'pending' && w.claimStatus !== 'pending') return false;
    if (statusFilter === 'in_repair' && w.claimStatus !== 'in_repair') return false;
    if (statusFilter === 'active' && (!w.isActive || w.claimStatus === 'pending')) return false;
    if (statusFilter === 'expired' && !w.isExpired) return false;

    // 2. Search Term
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      (w.warranty_code && w.warranty_code.toLowerCase().includes(s)) ||
      (w.order_id && w.order_id.toLowerCase().includes(s)) ||
      (w.invoice_number && w.invoice_number.toLowerCase().includes(s)) ||
      (w.customer_name && w.customer_name.toLowerCase().includes(s)) ||
      (w.customer_whatsapp && w.customer_whatsapp.includes(s)) ||
      (w.brand_model && w.brand_model.toLowerCase().includes(s)) ||
      (w.service_item && w.service_item.toLowerCase().includes(s))
    );
  });

  // Open Review / Action Modal
  const handleOpenActionModal = (w: any) => {
    setSelectedWarranty(w);
    setNewClaimStatus(w.claimStatus === 'pending' ? 'approved' : w.claimStatus || 'approved');
    setTechnicianNotes(w.technician_notes || '');
    setFeedbackMsg(null);
    setActionModalOpen(true);
  };

  // Submit Claim Status Update
  const handleSaveClaimStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarranty) return;

    setUpdating(true);
    setFeedbackMsg(null);

    try {
      const res = await fetchApi(`/api/warranties/${selectedWarranty.id}/claim-status`, {
        method: 'PUT',
        body: {
          claimStatus: newClaimStatus,
          technicianNotes: technicianNotes.trim()
        }
      });

      if (res.ok && res.data && res.data.success) {
        setFeedbackMsg({ type: 'success', text: `Status klaim unit berhasil diubah menjadi: ${newClaimStatus}` });
        if (onRefresh) onRefresh();
        setTimeout(() => {
          setActionModalOpen(false);
        }, 1200);
      } else {
        setFeedbackMsg({ type: 'error', text: res.data?.message || 'Gagal memperbarui status klaim.' });
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Terjadi kesalahan koneksi saat memperbarui status klaim.' });
    } finally {
      setUpdating(false);
    }
  };

  // Generate WhatsApp notification to customer
  const generateWaNotificationUrl = (w: any, status: string, notes: string) => {
    const phone = (w.customer_whatsapp || '').replace(/\D/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone.startsWith('62') ? phone : '62' + phone;

    let statusText = 'Pembaruan Status Klaim Garansi';
    if (status === 'approved') statusText = 'KLAIM GARANSI DISETUJUI';
    else if (status === 'in_repair') statusText = 'UNIT SEDANG DALAM PENANGANAN LAB';
    else if (status === 'resolved') statusText = 'UNIT SELESAI DIPERBAIKI / DIGANTI';
    else if (status === 'rejected') statusText = 'INFO PENGAJUAN KLAIM GARANSI';

    const text = encodeURIComponent(
      `Halo Kak ${w.customer_name},\n\n` +
      `Update resmi dari Workshop Lab Ngalam Fix Pro perihal klaim garansi Anda:\n` +
      `---------------------------------------\n` +
      `🏷️ Kode Garansi: ${w.warranty_code}\n` +
      `📱 Perangkat: ${w.brand_model}\n` +
      `🛡️ Status: *${statusText}*\n` +
      (notes ? `📝 Catatan Teknisi: "${notes}"\n` : '') +
      `---------------------------------------\n` +
      `Silakan kunjungi workshop kami atau balas pesan ini jika ada pertanyaan. Terima kasih!`
    );

    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  const pendingCount = warranties.filter(w => w.claimStatus === 'pending').length;
  const inRepairCount = warranties.filter(w => w.claimStatus === 'in_repair').length;
  const activeCount = warranties.filter(w => w.isActive && w.claimStatus !== 'pending').length;
  const expiredCount = warranties.filter(w => w.isExpired).length;

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <span>Database Tabel Garansi Unit &amp; Manajemen Klaim Servis</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Data tersimpan terpusat di database PostgreSQL &amp; sinkron dengan setiap akun member (Baterai 90 hari, Layar &amp; Hardware 30 hari).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* 2. Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sertifikat</span>
            <span className="p-2 rounded-xl bg-slate-100 text-slate-600">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">{warranties.length}</div>
          <div className="mt-1 text-[11px] text-slate-400">Tercatat di Database</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Garansi Aktif</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-emerald-600">{activeCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">Masih dalam masa proteksi</div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-xs ${
          pendingCount > 0 ? 'bg-amber-500/10 border-amber-300' : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              pendingCount > 0 ? 'text-amber-900' : 'text-slate-500'
            }`}>
              Klaim Pending
            </span>
            <span className={`p-2 rounded-xl ${
              pendingCount > 0 ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className={`mt-3 text-2xl font-black ${
            pendingCount > 0 ? 'text-amber-900' : 'text-slate-900'
          }`}>
            {pendingCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Menunggu respons workshop</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pengerjaan Lab</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Wrench className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-blue-600">{inRepairCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">Unit dalam penanganan klaim</div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-bold">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Semua ({warranties.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : pendingCount > 0
                ? 'bg-amber-50 text-amber-900 border border-amber-300'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Klaim Pending ({pendingCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('in_repair')}
            className={`px-3 py-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === 'in_repair'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Di Lab ({inRepairCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Garansi Aktif ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('expired')}
            className={`px-3 py-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === 'expired'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Kedaluwarsa ({expiredCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Kode Garansi, Member, No HP, Tipe HP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-800"
          />
        </div>
      </div>

      {/* 4. Table / Card List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredWarranties.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">Tidak ada data garansi yang cocok</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchTerm ? 'Coba gunakan kata kunci pencarian yang lain.' : 'Belum ada catatan garansi pada filter ini.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">Sertifikat &amp; Tiket</th>
                  <th className="py-3 px-4">Akun Member / Pelanggan</th>
                  <th className="py-3 px-4">Perangkat &amp; Servis</th>
                  <th className="py-3 px-4">Masa Berlaku</th>
                  <th className="py-3 px-4 text-center">Status Garansi</th>
                  <th className="py-3 px-4 text-center">Status Klaim</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWarranties.map((w) => {
                  const isBattery = /baterai|battery/i.test(w.warranty_type_label || w.service_item || '');
                  const hasPendingClaim = w.claimStatus === 'pending';

                  return (
                    <tr 
                      key={w.id} 
                      className={`hover:bg-slate-50/70 transition-colors ${
                        hasPendingClaim ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* 1. Sertifikat & Tiket */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <Tag className="w-3.5 h-3.5 text-amber-600" />
                          <span>{w.warranty_code}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Tiket: <span className="text-slate-600 font-semibold">{w.order_id || w.invoice_number || '-'}</span>
                        </div>
                        {w.customer_id && (
                          <span className="inline-block px-1.5 py-0.5 mt-1 bg-amber-50 border border-amber-200 rounded text-[9px] font-bold text-amber-800">
                            Member Terdaftar
                          </span>
                        )}
                      </td>

                      {/* 2. Akun Pelanggan */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{w.customer_name}</div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{w.customer_whatsapp || '-'}</span>
                        </div>
                      </td>

                      {/* 3. Perangkat & Servis */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="font-bold text-slate-900 flex items-center gap-1 truncate">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{w.brand_model || w.device_type}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {w.service_item || w.warranty_type_label}
                        </div>
                        <div className="text-[10px] text-amber-800 font-semibold mt-0.5">
                          {isBattery ? '⚡ Garansi 90 Hari (3 Bulan)' : `🛡️ ${w.duration_days || 30} Hari Proteksi`}
                        </div>
                      </td>

                      {/* 4. Masa Berlaku & Sisa Hari */}
                      <td className="py-3.5 px-4">
                        <div className="text-[11px] text-slate-700">
                          <div>Mulai: <b>{w.startDateFormatted || formatDateId(w.start_date)}</b></div>
                          <div>S/d: <b>{w.endDateFormatted || formatDateId(w.end_date)}</b></div>
                        </div>
                        <div className="mt-1">
                          {w.isExpired ? (
                            <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Kedaluwarsa
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Sisa {w.daysRemaining} Hari
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. Status Garansi */}
                      <td className="py-3.5 px-4 text-center">
                        {w.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[10px] font-bold">
                            Berakhir
                          </span>
                        )}
                      </td>

                      {/* 6. Status Klaim */}
                      <td className="py-3.5 px-4 text-center">
                        {w.claimStatus === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 text-white rounded-full text-[10px] font-bold animate-pulse shadow-2xs">
                            <AlertTriangle className="w-3 h-3" />
                            Klaim Pending
                          </span>
                        )}
                        {w.claimStatus === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-bold">
                            Disetujui Lab
                          </span>
                        )}
                        {w.claimStatus === 'in_repair' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[10px] font-bold">
                            <Wrench className="w-3 h-3" />
                            Pengerjaan Lab
                          </span>
                        )}
                        {w.claimStatus === 'resolved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                            <CheckCircle className="w-3 h-3" />
                            Selesai Diganti
                          </span>
                        )}
                        {w.claimStatus === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-bold">
                            Ditolak
                          </span>
                        )}
                        {(!w.claimStatus || w.claimStatus === 'none') && (
                          <span className="text-[11px] text-slate-400">Belum Klaim</span>
                        )}
                      </td>

                      {/* 7. Aksi */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenActionModal(w)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              hasPendingClaim
                                ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                            }`}
                          >
                            <span>{hasPendingClaim ? 'Tinjau Klaim' : 'Kelola Klaim'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          {w.customer_whatsapp && (
                            <a
                              href={`https://wa.me/${w.customer_whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Hubungi Pelanggan via WhatsApp"
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Modal Review / Kelola Status Klaim Garansi */}
      {actionModalOpen && selectedWarranty && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">Kelola Status Klaim Garansi</h3>
                  <p className="text-[11px] text-slate-500">Workshop Ngalam Fix Pro • Lab Teknisi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActionModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Card */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Kode Sertifikat:</span>
                <span className="font-mono font-bold text-slate-900">{selectedWarranty.warranty_code}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Nama Pelanggan:</span>
                <span className="font-semibold text-slate-900">{selectedWarranty.customer_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">WhatsApp:</span>
                <span className="font-semibold text-slate-900">{selectedWarranty.customer_whatsapp || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Perangkat:</span>
                <span className="font-semibold text-slate-900">{selectedWarranty.brand_model}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Masa Proteksi:</span>
                <span className="font-semibold text-amber-800">{selectedWarranty.warranty_type_label}</span>
              </div>
            </div>

            {/* Keluhan Pelanggan Terakhir (Jika ada pengajuan klaim) */}
            {selectedWarranty.claimHistory && selectedWarranty.claimHistory.length > 0 && (
              <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl text-xs space-y-2">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Keluhan / Masalah yang Diajukan Pelanggan:</span>
                </div>
                <div className="p-3 bg-white border border-amber-200/80 rounded-xl text-slate-800 italic">
                  "{selectedWarranty.claimHistory[selectedWarranty.claimHistory.length - 1].complaint || 'Tidak ada catatan keluhan tertulis.'}"
                </div>
                <div className="flex justify-between text-[11px] text-amber-800 font-semibold pt-1">
                  <span>Metode: {selectedWarranty.claimHistory[selectedWarranty.claimHistory.length - 1].claimMethod || 'Datang Langsung'}</span>
                  <span>Waktu: {formatDateId(selectedWarranty.claimHistory[selectedWarranty.claimHistory.length - 1].claimedAt)}</span>
                </div>
              </div>
            )}

            {/* Action Form */}
            <form onSubmit={handleSaveClaimStatus} className="space-y-4 pt-1">
              {feedbackMsg && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  feedbackMsg.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {feedbackMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>{feedbackMsg.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pilih Keputusan Status Klaim:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setNewClaimStatus('approved')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      newClaimStatus === 'approved'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-blue-700">✓ Setujui Klaim</div>
                    <div className="text-[10px] text-slate-500">Unit boleh dibawa ke lab</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewClaimStatus('in_repair')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      newClaimStatus === 'in_repair'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold ring-2 ring-indigo-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-indigo-700">⚙️ Pengerjaan Lab</div>
                    <div className="text-[10px] text-slate-500">Teknisi sedang mengganti part</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewClaimStatus('resolved')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      newClaimStatus === 'resolved'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-emerald-700">🎉 Klaim Selesai</div>
                    <div className="text-[10px] text-slate-500">Unit normal, siap diambil</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewClaimStatus('rejected')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      newClaimStatus === 'rejected'
                        ? 'bg-rose-50 border-rose-500 text-rose-900 font-bold ring-2 ring-rose-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-rose-700">✕ Tolak Klaim</div>
                    <div className="text-[10px] text-slate-500">Void / human error / pecah</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Catatan Teknisi / Hasil Diagnosa Workshop:
                </label>
                <textarea
                  rows={3}
                  value={technicianNotes}
                  onChange={(e) => setTechnicianNotes(e.target.value)}
                  placeholder="Contoh: Modul layar diganti baru dengan QC 100% lulus. Bebas biaya jasa dan part."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {updating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan ke Database...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Perubahan Status</span>
                    </>
                  )}
                </button>

                {selectedWarranty.customer_whatsapp && (
                  <a
                    href={generateWaNotificationUrl(selectedWarranty, newClaimStatus, technicianNotes)}
                    target="_blank"
                    rel="noreferrer"
                    className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim WA</span>
                  </a>
                )}
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
