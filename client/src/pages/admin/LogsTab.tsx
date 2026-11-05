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
  Tag,
  Megaphone,
  Star,
  CheckCircle2,
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
    payload.customerName ||
    payload.buyerName ||
    log.technicianName ||
    log.name ||
    payload.username ||
    log.username ||
    'Sistem';

  const role = payload.role || log.role || '';
  const username = payload.username || log.username || '';
  const phone = payload.whatsapp || payload.phone || payload.customerPhone || '';
  const district = payload.district || '';
  const registeredVia = payload.registeredVia || '';

  let category: 'all' | 'staff' | 'customer' | 'order' | 'finance' | 'marketing' | 'system' = 'system';
  let title = 'Aktivitas Log';
  let badgeTheme = 'bg-amber-50 text-amber-800 border-amber-200';
  let icon = <Cpu className="w-3.5 h-3.5" />;
  let naturalSentence = '';

  // 1. Staff & Authentication
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
  } else if (action.includes('USER_CREATE')) {
    category = 'staff';
    title = 'Tambah Akun Petugas/Mitra';
    badgeTheme = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    icon = <UserPlus className="w-3.5 h-3.5" />;
    naturalSentence = `Akun baru dibuat untuk ${actorName}${role ? ` (${role})` : ''} oleh administrator.`;
  } else if (action.includes('USER_UPDATE')) {
    category = 'staff';
    title = 'Update Akun Petugas';
    badgeTheme = 'bg-blue-50 text-blue-700 border-blue-200';
    icon = <User className="w-3.5 h-3.5" />;
    naturalSentence = `Data profil atau hak akses akun ${actorName} (#${log.record_id || '-'}) diperbarui.`;
  } else if (action.includes('USER_DELETE')) {
    category = 'staff';
    title = 'Hapus Akun Pengguna';
    badgeTheme = 'bg-red-50 text-red-700 border-red-200';
    icon = <LogOut className="w-3.5 h-3.5" />;
    naturalSentence = `Akun pengguna ${actorName} (#${log.record_id || '-'}) telah dihapus dari sistem.`;

  // 2. Customer & Member Portal
  } else if (action === 'CUSTOMER_LOGIN_GOOGLE') {
    category = 'customer';
    title = 'Login Google Member';
    badgeTheme = 'bg-sky-50 text-sky-700 border-sky-200';
    icon = <UserCheck className="w-3.5 h-3.5" />;
    naturalSentence = `Pelanggan ${actorName}${payload.email ? ` (${payload.email})` : ''} login menggunakan Akun Google.`;
  } else if (action.includes('CUSTOMER_LOGIN')) {
    category = 'customer';
    title = 'Login Pelanggan';
    badgeTheme = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    icon = <UserCheck className="w-3.5 h-3.5" />;
    naturalSentence = `Pelanggan ${actorName}${phone ? ` (${phone})` : ''} masuk ke portal akun member.`;
  } else if (action.includes('CUSTOMER_REGISTER')) {
    category = 'customer';
    title = 'Registrasi Member Baru';
    badgeTheme = 'bg-teal-50 text-teal-700 border-teal-200';
    icon = <UserPlus className="w-3.5 h-3.5" />;
    naturalSentence = `Pendaftaran pelanggan baru: ${actorName}${phone ? ` (${phone})` : ''}${registeredVia ? ` melalui ${registeredVia}` : ''}.`;
  } else if (action.includes('CUSTOMER_LOGOUT')) {
    category = 'customer';
    title = 'Logout Pelanggan';
    badgeTheme = 'bg-slate-100 text-slate-700 border-slate-300';
    icon = <LogOut className="w-3.5 h-3.5" />;
    naturalSentence = `Pelanggan ${actorName} telah logout dari portal website.`;
  } else if (action.includes('PROFILE_COMPLETED')) {
    category = 'customer';
    title = 'Kelengkapan Profil Member';
    badgeTheme = 'bg-teal-50 text-teal-700 border-teal-200';
    icon = <UserCheck className="w-3.5 h-3.5" />;
    naturalSentence = `Pelanggan ${actorName} melengkapi nomor WhatsApp aktif (${payload.whatsapp || '-'}) dan wilayah.`;
  } else if (action.includes('CUSTOMER_UPDATED_BY_ADMIN')) {
    category = 'customer';
    title = 'Edit Member Pelanggan';
    badgeTheme = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    icon = <User className="w-3.5 h-3.5" />;
    naturalSentence = `Data member pelanggan ${actorName} (#${log.record_id || '-'}) diperbarui oleh administrator.`;
  } else if (action.includes('WARRANTY_CLAIM')) {
    category = 'customer';
    title = 'Pengajuan Klaim Garansi';
    badgeTheme = 'bg-rose-50 text-rose-700 border-rose-200';
    icon = <ShieldCheck className="w-3.5 h-3.5" />;
    naturalSentence = `Klaim garansi resmi diajukan untuk tiket #${log.record_id || '-'} oleh ${actorName}${payload.reason ? ` — "${payload.reason}"` : ''}.`;

  // 3. Orders & Workshop Lab Operations
  } else if (action === 'WALKIN_INTAKE') {
    category = 'order';
    title = 'Intake Walk-in Meja Kasir';
    badgeTheme = 'bg-amber-50 text-amber-900 border-amber-300';
    icon = <Wrench className="w-3.5 h-3.5" />;
    naturalSentence = `Intake walk-in #${log.record_id || '-'}: Unit ${payload.phoneType || 'HP'} milik ${payload.customerName || actorName} diterima langsung di workshop.`;
  } else if (action === 'ORDER_CREATED') {
    category = 'order';
    title = 'Pendaftaran Servis Baru';
    badgeTheme = 'bg-amber-50 text-amber-900 border-amber-300';
    icon = <Wrench className="w-3.5 h-3.5" />;
    naturalSentence = `Tiket servis baru #${log.record_id || '-'} didaftarkan oleh ${payload.customerName || actorName} (${payload.phoneType || 'Smartphone'} - ${payload.problem || 'Perbaikan'}).`;
  } else if (action === 'ORDER_STATUS_UPDATED') {
    category = 'order';
    title = 'Update Status Servis';
    badgeTheme = 'bg-amber-50 text-amber-900 border-amber-300';
    icon = <Wrench className="w-3.5 h-3.5" />;
    naturalSentence = `Status tiket #${log.record_id || '-'} (${payload.customerName || 'Unit'}) diubah menjadi "${payload.status}". Teknisi: ${payload.technician || '-'}.`;
  } else if (action === 'ORDER_STEP_UPDATED') {
    category = 'order';
    title = 'Update Tahap Pengerjaan';
    badgeTheme = 'bg-amber-50 text-amber-900 border-amber-300';
    icon = <Wrench className="w-3.5 h-3.5" />;
    naturalSentence = `Progres pengerjaan tiket #${log.record_id || '-'} diperbarui ke Step ${payload.step || '-'}: "${payload.status || '-'}".`;
  } else if (action === 'TECHNICIAN_ASSIGNED') {
    category = 'order';
    title = 'Penugasan Teknisi Lab';
    badgeTheme = 'bg-blue-50 text-blue-800 border-blue-200';
    icon = <Wrench className="w-3.5 h-3.5" />;
    naturalSentence = `Tiket #${log.record_id || '-'} ditugaskan kepada teknisi: ${payload.technician || '-'}.`;
  } else if (action === 'TECHNICIAN_WORKLOG_UPDATED') {
    category = 'order';
    title = 'Catatan Kerja Teknisi';
    badgeTheme = 'bg-amber-50 text-amber-800 border-amber-200';
    icon = <Wrench className="w-3.5 h-3.5" />;
    naturalSentence = `Teknisi memperbarui catatan hasil diagnosa atau pengerjaan pada tiket #${log.record_id || '-'}.`;
  } else if (action === 'ORDER_COMPLETED') {
    category = 'order';
    title = 'Servis Selesai & Lolos QC';
    badgeTheme = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    icon = <CheckCircle2 className="w-3.5 h-3.5" />;
    naturalSentence = `Pengerjaan tiket #${log.record_id || '-'} telah selesai dan dinyatakan lolos uji Quality Control (QC).`;
  } else if (action === 'ORDER_CANCELLED') {
    category = 'order';
    title = 'Tiket Servis Dibatalkan';
    badgeTheme = 'bg-red-50 text-red-800 border-red-200';
    icon = <Wrench className="w-3.5 h-3.5" />;
    naturalSentence = `Tiket servis #${log.record_id || '-'} telah dibatalkan.`;
  } else if (action === 'ORDER_TRACKED') {
    category = 'order';
    title = 'Pengecekan Status Servis';
    badgeTheme = 'bg-slate-100 text-slate-700 border-slate-200';
    icon = <Search className="w-3.5 h-3.5" />;
    naturalSentence = `Pelanggan melakukan pelacakan status progres untuk tiket #${log.record_id || '-'}.`;
  } else if (action === 'ORDERS_CLEARED') {
    category = 'order';
    title = 'Pengosongan Antrean Servis';
    badgeTheme = 'bg-red-50 text-red-700 border-red-200';
    icon = <Wrench className="w-3.5 h-3.5" />;
    naturalSentence = `Seluruh riwayat antrean tiket servis dikosongkan oleh Super Admin.`;
  } else if (action.includes('ORDER') || action.includes('INTAKE') || action.includes('WALKIN') || action.includes('STEP')) {
    category = 'order';
    title = 'Operasional Servis & Meja';
    badgeTheme = 'bg-amber-50 text-amber-900 border-amber-300';
    icon = <Wrench className="w-3.5 h-3.5" />;
    naturalSentence = `Aktivitas pengerjaan tiket lab servis #${log.record_id || '-'}.`;

  // 4. Finance, Cashier & Mitra Commissions
  } else if (action === 'PAYMENT_COMPLETED' || action === 'ORDER_PAID') {
    category = 'finance';
    title = 'Pelunasan Kasir';
    badgeTheme = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    icon = <CreditCard className="w-3.5 h-3.5" />;
    naturalSentence = `Pembayaran lunas tiket #${log.record_id || '-'} sebesar Rp ${Number(payload.cost || 0).toLocaleString('id-ID')} berhasil dikonfirmasi kasir.`;
  } else if (action.includes('COMMISSION_RECORDED')) {
    category = 'finance';
    title = 'Komisi Mitra Dicatat';
    badgeTheme = 'bg-purple-50 text-purple-700 border-purple-200';
    icon = <CreditCard className="w-3.5 h-3.5" />;
    naturalSentence = `Komisi mitra sebesar Rp ${Number(payload.amount || payload.commission || 0).toLocaleString('id-ID')} dicatat dari order #${payload.orderId || log.record_id || '-'}.`;
  } else if (action.includes('COMMISSION_PAYOUT')) {
    category = 'finance';
    title = 'Pencairan Komisi Mitra';
    badgeTheme = 'bg-purple-50 text-purple-700 border-purple-200';
    icon = <CreditCard className="w-3.5 h-3.5" />;
    naturalSentence = `Pencairan komisi mitra afiliasi (${payload.referralCode || log.record_id || '-'}) sebesar Rp ${Number(payload.amount || 0).toLocaleString('id-ID')} diproses.`;
  } else if (action.includes('COMMISSION') || action.includes('PAYMENT') || action.includes('FINANCE') || action.includes('TRANSACTION')) {
    category = 'finance';
    title = 'Keuangan & Kasir';
    badgeTheme = 'bg-purple-50 text-purple-700 border-purple-200';
    icon = <CreditCard className="w-3.5 h-3.5" />;
    naturalSentence = `Transaksi keuangan atau komisi mitra #${log.record_id || '-'}.`;

  // 5. Marketing, Promos, Vouchers & Ads
  } else if (action.includes('PROMO_CODE_CREATE')) {
    category = 'marketing';
    title = 'Pembuatan Voucher Promo';
    badgeTheme = 'bg-orange-50 text-orange-700 border-orange-200';
    icon = <Tag className="w-3.5 h-3.5" />;
    const discLabel = payload.discountType === 'percentage' ? `${payload.discountValue}%` : `Rp ${Number(payload.discountValue || 0).toLocaleString('id-ID')}`;
    naturalSentence = `Voucher diskon baru "${payload.code || log.record_id || '-'}" dibuat: potongan ${discLabel}.`;
  } else if (action.includes('PROMO_CODE_UPDATE')) {
    category = 'marketing';
    title = 'Pembaruan Voucher Promo';
    badgeTheme = 'bg-orange-50 text-orange-700 border-orange-200';
    icon = <Tag className="w-3.5 h-3.5" />;
    naturalSentence = `Pengaturan kode voucher "${payload.code || log.record_id || '-'}" diperbarui di database.`;
  } else if (action.includes('PROMO_CODE_DELETE')) {
    category = 'marketing';
    title = 'Hapus Voucher Promo';
    badgeTheme = 'bg-red-50 text-red-700 border-red-200';
    icon = <Tag className="w-3.5 h-3.5" />;
    naturalSentence = `Kode voucher diskon "${payload.code || log.record_id || '-'}" telah dihapus.`;
  } else if (action.includes('PROMO_CODE_VALIDATED')) {
    category = 'marketing';
    title = 'Klaim Kupon Diskon';
    badgeTheme = 'bg-amber-50 text-amber-800 border-amber-200';
    icon = <Tag className="w-3.5 h-3.5" />;
    naturalSentence = `Kupon diskon "${payload.code || log.record_id || '-'}" berhasil divalidasi dan digunakan oleh pelanggan.`;
  } else if (action.includes('BANNER_CREATED')) {
    category = 'marketing';
    title = 'Tambah Banner Slider';
    badgeTheme = 'bg-amber-50 text-amber-800 border-amber-200';
    icon = <Sparkles className="w-3.5 h-3.5" />;
    naturalSentence = `Banner promo beranda baru "${payload.title || log.record_id || '-'}" berhasil diterbitkan.`;
  } else if (action.includes('BANNER_UPDATED')) {
    category = 'marketing';
    title = 'Update Banner Slider';
    badgeTheme = 'bg-amber-50 text-amber-800 border-amber-200';
    icon = <Sparkles className="w-3.5 h-3.5" />;
    naturalSentence = `Banner slider "${payload.title || log.record_id || '-'}" berhasil diperbarui.`;
  } else if (action.includes('BANNER_TOGGLED')) {
    category = 'marketing';
    title = 'Toggle Banner Slider';
    badgeTheme = 'bg-amber-50 text-amber-800 border-amber-200';
    icon = <Sparkles className="w-3.5 h-3.5" />;
    naturalSentence = `Status tayang banner "${payload.title || log.record_id || '-'}" diubah menjadi: ${payload.active ? 'Aktif' : 'Nonaktif'}.`;
  } else if (action.includes('BANNER_DELETED')) {
    category = 'marketing';
    title = 'Hapus Banner Slider';
    badgeTheme = 'bg-red-50 text-red-700 border-red-200';
    icon = <Sparkles className="w-3.5 h-3.5" />;
    naturalSentence = `Banner promo "${payload.title || log.record_id || '-'}" telah dihapus.`;
  } else if (action === 'AD_CREATE') {
    category = 'marketing';
    title = 'Pembuatan Iklan Beranda';
    badgeTheme = 'bg-amber-50 text-amber-800 border-amber-200';
    icon = <Megaphone className="w-3.5 h-3.5" />;
    naturalSentence = `Iklan sponsor beranda "${payload.title || log.record_id || '-'}" diterbitkan ke database.`;
  } else if (action === 'AD_UPDATE') {
    category = 'marketing';
    title = 'Pembaruan Materi Iklan';
    badgeTheme = 'bg-amber-50 text-amber-800 border-amber-200';
    icon = <Megaphone className="w-3.5 h-3.5" />;
    naturalSentence = `Materi iklan "${payload.title || log.record_id || '-'}" diperbarui di database.`;
  } else if (action === 'AD_TOGGLED') {
    category = 'marketing';
    title = 'Toggle Status Iklan';
    badgeTheme = 'bg-amber-50 text-amber-800 border-amber-200';
    icon = <Megaphone className="w-3.5 h-3.5" />;
    naturalSentence = `Status tayang iklan "${payload.title || log.record_id || '-'}" diubah menjadi: ${payload.active ? 'Aktif' : 'Nonaktif'}.`;
  } else if (action === 'AD_DELETE') {
    category = 'marketing';
    title = 'Hapus Iklan Beranda';
    badgeTheme = 'bg-red-50 text-red-700 border-red-200';
    icon = <Megaphone className="w-3.5 h-3.5" />;
    naturalSentence = `Iklan sponsor "${payload.title || log.record_id || '-'}" dihapus dari sistem.`;
  } else if (action === 'AD_CLICKED') {
    category = 'marketing';
    title = 'Interaksi Klik Iklan';
    badgeTheme = 'bg-amber-50 text-amber-800 border-amber-200';
    icon = <Megaphone className="w-3.5 h-3.5" />;
    naturalSentence = `Iklan sponsor "${payload.title || log.record_id || '-'}" diklik oleh pengunjung beranda (${payload.clicksCount || 1} total klik).`;

  // 6. Testimonials & Reviews
  } else if (action.includes('TESTIMONIAL')) {
    category = 'customer';
    title = 'Ulasan / Testimoni Baru';
    badgeTheme = 'bg-yellow-50 text-yellow-800 border-yellow-200';
    icon = <Star className="w-3.5 h-3.5" />;
    naturalSentence = `Ulasan pelanggan bintang ${payload.rating || 5} dikirim oleh ${payload.name || actorName} (${payload.phoneModel || 'Smartphone'}).`;

  // 7. Fallback Table-Aware System Logs
  } else if (log.table_name === 'promo_codes') {
    category = 'marketing';
    title = 'Voucher Promo';
    badgeTheme = 'bg-orange-50 text-orange-700 border-orange-200';
    icon = <Tag className="w-3.5 h-3.5" />;
    naturalSentence = `Perubahan data voucher promo "${payload.code || log.record_id || '-'}" (${action}).`;
  } else if (log.table_name === 'ads') {
    category = 'marketing';
    title = 'Iklan Beranda';
    badgeTheme = 'bg-amber-50 text-amber-800 border-amber-200';
    icon = <Megaphone className="w-3.5 h-3.5" />;
    naturalSentence = `Perubahan materi iklan "${payload.title || log.record_id || '-'}" (${action}).`;
  } else if (log.table_name === 'orders') {
    category = 'order';
    title = 'Servis Lab';
    badgeTheme = 'bg-amber-50 text-amber-900 border-amber-300';
    icon = <Wrench className="w-3.5 h-3.5" />;
    naturalSentence = `Aktivitas pengerjaan tiket lab servis #${log.record_id || '-'} (${action}).`;
  } else if (log.table_name === 'commissions') {
    category = 'finance';
    title = 'Komisi Mitra';
    badgeTheme = 'bg-purple-50 text-purple-700 border-purple-200';
    icon = <CreditCard className="w-3.5 h-3.5" />;
    naturalSentence = `Aktivitas komisi mitra #${log.record_id || '-'} (${action}).`;
  } else {
    category = 'system';
    title = action.replace(/_/g, ' ');
    badgeTheme = 'bg-slate-100 text-slate-800 border-slate-300';
    icon = <ShieldCheck className="w-3.5 h-3.5" />;
    naturalSentence = log.details || log.description || log.message || `Aktivitas pada modul ${log.table_name || 'sistem'} (${log.record_id || '-'}).`;
  }

  // Override natural sentence if explicit details exist
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
  const [filterCategory, setFilterCategory] = useState<'all' | 'staff' | 'customer' | 'order' | 'finance' | 'marketing' | 'system'>('all');
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
                Rekam jejak seluruh aksi di website: autentikasi kasir, status pengerjaan lab teknisi, klaim promo, ulasan, dan transaksi.
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
                placeholder="Cari berdasarkan nama, WhatsApp, aksi, tiket servis, atau ID entri..."
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
                { id: 'finance', label: 'Keuangan & Komisi' },
                { id: 'marketing', label: 'Promo & Iklan' },
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
