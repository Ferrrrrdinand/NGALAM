import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Printer, Download, ShieldCheck, User, Phone, MapPin, Sparkles } from 'lucide-react';

interface MemberQrCardModalProps {
  customer: {
    id: string;
    name: string;
    whatsapp?: string;
    phone?: string;
    email?: string;
    district?: string;
    status?: string;
  };
  onClose: () => void;
}

export default function MemberQrCardModal({ customer, onClose }: MemberQrCardModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const phoneNum = customer.whatsapp || customer.phone || '';
  const memberCode = `MBR-${String(customer.id || '').replace(/^USR-|^CUST-/, '') || phoneNum || '001'}`;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ngalamfixpro.com';
  const qrTargetUrl = `${origin}/lacak?search=${encodeURIComponent(phoneNum || customer.id)}&member=${encodeURIComponent(customer.id)}`;

  useEffect(() => {
    QRCode.toDataURL(qrTargetUrl, {
      width: 450,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('[Member QR Error]', err));
  }, [qrTargetUrl]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-member-card, #printable-member-card * {
            visibility: visible !important;
          }
          #printable-member-card {
            position: absolute !important;
            left: 50% !important;
            top: 20px !important;
            transform: translateX(-50%) !important;
            width: 380px !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: 2px solid #000000 !important;
            padding: 16px !important;
            background: #ffffff !important;
            color: #000000 !important;
            page-break-inside: avoid !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 border border-amber-300">
        {/* Header Modal (No Print) */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-900 leading-tight">
                Kartu QR Code Member Resmi
              </h3>
              <p className="text-[11px] text-slate-500">ID Member &amp; QR Prioritas Ngalam Fix Pro</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Member Card Area */}
        <div
          id="printable-member-card"
          className="rounded-2xl border-2 border-slate-900 bg-white p-4 text-center space-y-3 shadow-lg relative overflow-hidden"
        >
          {/* Card Top Brand Header */}
          <div className="bg-slate-950 text-white p-3 rounded-xl border border-amber-500/40 text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1.5 text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[11px] font-black uppercase tracking-widest">NGALAM FIX PRO</span>
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-sm font-black text-white tracking-wide">
              KARTU MEMBER PRIORITAS LAB
            </h4>
            <span className="text-[10px] text-amber-300 font-medium block">
              Diskon Servis 5% • Garansi Terhubung Sistem
            </span>
          </div>

          {/* Member Identity Header */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Member:</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Member Aktif
              </span>
            </div>
            <div className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="truncate">{customer.name}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5">
              <span className="flex items-center gap-1 font-mono font-bold text-slate-700">
                <Phone className="w-3 h-3 text-emerald-600" />
                {phoneNum || '-'}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-slate-500">
                <MapPin className="w-3 h-3 text-slate-400" />
                {customer.district || 'Kota Malang'}
              </span>
            </div>
          </div>

          {/* PROMINENT HIGH-CONTRAST ID QR BOX - TEFAT DI ATAS QR CODE (TERLIHAT SANGAT JELAS SAAT DIPRINT) */}
          <div className="w-full bg-black text-white p-2.5 rounded-xl border-2 border-black text-center shadow-xs">
            <span className="text-[9.5px] font-bold text-amber-400 uppercase tracking-wider block">
              NOMOR IDENTITAS QR MEMBER RESMI
            </span>
            <div className="text-base sm:text-lg font-mono font-black text-amber-300 tracking-wider">
              ID QR: <span className="text-white">{memberCode}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-300 block">
              SISTEM ID: {customer.id}
            </span>
          </div>

          {/* QR Code Canvas Box */}
          <div className="p-2.5 bg-white rounded-xl border-2 border-dashed border-slate-800 inline-block shadow-inner mx-auto max-w-[260px] relative">
            {qrDataUrl ? (
              <div className="relative">
                <img
                  src={qrDataUrl}
                  alt={`QR Member ${customer.name}`}
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto"
                />
                {/* Center Badge Shield */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="w-10 h-10 rounded-full bg-slate-950 text-amber-400 font-mono font-black text-xs border-2 border-amber-400 flex items-center justify-center shadow-md">
                    NFP
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400 font-semibold">
                Membuat QR Code...
              </div>
            )}
          </div>

          {/* Scan Instructions */}
          <div className="text-[10.5px] text-slate-600 space-y-0.5 leading-snug">
            <p className="font-semibold text-slate-800">
              Tunjukkan QR Code ini ke Kasir Workshop untuk klaim Diskon 5%
            </p>
            <p className="font-mono text-[9.5px] text-slate-400">
              Workshop &amp; Lab: Jl. Soekarno Hatta, Malang • WA: 0811-318-5858
            </p>
          </div>
        </div>

        {/* Action Buttons (No Print) */}
        <div className="grid grid-cols-2 gap-2 pt-1 no-print">
          <button
            type="button"
            onClick={handlePrint}
            className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Cetak Kartu Member</span>
          </button>

          {qrDataUrl ? (
            <a
              href={qrDataUrl}
              download={`QR_MEMBER_${memberCode}_${customer.name.replace(/\s+/g, '_')}.png`}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer text-center transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Unduh PNG</span>
            </a>
          ) : (
            <button
              disabled
              className="py-2.5 px-3 rounded-xl bg-slate-200 text-slate-400 text-xs font-bold cursor-not-allowed"
            >
              Menyiapkan...
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
