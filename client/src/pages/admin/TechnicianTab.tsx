import React from 'react';
import { Wrench, CheckCircle2 } from 'lucide-react';
import { formatRp } from '../../utils/api';

export default function TechnicianTab({
  orders,
  techSuccess,
  techFilter,
  setTechFilter,
  loading,
  handleUpdateStep
}) {
  const stepsList = [
    { num: 1, name: '1. Intake' },
    { num: 2, name: '2. Diagnosa' },
    { num: 3, name: '3. Kerja' },
    { num: 4, name: '4. QC' },
    { num: 5, name: '5. Selesai' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-600" />
            <span>Meja Kerja Lab Teknisi Terpadu</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pantau dan majukan status progres reparasi unit dari Step 1 sampai Step 5 tanpa perlu beralih ke portal teknisi.
          </p>
        </div>

        {techSuccess && (
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {techSuccess}
          </span>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: `Semua Unit (${orders.length})` },
          { id: 'step1', label: `Step 1: Intake (${orders.filter(o => (o.currentStep || 1) === 1).length})` },
          { id: 'step2', label: `Step 2: Diagnosa (${orders.filter(o => o.currentStep === 2).length})` },
          { id: 'step3', label: `Step 3: Pengerjaan (${orders.filter(o => o.currentStep === 3).length})` },
          { id: 'step4', label: `Step 4: QC Check (${orders.filter(o => o.currentStep === 4).length})` },
          { id: 'step5', label: `Step 5: Selesai (${orders.filter(o => o.currentStep === 5).length})` },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setTechFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs whitespace-nowrap transition-all cursor-pointer ${
              techFilter === f.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-16 text-center">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-amber-600 animate-spin"></div>
            <span className="text-xs font-semibold text-slate-500">Memuat status pengerjaan unit lab...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders
            .filter(o => {
              const step = o.currentStep || 1;
              if (techFilter === 'all') return true;
              if (techFilter === 'step1') return step === 1;
              if (techFilter === 'step2') return step === 2;
              if (techFilter === 'step3') return step === 3;
              if (techFilter === 'step4') return step === 4;
              if (techFilter === 'step5') return step === 5;
              return true;
            })
            .map(o => {
              const currentStep = o.currentStep || 1;
              return (
                <div key={o.id} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:border-slate-300 transition-all space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-3">
                    
                    {/* Header Card */}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded inline-block">
                          {o.id}
                        </span>
                        <div className="text-sm font-bold text-slate-900 mt-1.5">{o.phoneType}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        currentStep === 5
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        Step {currentStep}/5
                      </span>
                    </div>

                    {/* Customer & Issue Info */}
                    <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Pelanggan:</span>
                        <strong className="text-slate-800">{o.customerName}</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Kontak WhatsApp:</span>
                        <span className="font-mono text-slate-700">{o.whatsapp || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Estimasi Biaya:</span>
                        <strong className="text-slate-900">{formatRp(o.cost || 0)}</strong>
                      </div>
                      <div className="pt-1 border-t border-slate-200/70 text-slate-600">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Keluhan:</span>
                        <p className="line-clamp-2 mt-0.5 text-[11px]">{o.damage || 'Pemeriksaan umum unit'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Step Buttons */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Pindah Tahap Pengerjaan</span>
                    <div className="grid grid-cols-5 gap-1">
                      {stepsList.map(s => {
                        const isCurrent = currentStep === s.num;
                        const isPast = currentStep > s.num;
                        return (
                          <button
                            key={s.num}
                            onClick={() => handleUpdateStep(o.id, s.num)}
                            title={s.name}
                            className={`py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-center ${
                              isCurrent
                                ? 'bg-amber-600 text-white shadow-xs'
                                : isPast
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {s.num}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
