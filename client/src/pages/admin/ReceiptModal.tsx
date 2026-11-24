import React from 'react';
import { Printer, X, ShieldCheck, CheckCircle, Clock } from 'lucide-react';
import { formatRp } from '../../utils/api';

export default function ReceiptModal({
  receiptTx,
  setReceiptTx,
  printAreaRef,
  handlePrint,
  onConfirmSettle
}) {
  if (!receiptTx) return null;

  const isPaid = receiptTx.isPaid !== false && receiptTx.status !== 'Menunggu Pelunasan (Draft Struk)';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #receiptContent, #receiptContent * {
            visibility: visible !important;
          }
          #receiptContent {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 80mm !important;
            margin: 0 auto !important;
            padding: 10px !important;
            background: white !important;
            color: black !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            z-index: 999999 !important;
          }
        }
      `}</style>
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Printer className="w-4 h-4 text-amber-600" /> Struk Thermal Kasir
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900 animate-pulse'
            }`}>
              {isPaid ? 'LUNAS' : 'MENUNGGU PEMBAYARAN'}
            </span>
          </div>
          <button
            onClick={() => setReceiptTx(null)}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Print Area (58mm/80mm styled) */}
        <div id="receiptContent" ref={printAreaRef} className="receipt-paper p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl font-mono text-[11px] text-slate-800 space-y-2">
          <div className="text-center pb-2 border-b border-dashed border-slate-300">
            <strong className="text-sm block">NGALAM FIX PRO</strong>
            <span>Spesialis Servis HP &amp; iPhone Malang</span><br/>
            <span className="text-[9px]">Jl. Galunggung, Malang • CS WhatsApp: +62 811-3185-858</span>
          </div>

          <div className="space-y-1 py-1">
            <div className="flex justify-between">
              <span>No. Faktur:</span>
              <strong>{receiptTx.invoiceNumber || receiptTx.invoiceNo}</strong>
            </div>
            <div className="flex justify-between">
              <span>No. Tiket:</span>
              <strong>{receiptTx.ticketId || '-'}</strong>
            </div>
            <div className="flex justify-between">
              <span>Pelanggan:</span>
              <span>{receiptTx.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span>Unit:</span>
              <span>{receiptTx.phoneType}</span>
            </div>
            <div className="flex justify-between">
              <span>Layanan:</span>
              <strong className="text-right max-w-[160px] truncate text-slate-900">{receiptTx.serviceItem || 'Servis Komponen & Hardware'}</strong>
            </div>
            <div className="flex justify-between">
              <span>Garansi:</span>
              <span className="font-bold text-amber-800">{receiptTx.warrantyTypeLabel || 'Garansi Resmi 30 Hari'}</span>
            </div>
            <div className="flex justify-between">
              <span>Masa Proteksi:</span>
              <span className={`font-bold ${isPaid ? 'text-emerald-700' : 'text-amber-800'}`}>
                {isPaid ? 'Aktif (Countdown Berjalan)' : 'Mulai setelah status lunas'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Kasir:</span>
              <span>{receiptTx.cashier || receiptTx.cashierName || 'Admin Kasir'}</span>
            </div>
          </div>

          {/* RINCIAN PEMBIAYAAN TERINCI (SPAREPART, JASA, LAIN-LAIN) */}
          <div className="border-t border-dashed border-slate-300 pt-2 pb-1 space-y-1">
            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider pb-0.5">
              Rincian Biaya Servis:
            </div>
            <div className="flex justify-between text-[11px] text-slate-700">
              <span>• Harga Sparepart:</span>
              <span>{formatRp(Number(receiptTx.partCost) || 0)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-700">
              <span>• Harga Jasa Pasang:</span>
              <span>{formatRp(Number(receiptTx.serviceCost) || 0)}</span>
            </div>
            {Number(receiptTx.otherCost) > 0 && (
              <div className="flex justify-between text-[11px] text-slate-700">
                <span>• Lain-lain {receiptTx.otherCostNotes ? `(${receiptTx.otherCostNotes})` : ''}:</span>
                <span>{formatRp(Number(receiptTx.otherCost) || 0)}</span>
              </div>
            )}

            <div className="flex justify-between text-[11px] text-slate-600 pt-1 border-t border-dashed border-slate-200">
              <span>Subtotal Biaya:</span>
              <span>{formatRp(Number(receiptTx.subtotal || receiptTx.baseCost) || 0)}</span>
            </div>

            {(receiptTx.discountAmount > 0 || receiptTx.discount > 0) && (
              <div className="flex justify-between text-[11px] font-bold text-emerald-700">
                <span>Diskon ({receiptTx.promoCode || 'Promo'} {receiptTx.discountPercent ? `${receiptTx.discountPercent}%` : ''}):</span>
                <span>-{formatRp(Number(receiptTx.discountAmount || receiptTx.discount) || 0)}</span>
              </div>
            )}

            <div className="flex justify-between text-xs font-black pt-1 border-t border-dashed border-slate-300 text-slate-900">
              <span>TOTAL BAYAR:</span>
              <span>{formatRp(Number(receiptTx.totalPaid || receiptTx.amount) || 0)}</span>
            </div>

            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Metode:</span>
              <span>{receiptTx.paymentMethod || 'Tunai'}</span>
            </div>

            <div className="flex justify-between text-[10px] font-bold pt-1 border-t border-dashed border-slate-200">
              <span>Status Pembayaran:</span>
              <span className={`px-2 py-0.5 rounded text-[9.5px] uppercase font-black ${
                isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
              }`}>
                {isPaid ? 'LUNAS (TERBAYAR)' : 'MENUNGGU PEMBAYARAN'}
              </span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-300 pt-2 text-center text-[9px] text-slate-600 space-y-1">
            <p className="font-bold text-emerald-700 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
              <span>
                {/baterai|battery/i.test(receiptTx.serviceItem || receiptTx.orderId || '')
                  ? 'GARANSI RESMI LAB 90 HARI (BATERAI)'
                  : 'GARANSI RESMI LAB 30 HARI (HARDWARE)'}
              </span>
            </p>
            <p>Simpan struk ini sebagai bukti klaim garansi servis smartphone Anda.</p>
            <p>Terima kasih atas kepercayaan Anda!</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {!isPaid && onConfirmSettle ? (
            <button
              type="button"
              onClick={() => onConfirmSettle(receiptTx)}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Konfirmasi Lunas &amp; Aktifkan Garansi Sekarang</span>
            </button>
          ) : null}

          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>{isPaid ? 'Cetak Ulang Struk Lunas' : 'Cetak Struk Pembelian'}</span>
            </button>
            <button
              onClick={() => setReceiptTx(null)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
