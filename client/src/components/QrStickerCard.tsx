import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, CheckSquare, Square, Sparkles } from 'lucide-react';

export interface StickerCardProps {
  type: 'mitra' | 'member';
  numStr: string;
  qrId: string;
  systemId: string;
  code: string;
  targetUrl: string;
  name?: string;
  phone?: string;
  district?: string;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onDownloadSingle?: () => void;
  showCheckbox?: boolean;
}

export default function QrStickerCard({
  type,
  numStr,
  qrId,
  systemId,
  code,
  targetUrl,
  name,
  phone,
  district,
  isSelected,
  onToggleSelect,
  onDownloadSingle,
  showCheckbox = true
}: StickerCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(targetUrl, {
      width: 320,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => console.error('[QR Sticker Error]', err));

    return () => {
      isMounted = false;
    };
  }, [targetUrl]);

  const isMitra = type === 'mitra';
  const hasOwner = Boolean(name && name.trim() && name !== '-' && !name.toLowerCase().includes('belum'));

  return (
    <div
      onClick={onToggleSelect}
      className={`qr-sticker-card p-3 rounded-2xl border-2 transition-all relative flex flex-col items-center justify-between text-center space-y-2.5 cursor-pointer bg-white ${
        isSelected
          ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-400 shadow-md'
          : 'border-slate-200 hover:border-amber-400 shadow-xs hover:shadow-md'
      }`}
    >
      {/* Top Bar inside Card (No Print) */}
      <div className="w-full flex items-center justify-between text-[10px] font-black uppercase text-amber-700 tracking-wider border-b border-slate-100 pb-1.5 no-print">
        {showCheckbox ? (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={onToggleSelect}
              className="text-amber-600 hover:text-amber-700 cursor-pointer"
              title={isSelected ? 'Hapus pilihan' : 'Pilih untuk download ZIP'}
            >
              {isSelected ? (
                <CheckSquare className="w-4 h-4 fill-amber-500 text-white" />
              ) : (
                <Square className="w-4 h-4 text-slate-300 hover:text-amber-500" />
              )}
            </button>
            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-[9px] font-bold">
              #{numStr}
            </span>
          </div>
        ) : (
          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-[9px] font-bold">
            #{numStr}
          </span>
        )}

        <span className="font-mono text-slate-900 font-bold text-[11px] truncate max-w-[120px]">
          {code}
        </span>

        {onDownloadSingle && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDownloadSingle();
            }}
            className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-100 rounded-md transition-colors cursor-pointer"
            title="Download PNG (In-Memory)"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* STIKER PRINTABLE CONTENT CONTAINER */}
      <div className="w-full bg-white rounded-xl border border-slate-300 p-2.5 space-y-2 shadow-2xs">
        {/* Header Kartu */}
        <div className="bg-slate-950 text-white py-1.5 px-2 rounded-lg text-center space-y-0.5">
          <div className="flex items-center justify-center gap-1 text-[9px] font-black text-amber-400 uppercase tracking-widest">
            <Sparkles className="w-2.5 h-2.5" />
            <span>NGALAM FIX PRO</span>
            <Sparkles className="w-2.5 h-2.5" />
          </div>
          <div className="text-[10.5px] font-black tracking-wide text-white">
            {isMitra ? 'MITRA RESMI SPESIALIS SERVIS HP' : 'KARTU MEMBER PRIORITAS LAB'}
          </div>
          {!isMitra && (
            <span className="inline-block px-2 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[8.5px] font-black uppercase tracking-wider">
              MEMBER PRIORITAS #{numStr}
            </span>
          )}
        </div>

        {/* Promo Ribbon */}
        <div className="py-1 px-1.5 rounded-md bg-emerald-50 border border-emerald-200 text-[9.5px] text-emerald-800 font-extrabold text-center">
          🎁 {isMitra ? 'SCAN UNTUK DISKON SERVIS 5%' : 'PRIVILEGE MEMBER: DISKON SERVIS 5%'}
        </div>

        {/* PROMINENT HIGH-CONTRAST ID QR BOX - TEPAT DI ATAS QR CODE (TERLIHAT SANGAT JELAS SAAT DIPRINT) */}
        <div className="w-full bg-black text-white py-1 px-1.5 rounded-lg border-2 border-black text-center shadow-xs">
          <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest block">
            IDENTITAS RESMI {isMitra ? 'MITRA' : 'MEMBER'}
          </span>
          <div className="text-[11px] font-mono font-black text-amber-300 tracking-wider">
            ID QR: <span className="text-white">{code}</span>
          </div>
          <span className="text-[8.5px] font-mono text-slate-300 block truncate">
            {systemId}
          </span>
        </div>

        {/* QR Code Canvas Frame */}
        <div className="p-1.5 bg-white rounded-lg border-2 border-dashed border-slate-800 inline-block mx-auto relative max-w-[170px]">
          {qrDataUrl ? (
            <div className="relative">
              <img
                src={qrDataUrl}
                alt={`QR ${code}`}
                className="w-36 h-36 object-contain mx-auto"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="w-7 h-7 rounded-full bg-slate-950 text-amber-400 font-mono font-black text-[9px] border-2 border-amber-400 flex items-center justify-center shadow-sm">
                  NFP
                </span>
              </div>
            </div>
          ) : (
            <div className="w-36 h-36 flex items-center justify-center text-[10px] text-slate-400 font-semibold">
              Menyiapkan QR...
            </div>
          )}
        </div>

        {/* Info Box (Khusus Member) */}
        {!isMitra && (
          <div className="p-1.5 rounded-md bg-slate-50 border border-slate-200 text-left text-[9px] space-y-0.5">
            <div className="text-slate-500 font-bold uppercase text-[8px]">
              NAMA MEMBER:
            </div>
            <div className="font-bold text-slate-900 truncate">
              {hasOwner ? name : 'Member Prioritas'}
            </div>
            {phone && phone !== '-' && (
              <div className="font-mono text-emerald-700 font-bold text-[8.5px]">
                WA: {phone}
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="text-[8px] text-slate-500 border-t border-slate-200 pt-1 flex items-center justify-between">
          <span>Ngalam Fix Pro</span>
          <span className="font-mono font-bold text-amber-700">0811-318-5858</span>
        </div>
      </div>
    </div>
  );
}
