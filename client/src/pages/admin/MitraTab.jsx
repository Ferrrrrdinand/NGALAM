import React from 'react';
import { Banknote, X, Users, Wallet, ArrowDownRight } from 'lucide-react';
import { formatRp } from '../../utils/api';

export default function MitraTab({
  mitras,
  loading,
  payoutModalMitra,
  setPayoutModalMitra,
  payoutAmount,
  setPayoutAmount,
  handlePayoutSubmit
}) {
  const totalBalance = mitras.reduce((acc, m) => acc + (Number(m.balance) || 0), 0);
  const totalCommission = mitras.reduce((acc, m) => acc + (Number(m.totalCommission) || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-600" />
            <span>Program Afiliasi Mitra Driver &amp; Toko Rekanan</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pantau pendaftaran mitra, kode referral barcode, dan catat pencairan komisi kasir secara transparan.
          </p>
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
            <span className="text-[11px] text-slate-400 font-medium">Terverifikasi di sistem</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
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
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
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
            <span className="text-[11px] text-slate-400 font-medium">Akumulasi bagi hasil 10%</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Mitra Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Daftar Rekening &amp; Saldo Komisi Mitra</h3>
            <p className="text-[11px] text-slate-500">Pencairan saldo komisi langsung dicatat ke buku pengeluaran kasir.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200/80 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Mitra</th>
                <th className="py-3.5 px-5">Profesi / Kendaraan</th>
                <th className="py-3.5 px-5">Kode Referral</th>
                <th className="py-3.5 px-5">Saldo Siap Tarik</th>
                <th className="py-3.5 px-5">Total Komisi</th>
                <th className="py-3.5 px-5 text-right">Aksi Kasir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-amber-600 animate-spin"></div>
                      <span className="text-xs font-semibold text-slate-500">Memuat data mitra...</span>
                    </div>
                  </td>
                </tr>
              ) : mitras.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">Belum ada mitra driver / rekanan terdaftar.</td>
                </tr>
              ) : (
                mitras.map((m, idx) => {
                  const unwithdrawn = m.balance !== undefined ? m.balance : (m.totalCommission || 0);
                  return (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5">
                        <strong className="text-slate-900 block text-xs">{m.name}</strong>
                        <span className="text-[11px] font-mono text-slate-500">{m.phone}</span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="text-slate-700">{m.category || m.vehicleType || 'Mitra Driver'}</span>
                        {m.plateNumber && (
                          <span className="block font-mono text-[10px] text-slate-400">{m.plateNumber}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="font-mono font-bold bg-amber-50 border border-amber-200/60 text-amber-700 px-2 py-0.5 rounded text-[11px] inline-block">
                          {m.referralCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <strong className={`text-xs block ${unwithdrawn > 0 ? 'text-emerald-700 font-bold' : 'text-slate-400 font-medium'}`}>
                          {formatRp(unwithdrawn)}
                        </strong>
                      </td>
                      <td className="py-3.5 px-5 text-slate-700 font-medium">
                        {formatRp(m.totalCommission || 0)}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          disabled={unwithdrawn <= 0}
                          onClick={() => {
                            setPayoutModalMitra(m);
                            setPayoutAmount(String(unwithdrawn));
                          }}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${
                            unwithdrawn > 0
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-2xs'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <Banknote className="w-3.5 h-3.5" />
                          <span>Cairkan</span>
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

      {/* Modal Payout Kasir */}
      {payoutModalMitra && (
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

            <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Penerima:</span>
                <strong className="text-slate-800">{payoutModalMitra.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kode Referral:</span>
                <span className="font-mono font-bold text-amber-600">{payoutModalMitra.referralCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kontak:</span>
                <span className="font-mono text-slate-700">{payoutModalMitra.phone}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Saldo Tersedia:</span>
                <strong className="text-emerald-700">{formatRp(payoutModalMitra.balance || 0)}</strong>
              </div>
            </div>

            <form onSubmit={handlePayoutSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nominal Pencairan Saldo (Rp)
                </label>
                <div className="relative">
                  <span className="text-xs font-bold text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2">Rp</span>
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
    </div>
  );
}
