import React from 'react';
import { Printer, X, ShieldCheck } from 'lucide-react';
import { formatRp } from '../../utils/api';

export default function ReceiptModal({
  receiptTx,
  setReceiptTx,
  printAreaRef,
  handlePrint
}) {
  if (!receiptTx) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
        
        <div className="flex items-center justify-between border-b pb-3">
          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Printer className="w-4 h-4 text-amber-600" /> Struk Thermal Kasir
          </span>
          <button
            onClick={() => setReceiptTx(null)}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Print Area (58mm/80mm styled) */}
        <div ref={printAreaRef} className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl font-mono text-[11px] text-slate-800 space-y-2">
          <div className="text-center pb-2 border-b border-dashed border-slate-300">
            <strong className="text-sm block">NGALAM FIX PRO</strong>
            <span>Spesialis Servis HP &amp; iPhone Malang</span><br/>
            <span className="text-[9px]">Jl. Candi Mendut No.12 • WA: 082245233306</span>
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
              <span>Kasir:</span>
              <span>{receiptTx.cashier || 'Meja 1'}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-300 pt-2 pb-1">
            <div className="flex justify-between text-xs font-bold">
              <span>TOTAL BAYAR:</span>
              <span>{formatRp(receiptTx.totalPaid || receiptTx.amount || 0)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Metode:</span>
              <span>{receiptTx.paymentMethod || 'Tunai'}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-300 pt-2 text-center text-[9px] text-slate-600 space-y-1">
            <p className="font-bold text-emerald-700 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
              <span>
                {/baterai|battery/i.test(receiptTx.serviceItem || receiptTx.orderId || '')
                  ? 'GARANSI RESMI LAB 90 HARI (BATERAI)'
                  : 'GARANSI RESMI LAB (1 MINGGU - 1 BULAN)'}
              </span>
            </p>
            <p>Simpan struk ini sebagai bukti klaim garansi servis smartphone Anda.</p>
            <p>Terima kasih atas kepercayaan Anda!</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" /> Cetak Struk
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
  );
}
