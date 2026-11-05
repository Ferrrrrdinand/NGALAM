import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  Clock,
  Wrench,
  ShieldCheck,
  Check,
  AlertCircle,
  Copy,
  Smartphone,
  User,
  Phone,
  Sparkles,
  ArrowRight,
  Printer,
  Share2,
  X,
  CreditCard,
  Microscope,
  MapPin
} from 'lucide-react';
import { fetchApi, formatRp } from '../utils/api';

/**
 * Normalisasi tipe smartphone agar tidak ada duplikasi brand (misal: "SAMSUNG Samsung Galaxy...")
 */
function cleanPhoneType(val?: string): string {
  if (!val) return 'Smartphone';
  let cleaned = val.trim();
  // Hilangkan kata awalan yang sama berulang (contoh: "SAMSUNG Samsung ...")
  cleaned = cleaned.replace(/^([A-Za-z]+)\s+\1\s+/i, '$1 ');
  return cleaned;
}

export default function Lacak() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [ticketInput, setTicketInput] = useState(searchParams.get('id') || '');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copyToast, setCopyToast] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  const performLookup = async (idToSearch?: string) => {
    const q = (idToSearch !== undefined ? idToSearch : ticketInput).trim();
    if (!q) return;

    setLoading(true);
    setErrorMsg('');
    setOrder(null);

    try {
      const res = await fetchApi(`/api/orders/${encodeURIComponent(q)}`);
      if (res.ok && res.data && res.data.success) {
        setOrder(res.data.data);
        // Sinkronisasi query param di URL tanpa reload
        setSearchParams({ id: q }, { replace: true });
      } else {
        setErrorMsg(res.data?.message || 'Nomor tiket, WhatsApp, atau email tidak ditemukan di antrean workshop.');
      }
    } catch {
      setErrorMsg('Gagal terhubung ke server workshop untuk melacak unit. Pastikan koneksi internet stabil.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialId = searchParams.get('id');
    if (initialId) {
      setTicketInput(initialId);
      performLookup(initialId);
    }
  }, []);

  const handleCopyTicket = (id: string) => {
    if (!id) return;
    navigator.clipboard?.writeText(id);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2500);
  };

  const handleShareLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2500);
  };

  const steps = [
    {
      num: 1,
      title: 'Registrasi & Intake',
      shortDesc: 'Penerimaan Meja 1',
      desc: 'Unit HP diterima petugas, inspeksi fisik awal & penerbitan tiket resmi.'
    },
    {
      num: 2,
      title: 'Diagnosa Lab',
      shortDesc: 'Analisa Kerusakan',
      desc: 'Pemeriksaan jalur sirkuit, deteksi thermal & pengecekan ketersediaan suku cadang.'
    },
    {
      num: 3,
      title: 'Pengerjaan Lab',
      shortDesc: 'Reparasi Presisi',
      desc: 'Perbaikan mikro-soldering, laminasi OCA, atau instalasi komponen baru di meja teknisi.'
    },
    {
      num: 4,
      title: 'Quality Control',
      shortDesc: 'Pengujian 24 Titik',
      desc: 'Uji fungsi layar, kamera, baterai, sinyal & charging sebelum penyerahan.'
    },
    {
      num: 5,
      title: 'Selesai & Siap Ambil',
      shortDesc: 'Garansi Aktif',
      desc: 'Unit siap diserahkan di counter workshop atau dikirim via kurir, sertifikat garansi aktif.'
    }
  ];

  const currentStep = order ? parseInt(order.step || order.currentStep || 1, 10) : 1;
  const isCompletedOrder = currentStep >= 5;

  return (
    <div className="min-h-screen bg-slate-50/60 py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* ======================================================== */}
        {/* HEADER & SEARCH BAR */}
        {/* ======================================================== */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-bold tracking-wide uppercase shadow-2xs mb-3">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            <span>Workshop Live Tracker • Meja Lab Terbuka</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Lacak Status Unit Servis HP
          </h1>

          <p className="text-sm sm:text-base text-slate-600 mt-2.5 leading-relaxed">
            Pantau tahapan pengerjaan perangkat Anda di lab workshop secara transparan, akurat, dan real-time.
          </p>

          {/* Form Pencarian Tiket */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              performLookup();
            }}
            className="mt-6 flex flex-col sm:flex-row items-center gap-2.5 bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-sm focus-within:border-amber-400 focus-within:ring-3 focus-within:ring-amber-100 transition-all"
          >
            <div className="relative flex-1 w-full flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Nomor Tiket (NGF-...) atau Nomor WhatsApp..."
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                className="w-full pl-11 pr-9 py-2.5 text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
              />
              {ticketInput && (
                <button
                  type="button"
                  onClick={() => {
                    setTicketInput('');
                    setOrder(null);
                    setErrorMsg('');
                  }}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-1"
                  title="Hapus pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white shadow-md shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-70"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Mencari Data...</span>
                </>
              ) : (
                <>
                  <span>Lacak Unit</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Alert Error */}
          {errorMsg && (
            <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-4 py-2.5 rounded-xl shadow-2xs text-left animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* ORDER TRACKING RESULT CARD */}
        {/* ======================================================== */}
        {order ? (
          <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xl overflow-hidden animate-fadeIn">
            {/* Top Gold Aesthetic Bar */}
            <div className="h-2 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-300"></div>

            <div className="p-6 sm:p-8 space-y-8">

              {/* CARD TOP ROW: Device info & Status badge */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-mono text-xs font-bold shadow-2xs">
                      <span>{order.id}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyTicket(order.id)}
                        className="text-amber-700 hover:text-amber-950 transition-colors ml-1"
                        title="Salin Nomor Tiket"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </span>

                    {copyToast && (
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 animate-fadeIn">
                        ✓ Disalin!
                      </span>
                    )}

                    <span className="text-xs text-slate-400 font-medium">
                      Masuk: {order.createdAt || 'Baru Saja'}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>{cleanPhoneType(order.phoneType)}</span>
                  </h2>

                  <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap pt-0.5">
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <strong>{order.customerName}</strong>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="inline-flex items-center gap-1 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.whatsapp || '-'}</span>
                    </span>
                    {order.district && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{order.district}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Status Pill Indicator */}
                <div className="self-start md:self-center">
                  {isCompletedOrder ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs sm:text-sm shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>SELESAI &amp; SIAP DIAMBIL</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 font-bold text-xs sm:text-sm shadow-2xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                      <span>TAHAP {currentStep} DARI 5: {steps[currentStep - 1]?.shortDesc}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ==================================================== */}
              {/* 5-STAGE CONNECTED LUXURY STEPPER */}
              {/* ==================================================== */}
              <div className="py-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Proses Pengerjaan di Meja Lab
                  </h3>
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/70">
                    {steps[currentStep - 1]?.title}
                  </span>
                </div>

                {/* Stepper Container (Desktop Horizontal / Mobile Optimized) */}
                <div className="relative">
                  {/* Connecting Background Line (Desktop) */}
                  <div className="hidden sm:block absolute top-5 left-8 right-8 h-1 bg-slate-200 -z-0 rounded-full">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-amber-400 rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.min(100, Math.max(0, ((currentStep - 1) / (steps.length - 1)) * 100))}%`
                      }}
                    ></div>
                  </div>

                  {/* Steps List */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-2 relative z-10">
                    {steps.map((st) => {
                      const isCompleted = currentStep > st.num;
                      const isActive = currentStep === st.num;
                      const isUpcoming = currentStep < st.num;

                      return (
                        <div
                          key={st.num}
                          className={`flex sm:flex-col items-center sm:text-center gap-3.5 sm:gap-2.5 p-3 sm:p-2 rounded-2xl transition-all ${
                            isActive
                              ? 'bg-amber-50/70 sm:bg-transparent border border-amber-200/80 sm:border-transparent'
                              : 'bg-white sm:bg-transparent'
                          }`}
                        >
                          {/* Step Node Circle */}
                          <div
                            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-all ${
                              isCompleted
                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                                : isActive
                                ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/30 ring-4 ring-amber-100'
                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="w-5 h-5 text-white stroke-[3]" />
                            ) : (
                              <span>{st.num}</span>
                            )}
                          </div>

                          {/* Step Text Info */}
                          <div className="flex-1 sm:w-full">
                            <div className="flex items-center sm:justify-center gap-1.5">
                              <h4
                                className={`text-xs sm:text-xs font-bold leading-tight ${
                                  isActive
                                    ? 'text-amber-950 font-extrabold'
                                    : isCompleted
                                    ? 'text-slate-800'
                                    : 'text-slate-400'
                                }`}
                              >
                                {st.title}
                              </h4>
                              {isActive && (
                                <span className="inline sm:hidden text-[10px] font-black uppercase text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded">
                                  Aktif
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 leading-snug mt-0.5 line-clamp-2">
                              {st.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ==================================================== */}
              {/* DETAILS & SPECIFICATION CARDS GRID (4 KOLOM) */}
              {/* ==================================================== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Card 1: Kerusakan */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wide">
                    <Wrench className="w-3.5 h-3.5 text-slate-500" />
                    <span>Kendala Kerusakan</span>
                  </div>
                  <strong className="text-sm font-bold text-slate-900 block leading-snug">
                    {order.damage || order.damageDescription || 'Pemeriksaan Kerusakan'}
                  </strong>
                  <span className="text-[11px] text-slate-400 block">Suku Cadang Grade Original</span>
                </div>

                {/* Card 2: Biaya & Status Bayar */}
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wide">
                    <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                    <span>Total Estimasi Biaya</span>
                  </div>
                  <strong className="text-lg font-black text-slate-900 font-mono block">
                    {formatRp(order.cost || 0)}
                  </strong>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      order.paid
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {order.paid ? '● Lunas Kasir' : '○ Menunggu Pembayaran'}
                  </span>
                </div>

                {/* Card 3: Teknisi Meja Lab */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wide">
                    <Microscope className="w-3.5 h-3.5 text-slate-500" />
                    <span>Teknisi Meja Lab</span>
                  </div>
                  <strong className="text-sm font-bold text-amber-900 block leading-snug">
                    {order.technician || 'Meja Lab Workshop'}
                  </strong>
                  <span className="text-[11px] text-slate-500 block">Meja Kerja Lab Transparan</span>
                </div>

                {/* Card 4: Garansi Workshop (Dinamis: Baterai 90 Hari, Lainnya 7-30 Hari) */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wide">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Garansi Workshop</span>
                  </div>
                  <strong className="text-sm font-bold text-emerald-950 block leading-snug">
                    {order.warranty?.warrantyTypeLabel || (
                      /baterai|battery/i.test(order.damageDescription || order.damage || '')
                        ? 'Garansi Baterai 90 Hari (3 Bulan)'
                        : 'Garansi Servis (1 Minggu s/d 1 Bulan)'
                    )}
                  </strong>
                  <span className="text-[11px] text-emerald-700 block font-medium">
                    {order.warranty?.statusLabel || 'Jaminan Perlindungan Tertulis'}
                  </span>
                </div>
              </div>

              {/* Catatan Tambahan Diagnosa Teknisi (Jika Ada) */}
              {order.diagnoseNote && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block text-amber-950 mb-0.5">
                      Catatan Diagnosa Teknisi Lab:
                    </strong>
                    <span>{order.diagnoseNote}</span>
                  </div>
                </div>
              )}

              {/* ==================================================== */}
              {/* ACTION TOOLBAR */}
              {/* ==================================================== */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <a
                  href={`https://wa.me/6281330304321?text=${encodeURIComponent(
                    `Halo Admin & CS Ngalam Fix Pro,\nSaya ingin menanyakan progress perbaikan unit saya:\n• Nomor Tiket: ${order.id}\n• Tipe HP: ${cleanPhoneType(order.phoneType)}\n• Nama: ${order.customerName}\n• Tahap Saat Ini: Tahap ${currentStep} (${steps[currentStep - 1]?.title})\nTerima kasih!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                  <span>Tanya Teknisi via WhatsApp</span>
                </a>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleShareLink}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{shareToast ? '✓ Link Disalin!' : 'Bagikan Link'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Cetak Bukti</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* Empty Search Prompt Guidance */
          <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center mx-auto text-amber-600 shadow-2xs">
              <Sparkles className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Pantau Progres Servis Unit Anda
            </h3>

            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
              Silakan masukkan <strong>Nomor Tiket Servis</strong> (contoh: <code>NGF-20261105-8577</code>) atau <strong>Nomor WhatsApp</strong> yang Anda daftarkan saat pendaftaran servis.
            </p>

            <div className="pt-2 flex items-center justify-center gap-3">
              <Link
                to="/pesan-servis"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-900 hover:underline"
              >
                <span>Belum punya tiket? Pesan Servis Baru</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
