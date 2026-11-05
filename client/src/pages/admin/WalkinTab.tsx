import React from 'react';
import { Plus, CheckCircle2, User, Phone, Smartphone, ShieldCheck } from 'lucide-react';

export default function WalkinTab({
  walkin,
  setWalkin,
  walkinSuccess,
  handleWalkinSubmit
}) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Pendaftaran Unit Masuk Walk-in</span>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Meja 1 Front Desk
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Input unit baru pelanggan langsung di counter untuk menerbitkan tiket servis fisik &amp; notifikasi WhatsApp.
          </p>
        </div>
      </div>

      {walkinSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center gap-2.5 shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{walkinSuccess}</span>
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
        <form onSubmit={handleWalkinSubmit} className="space-y-6">
          
          {/* Section 1: Data Pelanggan */}
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Data Pelanggan
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama Pelanggan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bpk. Ferdinand"
                  value={walkin.customerName}
                  onChange={(e) => setWalkin({ ...walkin, customerName: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="08123456789"
                    value={walkin.whatsapp}
                    onChange={(e) => setWalkin({ ...walkin, whatsapp: e.target.value })}
                    className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-mono transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Data Perangkat & Diagnosa */}
          <div className="space-y-4 pt-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" /> Spesifikasi Perangkat &amp; Kerusakan
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tipe / Model Smartphone <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: iPhone 13 Pro 128GB"
                  value={walkin.phoneType}
                  onChange={(e) => setWalkin({ ...walkin, phoneType: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Estimasi Biaya Reparasi Awal (Rp)
                </label>
                <div className="relative">
                  <span className="text-xs font-bold text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2">Rp</span>
                  <input
                    type="number"
                    placeholder="250000"
                    value={walkin.estimatedCost}
                    onChange={(e) => setWalkin({ ...walkin, estimatedCost: e.target.value })}
                    className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-mono transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Keluhan Gejala / Kerusakan Fisik
              </label>
              <textarea
                rows={3}
                placeholder="Jelaskan kondisi unit saat diterima: LCD retak, garis hijau, tombol volume macet, terkena air..."
                value={walkin.damage}
                onChange={(e) => setWalkin({ ...walkin, damage: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-amber-600 text-white font-semibold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Daftarkan Unit &amp; Terbitkan Tiket Antrian</span>
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-2.5 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Unit otomatis didaftarkan ke antrian Step 1 Lab Meja Teknisi.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
