import React from 'react';
import { ShieldCheck, Clock } from 'lucide-react';
import { formatDateId } from '../../utils/api';

export default function LogsTab({ activityLogs }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Audit Trail &amp; Log Aktivitas Sistem</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rekam jejak setiap aksi kasir, pergantian status lab teknisi, dan pencairan komisi.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">
          {activityLogs.length} Entri
        </span>
      </div>

      <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
        {activityLogs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            Belum ada aktivitas tercatat pada audit log.
          </div>
        ) : (
          activityLogs.slice(0, 50).map((log, idx) => (
            <div key={idx} className="py-3 text-xs flex items-start justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
                <div>
                  <span className="font-semibold text-slate-900">
                    {log.action || log.type || 'Aktivitas'}
                  </span>
                  <p className="text-slate-600 text-[11px] mt-0.5 break-all">
                    {log.description || log.message || JSON.stringify(log)}
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-mono shrink-0 whitespace-nowrap flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDateId(log.performed_at || log.timestamp || log.created_at)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
