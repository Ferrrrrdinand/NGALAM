import React, { useState } from 'react';
import { 
  Search, FileSpreadsheet, AlertCircle, 
  Clock, CheckCircle2, ChevronRight,
  Filter, Smartphone, Wrench
} from 'lucide-react';
import { formatRp } from '../../utils/api';

export default function OrdersTab({
  searchTerm,
  setSearchTerm,
  handleExportExcel,
  loading,
  filteredOrders,
  onSelectOrderForPayment
}) {
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'unpaid' | 'paid' | 'step5' | 'in_progress'

  // Metric calculation
  const totalOrders = filteredOrders.length;
  const unpaidOrders = filteredOrders.filter(o => !o.paid).length;
  const completedOrders = filteredOrders.filter(o => o.currentStep === 5).length;
  const inProgressOrders = filteredOrders.filter(o => (o.currentStep || 1) < 5).length;
  const totalRevenue = filteredOrders.reduce((acc, o) => acc + (o.paid ? (Number(o.cost) || 0) : 0), 0);

  // Filter display
  const displayedOrders = filteredOrders.filter(o => {
    if (statusFilter === 'unpaid') return !o.paid;
    if (statusFilter === 'paid') return !!o.paid;
    if (statusFilter === 'step5') return o.currentStep === 5;
    if (statusFilter === 'in_progress') return (o.currentStep || 1) < 5;
    return true;
  });

  const getStepBadge = (step) => {
    switch (step) {
      case 1:
        return { label: 'Step 1: Intake Masuk', color: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 2:
        return { label: 'Step 2: Diagnosa Lab', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 3:
        return { label: 'Step 3: Pengerjaan', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 4:
        return { label: 'Step 4: Quality Check', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 5:
        return { label: 'Step 5: Selesai Siap Ambil', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: `Step ${step || 1}`, color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 4 TOP KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Antrian</span>
            <div className="text-2xl font-black text-slate-900">{totalOrders}</div>
            <span className="text-[11px] text-slate-400 font-medium">Seluruh tiket terdaftar</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block">Dalam Pengerjaan</span>
            <div className="text-2xl font-black text-amber-600">{inProgressOrders}</div>
            <span className="text-[11px] text-slate-400 font-medium">Proses teknisi di lab</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Wrench className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider block">Belum Lunas</span>
            <div className="text-2xl font-black text-rose-600">{unpaidOrders}</div>
            <span className="text-[11px] text-slate-400 font-medium">Menunggu kasir/bayar</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">Omset Masuk</span>
            <div className="text-xl font-black text-emerald-700 truncate">{formatRp(totalRevenue)}</div>
            <span className="text-[11px] text-slate-400 font-medium">{completedOrders} unit beres</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SEARCH, FILTER & ACTION TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari tiket (NGF-...), nama pelanggan, atau tipe HP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Export Action */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Excel</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100 text-xs">
          <span className="text-slate-400 flex items-center gap-1 mr-2 text-[11px] font-medium shrink-0">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {[
            { id: 'all', label: `Semua (${totalOrders})` },
            { id: 'in_progress', label: `Sedang Dikerjakan (${inProgressOrders})` },
            { id: 'step5', label: `Unit Selesai (${completedOrders})` },
            { id: 'unpaid', label: `Belum Lunas (${unpaidOrders})` },
            { id: 'paid', label: `Lunas` },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg font-medium text-xs whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === f.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200/80 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Tiket Servis</th>
                <th className="py-3.5 px-5">Pelanggan</th>
                <th className="py-3.5 px-5">Perangkat &amp; Kerusakan</th>
                <th className="py-3.5 px-5">Progres Lab</th>
                <th className="py-3.5 px-5">Biaya</th>
                <th className="py-3.5 px-5 text-center">Status</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-amber-600 animate-spin"></div>
                      <span className="text-xs font-semibold text-slate-500">Memuat data tiket servis...</span>
                    </div>
                  </td>
                </tr>
              ) : displayedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-semibold text-slate-700">Tidak ada tiket yang cocok</p>
                      <p className="text-[11px] text-slate-400">Coba ubah kata kunci pencarian atau ganti filter status antrian.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedOrders.map((o) => {
                  const stepBadge = getStepBadge(o.currentStep || 1);
                  return (
                    <tr key={o.id} className="hover:bg-slate-50/70 transition-colors group">
                      
                      {/* Ticket Number */}
                      <td className="py-3.5 px-5 align-top">
                        <span className="font-mono font-bold text-amber-600 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded text-[11px] inline-block">
                          {o.id}
                        </span>
                        {o.date && (
                          <span className="block text-[10px] text-slate-400 mt-1">{o.date}</span>
                        )}
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-5 align-top">
                        <span className="text-slate-900 block font-semibold text-xs leading-snug">
                          {o.customerName}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {o.whatsapp || '-'}
                        </span>
                      </td>

                      {/* Phone & Issue */}
                      <td className="py-3.5 px-5 align-top max-w-xs">
                        <span className="font-medium text-slate-900 block">{o.phoneType}</span>
                        <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5" title={o.damage}>
                          {o.damage || 'Pemeriksaan umum'}
                        </span>
                      </td>

                      {/* Step Badge */}
                      <td className="py-3.5 px-5 align-top">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${stepBadge.color}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {stepBadge.label}
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="py-3.5 px-5 align-top font-medium text-slate-900">
                        <span className="font-semibold block">{formatRp(o.cost || 0)}</span>
                        {o.technician && (
                          <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[120px]">
                            Teknisi: {o.technician}
                          </span>
                        )}
                      </td>

                      {/* Paid Status */}
                      <td className="py-3.5 px-5 align-top text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          o.paid 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {o.paid ? 'Lunas' : 'Belum Lunas'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-5 align-top text-right">
                        <button
                          onClick={() => onSelectOrderForPayment(o)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-amber-600 text-white font-medium rounded-lg text-xs transition-all cursor-pointer shadow-xs"
                        >
                          <span>Proses</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
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
