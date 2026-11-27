import React, { useEffect, useState } from 'react';
import { Printer, X, ShieldCheck, CheckCircle } from 'lucide-react';
import QRCode from 'qrcode';
import { formatRp } from '../../utils/api';

interface ReceiptModalProps {
  receiptTx: any;
  setReceiptTx: (tx: any) => void;
  printAreaRef?: any;
  handlePrint: () => void;
  onConfirmSettle?: (tx: any) => void;
}

export default function ReceiptModal({
  receiptTx,
  setReceiptTx,
  printAreaRef,
  handlePrint,
  onConfirmSettle
}: ReceiptModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  if (!receiptTx) return null;

  const isPaid = receiptTx.isPaid !== false && receiptTx.status !== 'Menunggu Pelunasan (Draft Struk)';

  // Format data with safe fallback null checks
  const ticketId = String(receiptTx.ticketId || receiptTx.orderId || receiptTx.invoiceNumber || receiptTx.invoiceNo || 'NGF-SERVIS');
  const rawId = String(receiptTx.invoiceNumber || receiptTx.invoiceNo || ticketId || '');
  const noServis = rawId.replace(/[^0-9]/g, '') || String(Date.now()).slice(-10);
  const customerName = String(receiptTx.customerName || receiptTx.name || 'PELANGGAN').toUpperCase();
  const phone = String(receiptTx.whatsapp || receiptTx.phone || receiptTx.customerPhone || '08113185858');
  
  // Masking phone number like receipt: 08113185858 -> 08***5858
  const maskedPhone = phone.length > 7 
    ? `${phone.slice(0, 4)}***${phone.slice(-4)}` 
    : phone;

  const device = String(receiptTx.phoneType || receiptTx.device || 'SMARTPHONE').toUpperCase();
  const technician = String(receiptTx.technician || receiptTx.cashier || receiptTx.cashierName || 'bayu');
  const noteAuthor = String(receiptTx.noteAuthor || receiptTx.csName || 'ANGGA');
  
  // Format dates
  const today = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const dateStr = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()} [${technician}]`;
  const printTimestamp = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()} ${today.getHours().toString().padStart(2, '0')}.${today.getMinutes().toString().padStart(2, '0')} WIB`;

  // Warranty calculation
  const isBattery = /baterai|battery/i.test(String(receiptTx.serviceItem || receiptTx.damage || ''));
  const warrantyDays = isBattery ? 90 : 7; // or 30 days
  const warrantyEndDate = new Date(today.getTime() + warrantyDays * 24 * 60 * 60 * 1000);
  const warrantyStr = `${warrantyDays === 7 ? '1 Minggu' : warrantyDays === 90 ? '3 Bulan (90 Hari)' : '1 Bulan'} [${warrantyEndDate.getDate()} ${months[warrantyEndDate.getMonth()]} ${warrantyEndDate.getFullYear().toString().slice(-2)}]`;

  // Pricing
  const totalAmount = Number(receiptTx.totalPaid || receiptTx.amount || receiptTx.cost || 0);
  const downPayment = Number(receiptTx.downPayment || 0);
  const paymentMethod = /bri/i.test(String(receiptTx.paymentMethod || '')) 
    ? 'Transfer Bank BRI' 
    : (receiptTx.paymentMethod ? String(receiptTx.paymentMethod) : 'Tunai');

  // Kerusakan & Tindakan
  const damageDesc = String(receiptTx.damage || receiptTx.serviceItem || 'GANTI LCD OLED').toUpperCase();
  const actionDesc = String(receiptTx.actionTaken || receiptTx.serviceItem || damageDesc).toUpperCase();

  // QR Code URL for live tracking & warranty verification
  const qrTarget = typeof window !== 'undefined'
    ? `${window.location.origin}/lacak?id=${encodeURIComponent(ticketId)}`
    : `https://ngalamfixpro.com/lacak?id=${ticketId}`;

  useEffect(() => {
    let isMounted = true;
    try {
      QRCode.toDataURL(qrTarget, {
        width: 200,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
        .then((url) => {
          if (isMounted) setQrCodeUrl(url);
        })
        .catch((err) => console.error('[Struk QR Error]', err));
    } catch (e) {
      console.error('[Struk QR Exception]', e);
    }
    return () => {
      isMounted = false;
    };
  }, [qrTarget]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body * {
            visibility: hidden !important;
          }
          #thermalReceipt, #thermalReceipt * {
            visibility: visible !important;
          }
          #thermalReceipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 78mm !important;
            max-width: 78mm !important;
            margin: 0 !important;
            padding: 8px 10px !important;
            background: #ffffff !important;
            color: #000000 !important;
            border: none !important;
            box-shadow: none !important;
            font-family: 'Courier New', Courier, monospace !important;
            font-size: 11px !important;
            line-height: 1.25 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b pb-3 no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Printer className="w-4 h-4 text-amber-600" /> Nota &amp; Struk Servis
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900 animate-pulse'
            }`}>
              {isPaid ? 'LUNAS' : 'DRAFT'}
            </span>
          </div>
          <button
            onClick={() => setReceiptTx(null)}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* THERMAL RECEIPT CONTAINER (MODEL STRUK ASLI NGALAM FIX PRO) */}
        <div 
          id="thermalReceipt" 
          ref={printAreaRef} 
          className="bg-white p-4 border border-slate-200 rounded-xl font-mono text-[11px] leading-tight text-black shadow-inner"
        >
          {/* HEADER STRUK */}
          <div className="text-center pb-2">
            <div className="font-bold text-sm tracking-widest uppercase">NOTA SERVIS</div>
            <div className="font-extrabold text-base tracking-wider mt-0.5">NGALAM FIX PRO</div>
            <div className="text-[10px] text-black font-semibold mt-0.5">
              Telp. 08113185858 | WA 08113185858
            </div>
          </div>

          <div className="border-b border-dashed border-black/40 my-1"></div>

          {/* TABEL DATA METADATA SERVIS DENGAN ALIGNMENT TITIK DUA RAPI */}
          <div className="space-y-0.5 text-[10.5px]">
            <div className="grid grid-cols-[90px_10px_1fr]">
              <span>No. Servis</span>
              <span>:</span>
              <span className="font-bold tracking-tight">{noServis}</span>
            </div>

            <div className="grid grid-cols-[90px_10px_1fr]">
              <span>Nama</span>
              <span>:</span>
              <span className="font-bold uppercase">{customerName}</span>
            </div>

            <div className="grid grid-cols-[90px_10px_1fr]">
              <span>Telp. WA</span>
              <span>:</span>
              <span>{maskedPhone}</span>
            </div>

            <div className="grid grid-cols-[90px_10px_1fr]">
              <span>Tgl Masuk</span>
              <span>:</span>
              <span>{dateStr}</span>
            </div>

            <div className="grid grid-cols-[90px_10px_1fr]">
              <span>Barang</span>
              <span>:</span>
              <span className="font-bold uppercase">{device}</span>
            </div>

            <div className="grid grid-cols-[90px_10px_1fr]">
              <span>S/N</span>
              <span>:</span>
              <span>{receiptTx.serialNumber || receiptTx.imei || '-'}</span>
            </div>

            <div className="grid grid-cols-[90px_10px_1fr]">
              <span>Kelengkapan</span>
              <span>:</span>
              <span>{receiptTx.equipment || 'UNIT'}</span>
            </div>

            <div className="grid grid-cols-[90px_10px_1fr]">
              <span>Kerusakan</span>
              <span>:</span>
              <span className="font-semibold uppercase">{damageDesc}</span>
            </div>

            <div className="grid grid-cols-[90px_10px_1fr]">
              <span>Ket.Tindakan</span>
              <span>:</span>
              <span className="font-semibold uppercase">{actionDesc}</span>
            </div>

            <div className="grid grid-cols-[90px_10px_1fr]">
              <span>Catatan</span>
              <span>:</span>
              <span className="uppercase">{noteAuthor}</span>
            </div>

            <div className="grid grid-cols-[90px_10px_1fr]">
              <span>Biaya Servis</span>
              <span>:</span>
              <span className="font-bold">{formatRp(totalAmount)}</span>
            </div>

            <div className="grid grid-cols-[90px_10px_1fr]">
              <span>Uang Muka</span>
              <span>:</span>
              <span>{formatRp(downPayment)}</span>
            </div>

            <div className="grid grid-cols-[90px_10px_1fr]">
              <span>Status Bayar</span>
              <span>:</span>
              <span className="font-extrabold uppercase">{isPaid ? 'LUNAS' : 'MENUNGGU PEMBAYARAN'}</span>
            </div>

            <div className="grid grid-cols-[90px_10px_1fr]">
              <span>Cara Bayar</span>
              <span>:</span>
              <span>{paymentMethod}</span>
            </div>

            <div className="grid grid-cols-[90px_10px_1fr]">
              <span>Garansi</span>
              <span>:</span>
              <span className="font-bold">{warrantyStr}</span>
            </div>

            <div className="grid grid-cols-[90px_10px_1fr]">
              <span>Teknisi</span>
              <span>:</span>
              <span>{technician}</span>
            </div>

            <div className="grid grid-cols-[90px_10px_1fr]">
              <span>QC</span>
              <span>:</span>
              <span>..................</span>
            </div>

            <div className="grid grid-cols-[90px_10px_1fr]">
              <span>Tgl Ambil</span>
              <span>:</span>
              <span>{dateStr}</span>
            </div>

            <div className="grid grid-cols-[90px_10px_1fr]">
              <span>Pengambil</span>
              <span>:</span>
              <span className="font-bold uppercase">{customerName}</span>
            </div>
          </div>

          <div className="border-b border-dashed border-black/40 my-2"></div>

          {/* QR CODE AREA */}
          <div className="text-center py-1">
            {qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="QR Code Lacak Servis & Garansi" 
                className="w-28 h-28 mx-auto object-contain block"
              />
            ) : (
              <div className="w-28 h-28 mx-auto border border-black flex items-center justify-center text-[10px]">
                QR CODE
              </div>
            )}
            <div className="text-[9.5px] mt-1 font-sans">
              Scan QR Code ini untuk Cek Online
            </div>
          </div>

          {/* FOOTER STRUK */}
          <div className="text-center text-[9px] text-black space-y-0.5 pt-1">
            <div>Dicetak {technician} [{printTimestamp}]</div>
            <div className="pt-0.5 leading-tight">
              Terima kasih atas kepercayaan Anda telah melakukan servis di<br />
              <strong className="tracking-wide">NGALAM FIX PRO</strong>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1 no-print">
          {!isPaid && onConfirmSettle ? (
            <button
              type="button"
              onClick={() => onConfirmSettle(receiptTx)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Konfirmasi Lunas &amp; Cetak Struk</span>
            </button>
          ) : null}

          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Nota Servis (Thermal)</span>
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
