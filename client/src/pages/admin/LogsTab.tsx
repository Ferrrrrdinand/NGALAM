import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Clock,
  Search,
  User,
  UserCheck,
  UserPlus,
  LogIn,
  LogOut,
  Wrench,
  CreditCard,
  Cpu,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  RotateCcw,
  FileJson,
  Filter,
  Sparkles
} from 'lucide-react';
import { formatDateId } from '../../utils/api';

export interface ActivityLogItem {
  id?: string | number;
  action?: string;
  type?: string;
  table_name?: string;
  record_id?: string;
  payload?: any;
  performed_at?: string;
  timestamp?: string;
  created_at?: string;
  technicianName?: string;
  username?: string;
  details?: string;
  description?: string;
  message?: string;
  statusBadge?: string;
  [key: string]: any;
}

interface LogsTabProps {
  activityLogs: ActivityLogItem[];
}

function safeJsonParse(val: any): Record<string, any> {
  if (!val) return {};
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return { raw: String(val) };
  }
}

function getRelativeTime(dateStr?: string | Date | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (isNaN(diffSec)) return '';
    if (diffSec < 60) return 'Baru saja';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mnt lalu`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam lalu`;
    if (diffSec < 172800) return 'Kemarin';
    return `${Math.floor(diffSec / 86400)} hari lalu`;
  } catch {
    return '';
  }
}

function parseLogData(log: ActivityLogItem) {
  const action = (log.action || log.type || 'AKTIVITAS').toUpperCase();
  const payload = safeJsonParse(log.payload);

  const actorName =
    payload.name ||
    log.technicianName ||
    log.name ||
    payload.username ||
    log.username ||
    'Sistem';

  const role = payload.role || log.role || '';
  const username = payload.username || log.username || '';
  const phone = payload.whatsapp || payload.phone || '';
  const district = payload.district || '';
  const registeredVia = payload.registeredVia || '';

  let category: 'all' | 'staff' | 'customer' | 'order' | 'finance' | 'system' = 'system';
  let title = 'Aktivitas Log';
  let badgeTheme = 'bg-amber-50 text-amber-800 border-amber-200';
  let icon = <Cpu className="w-3.5 h-3.5" />;
  let naturalSentence = '';

  if (action.includes('STAFF_LOGIN')) {
    category = 'staff';
    title = 'Login Staff / Teknisi';
    badgeTheme = 'bg-blue-50 text-blue-700 border-blue-200';
    icon = <LogIn className="w-3.5 h-3.5" />;
    naturalSentence = `Petugas ${actorName}${role ? ` (${role})` : ''} berhasil masuk ke Workshop Console.`;
  } else if (action.includes('STAFF_LOGOUT')) {
    category = 'staff';
    title = 'Logout Staff';
    badgeTheme = 'bg-slate-100 text-slate-700 border-slate-300';
    icon = <LogOut className="w-3.5 h-3.5" />;
    naturalSentence = `Petugas ${actorName} telah logout dari Workshop Console.`;
  } else if (action.includes('CUSTOMER_LOGIN')) {
    category = 'customer';
    title = 'Login Pelanggan';
    badgeTheme = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    icon = <UserCheck className="w-3.5 h-3.5" />;
    naturalSentence = `Pelanggan ${actorName}${phone ? ` (${phone})` : ''} masuk ke portal web.`;
  } else if (action.includes('CUSTOMER_REGISTER')) {
    category = 'customer';
    title = 'Registrasi Pelanggan Baru';
    badgeTheme = 'bg-teal-50 text-teal-700 border-teal-200';
    icon = <UserPlus className="w-3.5 h-3.5" />;
    naturalSentence = `Pendaftaran pelanggan baru: ${actorName}${phone ? ` (${phone})` : ''}${registeredVia ? ` melalui ${registeredVia}` : ''}.`;
  } else if (action.includes('ORDER') || action.includes('INTAKE') || action.includes('WALKIN') || action.includes('STEP')) {
    category = 'order';
    title = 'Operasional Servis & Meja';
    badgeTheme = 'bg-amber-50 text-amber-900 border-amber-300';
    icon = <Wrench className="w-3.5 h-3.5" />;
    naturalSentence = `Pembaruan status operasional servis unit #${log.record_id || ''}.`;
  } else if (action.includes('COMMISSION') || action.includes('PAYMENT') || action.includes('FINANCE') || action.includes('TRANSACTION')) {
    category = 'finance';
    title = 'Keuangan & Komisi';
    badgeTheme = 'bg-purple-50 text-purple-700 border-purple-200';
    icon = <CreditCard className="w-3.5 h-3.5" />;
    naturalSentence = `Aktivitas transaksi keuangan atau komisi mitra #${log.record_id || ''}.`;
  } else {
    category = 'system';
    title = action.replace(/_/g, ' ');
    badgeTheme = 'bg-amber-50/80 text-amber-900 border-amber-200';
    icon = <ShieldCheck className="w-3.5 h-3.5" />;
    naturalSentence = log.details || log.description || log.message || `Aktivitas pada entitas ${log.table_name || 'sistem'} (${log.record_id || '-'}).`;
  }

  // Override natural sentence if explicit details/description exist
  if (log.details || log.description || log.message) {
    naturalSentence = log.details || log.description || log.message;
  }

  return {
    action,
    category,
    title,
    badgeTheme,
    icon,
    naturalSentence,
    actorName,
    role,
    username,
    phone,
    district,
    payload
  };
}

