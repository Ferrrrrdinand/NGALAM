import React from 'react';
import { FileSpreadsheet, Printer, Receipt } from 'lucide-react';
import { formatRp } from '../../utils/api';

export default function TransactionsTab({
  transactions,
  loading,
  handleExportExcel,
  setReceiptTx
}) {
  const totalVolume = transactions.reduce((acc, t) => acc + (Number(t.totalPaid || t.amount || 0)), 0);

  return (
    <div className="space-y-6">
      
      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Faktur Kasir</span>
            <div className="text-2xl font-black text-slate-900">{transactions.length}</div>
            <span className="text-[11px] text-slate-400 font-medium">Transaksi lunas tersimpan</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between sm:col-span-2">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">Total Kas Masuk Terverifikasi</span>
            <div className="text-2xl font-black text-emerald-700">{formatRp(totalVolume)}</div>
            <span className="text-[11px] text-slate-400 font-medium">Real-time settlement counter kasir</span>
          </div>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Unduh Laporan Excel</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Buku Riwayat Faktur Kasir &amp; Transaksi Lunas</h2>
            <p className="text-[11px] text-slate-500">Seluruh struk pembayaran berhasil diverifikasi counter kasir Meja 1.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200/80 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">No. Faktur</th>
                <th className="py-3.5 px-5">Tiket</th>
                <th className="py-3.5 px-5">Pelanggan</th>
                <th className="py-3.5 px-5">Perangkat</th>
                <th className="py-3.5 px-5">Total Bayar</th>
                <th className="py-3.5 px-5">Metode Bayar</th>
                <th className="py-3.5 px-5">Kasir</th>
                <th className="py-3.5 px-5 text-right">Struk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-amber-600 animate-spin"></div>
                      <span className="text-xs font-semibold text-slate-500">Memuat faktur transaksi kasir...</span>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">Belum ada faktur transaksi tersimpan.</td>
                </tr>
              ) : (
                transactions.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                      {tx.invoiceNumber || tx.invoiceNo || '-'}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-amber-600 font-semibold">
                      {tx.ticketId || '-'}
                    </td>
                    <td className="py-3.5 px-5 font-medium text-slate-900">
                      {tx.customerName || '-'}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600">
                      {tx.phoneType || '-'}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-emerald-700">
                      {formatRp(tx.totalPaid || tx.amount || 0)}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {tx.paymentMethod || 'Tunai'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500">
                      {tx.cashier || '-'}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => setReceiptTx(tx)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer transition-colors shadow-2xs"
                        title="Lihat Struk Kasir"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
