import React from 'react';
import { Search, AlertCircle, Users, CheckCircle, CreditCard, ArrowLeft } from 'lucide-react';
import { formatRp } from '../../utils/api';

export default function CashierTab({
  bookingSearchInput,
  setBookingSearchInput,
  handleSearchBookingCode,
  bookingSearchError,
  paymentOrder,
  setPaymentOrder,
  paymentForm,
  setPaymentForm,
  handleSettlePayment,
  setActiveTab
}) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Kasir &amp; Pelunasan Nota Servis</span>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Pos Kasir Meja 1
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Validasi pembayaran nota servis, otomatisasi cetak struk thermal, dan kalkulasi bagi hasil komisi mitra 10%.
          </p>
        </div>
      </div>

      {/* Form Pencarian Tiket */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Cari Tiket / Kode Booking</label>
          <p className="text-[11px] text-slate-400">Ketik nomor tiket lengkap (misal: NGF-20261031-4898) atau nomor WhatsApp pelanggan.</p>
        </div>

        <form onSubmit={handleSearchBookingCode} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Contoh: NGF-20261031-4898 atau 08123..."
              value={bookingSearchInput}
              onChange={(e) => setBookingSearchInput(e.target.value)}
              className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-mono transition-all placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 hover:bg-amber-600 text-white font-medium text-xs rounded-xl shrink-0 transition-all cursor-pointer shadow-xs"
          >
            Cari Tiket
          </button>
        </form>

        {bookingSearchError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{bookingSearchError}</span>
          </div>
        )}
      </div>

      {/* Form Pelunasan / Detail Tiket Terpilih */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">Formulir Pelunasan &amp; Penerbitan Struk</h3>
          {paymentOrder && (
            <button
              onClick={() => setPaymentOrder(null)}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
            >
              Reset / Pilih Tiket Lain
            </button>
          )}
        </div>

        {paymentOrder ? (
          <form onSubmit={handleSettlePayment} className="space-y-5">
            
            {/* Target Tiket Info Card */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Tiket Servis</span>
                <span className="text-xs font-mono font-bold bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded text-amber-700">
                  {paymentOrder.id}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900">{paymentOrder.phoneType}</div>
              <div className="text-xs text-slate-600">
                Pelanggan: <strong className="text-slate-800">{paymentOrder.customerName}</strong> ({paymentOrder.whatsapp || '-'})
              </div>
              <div className="text-xs text-slate-500">
                Kerusakan: {paymentOrder.damage || paymentOrder.damageDescription || 'Pemeriksaan umum'}
              </div>
            </div>

            {/* Banner Mitra Afiliasi */}
            {paymentOrder.affiliateRef ? (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-800">
                  <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wide">
                    Pesanan Referal Mitra Resmi (Komisi 10%)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Mitra Penerima:</span>
                    <strong className="text-slate-900 font-semibold">{paymentOrder.partnerName || paymentOrder.affiliateMitraName || 'Mitra'}</strong>
                    <span className="text-[11px] font-mono text-emerald-700 block">({paymentOrder.affiliateRef})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Komisi 10% dari Nota:</span>
                    <strong className="text-base text-emerald-700 font-bold">
                      {formatRp(Math.round((Number(paymentForm.finalAmount) || 0) * 0.1))}
                    </strong>
                  </div>
                </div>
                <div className="text-[11px] text-emerald-800 pt-1 border-t border-emerald-200/60 flex items-center justify-between">
                  <span>Status Komisi:</span>
                  <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                    paymentOrder.affiliateCommissionStatus === 'paid' 
                      ? 'bg-emerald-200 text-emerald-900' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {paymentOrder.affiliateCommissionStatus === 'paid' ? 'Sudah Dicairkan' : 'Siap Ditambahkan ke Saldo'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                Unit datang reguler / tanpa kode referral mitra.
              </div>
            )}

            {/* Input Nominal Bayar & Metode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nominal Pelunasan Akhir (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="text-xs font-bold text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2">Rp</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    value={paymentForm.finalAmount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, finalAmount: e.target.value })}
                    className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-mono font-bold transition-all text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Metode Pembayaran Kasir
                </label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all cursor-pointer text-slate-800"
                >
                  <option value="Tunai (Cash)">Tunai / Cash Counter</option>
                  <option value="QRIS / Statis Workshop">QRIS Standar Workshop</option>
                  <option value="Transfer Bank BCA/BRI">Transfer Bank BCA / BRI</option>
                  <option value="Debit Card EDC">Kartu Debit / EDC</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Catatan Kasir / Keterangan Tambahan
              </label>
              <input
                type="text"
                placeholder="Misal: Sudah lunas, bonus pasang tempered glass"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPaymentOrder(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs hover:shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>
                  {paymentOrder.affiliateRef && paymentOrder.affiliateCommissionStatus !== 'paid'
                    ? 'Konfirmasi Lunas & Salurkan Komisi 10%'
                    : 'Konfirmasi Lunas & Cetak Faktur'}
                </span>
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700">Belum ada tiket servis yang dipilih</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1">
                Pilih tiket langsung dari antrian servis di tab "Antrian Servis Unit" dengan tombol <strong>Proses</strong> atau masukkan kode tiket pada pencarian di atas.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('orders')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Buka Daftar Antrian Servis</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