export default function LogsTab({ activityLogs }: LogsTabProps) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'staff' | 'customer' | 'order' | 'finance' | 'system'>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | number | null>(null);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  const logsList = Array.isArray(activityLogs) ? activityLogs : [];

  // Parse and enhance logs
  const parsedLogs = useMemo(() => {
    return logsList.map((log, idx) => ({
      raw: log,
      key: log.id || `log-${idx}`,
      time: log.performed_at || log.timestamp || log.created_at || '',
      parsed: parseLogData(log)
    }));
  }, [logsList]);

  // Statistics counters
  const stats = useMemo(() => {
    const total = parsedLogs.length;
    const staffCount = parsedLogs.filter((l) => l.parsed.category === 'staff').length;
    const customerCount = parsedLogs.filter((l) => l.parsed.category === 'customer').length;
    const orderCount = parsedLogs.filter((l) => l.parsed.category === 'order').length;
    return { total, staffCount, customerCount, orderCount };
  }, [parsedLogs]);

  // Filter & Search
  const filteredLogs = useMemo(() => {
    return parsedLogs.filter(({ raw, parsed }) => {
      // Category filter
      if (filterCategory !== 'all' && parsed.category !== filterCategory) {
        return false;
      }

      // Search keyword filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const actionMatch = parsed.action.toLowerCase().includes(q);
        const nameMatch = parsed.actorName.toLowerCase().includes(q);
        const userMatch = parsed.username.toLowerCase().includes(q);
        const phoneMatch = parsed.phone.toLowerCase().includes(q);
        const descMatch = parsed.naturalSentence.toLowerCase().includes(q);
        const tableMatch = (raw.table_name || '').toLowerCase().includes(q);
        const recordMatch = (raw.record_id || '').toLowerCase().includes(q);
        return actionMatch || nameMatch || userMatch || phoneMatch || descMatch || tableMatch || recordMatch;
      }

      return true;
    });
  }, [parsedLogs, filterCategory, search]);

  const handleCopyJson = (logKey: string | number, data: any) => {
    try {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopiedId(logKey);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error('Failed to copy JSON', e);
    }
  };

  return (
    <div className="space-y-5">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Jejak Log</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">{stats.total}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Terekam di sistem lab</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sesi Petugas</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200/60">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">{stats.staffCount}</div>
          <p className="text-[11px] text-blue-600 font-medium mt-0.5">Admin &amp; Teknisi Lab</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Aktivitas User</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">{stats.customerCount}</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Login &amp; Registrasi Pelanggan</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:border-amber-400 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Servis &amp; Meja</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-800 flex items-center justify-center border border-amber-300/60">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">{stats.orderCount}</div>
          <p className="text-[11px] text-amber-700 font-medium mt-0.5">Operasional Pengerjaan</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Header Toolbar */}
        <div className="p-5 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Log Audit Keamanan &amp; Jejak Sistem</span>
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Real-time Trail
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Rekam jejak setiap aksi autentikasi kasir, status pengerjaan lab teknisi, dan aktivitas sistem.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                {filteredLogs.length} dari {stats.total} Entri
              </span>
            </div>
          </div>

          {/* Search & Category Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama petugas, username, WhatsApp, aksi, atau ID entri..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:bg-white text-slate-800 placeholder-slate-400 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'staff', label: 'Staff / Admin' },
                { id: 'customer', label: 'Pelanggan' },
                { id: 'order', label: 'Servis Lab' },
                { id: 'system', label: 'Sistem' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterCategory(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    filterCategory === tab.id
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Logs Feed */}
        <div className="divide-y divide-slate-100 max-h-[620px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Tidak ada log aktivitas ditemukan</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {search
                  ? `Tidak ada riwayat log yang cocok dengan kata kunci "${search}".`
                  : 'Belum ada aktivitas tercatat pada kategori audit log ini.'}
              </p>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Pencarian
                </button>
              )}
            </div>
          ) : (
            filteredLogs.map(({ raw, key, time, parsed }) => {
              const isExpanded = expandedLogId === key;
              const hasJsonPayload = raw.payload && Object.keys(parsed.payload).length > 0;

              return (
                <div
                  key={key}
                  className="p-4 sm:p-4.5 hover:bg-amber-50/25 transition-colors group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Left: Action Icon, Category Badge & Primary Info */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Category Icon Badge */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 shadow-2xs ${parsed.badgeTheme}`}
                      >
                        {parsed.icon}
                      </div>

                      <div className="space-y-1.5 min-w-0 flex-1">
                        {/* Action Title & Pills */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 tracking-tight">
                            {parsed.title}
                          </span>

                          <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {parsed.action}
                          </span>

                          {raw.record_id && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-50/80 text-amber-900 border border-amber-200 font-medium">
                              {raw.record_id}
                            </span>
                          )}

                          {raw.id && (
                            <span className="text-[10px] font-mono text-slate-400">
                              #{raw.id}
                            </span>
                          )}
                        </div>

                        {/* Natural Language Sentence Description */}
                        <p className="text-xs text-slate-700 font-normal leading-relaxed">
                          {parsed.naturalSentence}
                        </p>

                        {/* Metadata Tags Bar */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-[11px] text-slate-500">
                          {parsed.actorName && (
                            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Aktor: <span className="font-semibold text-slate-900">{parsed.actorName}</span>
                              {parsed.role && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-slate-100 text-slate-600 font-mono">
                                  {parsed.role}
                                </span>
                              )}
                            </span>
                          )}

                          {parsed.phone && (
                            <span className="inline-flex items-center gap-1">
                              WA: <span className="font-mono text-slate-700">{parsed.phone}</span>
                            </span>
                          )}

                          {parsed.district && (
                            <span className="inline-flex items-center gap-1">
                              Wilayah: <span className="text-slate-700">{parsed.district}</span>
                            </span>
                          )}

                          {raw.table_name && (
                            <span className="inline-flex items-center gap-1 text-slate-400">
                              Tabel: <span className="font-mono text-slate-600">{raw.table_name}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Date Time & JSON Toggle */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-1 sm:pt-0">
                      <div className="text-right">
                        <span className="text-[11px] font-semibold text-slate-700 flex items-center sm:justify-end gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {formatDateId(time)}
                        </span>
                        {getRelativeTime(time) && (
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {getRelativeTime(time)}
                          </span>
                        )}
                      </div>

                      {hasJsonPayload && (
                        <button
                          type="button"
                          onClick={() => setExpandedLogId(isExpanded ? null : key)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all border ${
                            isExpanded
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <FileJson className="w-3 h-3 text-amber-700" />
                          <span>{isExpanded ? 'Tutup Detail' : 'Detail Payload'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3 text-slate-500" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-slate-500" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable Technical JSON Viewer */}
                  {isExpanded && (
                    <div className="mt-3.5 pt-3 border-t border-slate-100">
                      <div className="bg-slate-900 rounded-xl p-3 text-slate-200 font-mono text-[11px] border border-slate-800 relative group/code shadow-inner">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            <span>Payload Objek JSON (Tabel: {raw.table_name || 'audit_logs'})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyJson(key, raw.payload || raw)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          >
                            {copiedId === key ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Salin JSON</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="overflow-x-auto text-[11px] leading-relaxed text-amber-200/90 whitespace-pre-wrap">
                          {JSON.stringify(raw.payload || raw, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Audit log otomatis tersinkronisasi ke basis data PostgreSQL &amp; store lokal.</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            Terakhir dimuat: {new Date().toLocaleTimeString('id-ID')} WIB
          </span>
        </div>
      </div>
    </div>
  );
}
