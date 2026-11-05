import React from 'react';
import { Gift, Tag, CheckCircle2, XCircle } from 'lucide-react';

export default function PromosTab({ promos }) {
  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Gift className="w-4 h-4 text-amber-600" />
            <span>Manajemen Banner Promo &amp; Diskon Reparasi</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Daftar voucher diskon dan promosi musiman aktif yang tampil di website utama pelanggan.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700">
          Total {promos.length} Banner
        </span>
      </div>

      {/* Promos Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promos.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200/80 text-center text-slate-400 text-xs">
            Belum ada banner promo tersimpan.
          </div>
        ) : (
          promos.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200/60 px-2 py-0.5 rounded">
                    <Tag className="w-3 h-3" />
                    {p.code || 'PROMO'}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    p.active 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {p.active ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-slate-400" />}
                    {p.active ? 'Aktif Tayang' : 'Non-aktif'}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 leading-snug">{p.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Potongan Diskon:</span>
                  <span className="text-sm font-bold text-rose-600">{p.discount}</span>
                </div>
                {p.validUntil && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Berlaku Sampai:</span>
                    <span className="text-xs text-slate-600 font-mono font-medium">{p.validUntil}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
