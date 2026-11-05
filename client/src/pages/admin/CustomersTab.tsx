import React, { useState } from 'react';
import { UserCheck, Search, Phone, Mail, Key, Eye, EyeOff, Edit3, ShieldCheck, ShoppingBag, MapPin, Tag } from 'lucide-react';
import { formatRp } from '../../utils/api';
import EditCustomerModal from './EditCustomerModal';

interface CustomersTabProps {
  customers: any[];
  loading?: boolean;
  onCustomerUpdated?: (updated: any) => void;
}

export default function CustomersTab({
  customers,
  loading,
  onCustomerUpdated
}: CustomersTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (id: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredCustomers = customers.filter((c) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(s)) ||
      (c.username && c.username.toLowerCase().includes(s)) ||
      (c.whatsapp && c.whatsapp.includes(s)) ||
      (c.email && c.email.toLowerCase().includes(s)) ||
      (c.district && c.district.toLowerCase().includes(s)) ||
      (c.referredByMitra && c.referredByMitra.toLowerCase().includes(s))
    );
  });

  const totalOrders = customers.reduce((sum, c) => sum + (Number(c.ordersCount) || 0), 0);
  const totalSpent = customers.reduce((sum, c) => sum + (Number(c.totalSpent) || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-600" />
            <span>Manajemen Akun &amp; Kredensial Pelanggan (Customers)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pantau akun pelanggan terdaftar, lihat kata sandi login, riwayat klaim garansi, serta ubah data akun secara langsung.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, WhatsApp, email, wilayah..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
          />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Pelanggan Terdaftar
            </span>
            <div className="text-2xl font-black text-slate-900">
              {customers.length} Member
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Tersimpan di database PostgreSQL</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200/40">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">
              Total Riwayat Servis
            </span>
            <div className="text-2xl font-black text-slate-900">
              {totalOrders} Unit Servis
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Perangkat yang pernah diservis</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-200/40">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block">
              Akumulasi Nilai Transaksi
            </span>
            <div className="text-2xl font-black text-slate-900">
              {formatRp(totalSpent)}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Total belanja seluruh pelanggan</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200/40">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Tabel Akun &amp; Kredensial Pelanggan</h3>
            <p className="text-[11px] text-slate-500">Klik tombol Edit untuk mengubah nama, nomor telepon, kata sandi, email, atau status pelanggan.</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 border border-amber-200/60 text-amber-800 rounded-lg">
            Menampilkan {filteredCustomers.length} dari {customers.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200/80 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Nama Pelanggan</th>
                <th className="py-3.5 px-4">Kontak WhatsApp &amp; Email</th>
                <th className="py-3.5 px-4">Kata Sandi Akun</th>
                <th className="py-3.5 px-4">Wilayah &amp; Mitra Pengajak</th>
                <th className="py-3.5 px-4">Riwayat Servis</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-amber-600 animate-spin"></div>
                      <span className="text-xs font-semibold text-slate-500">Memuat data pelanggan...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    {searchTerm ? 'Tidak ada pelanggan yang cocok dengan pencarian.' : 'Belum ada akun pelanggan terdaftar.'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c, idx) => {
                  const isPassRevealed = Boolean(revealedPasswords[c.id]);
                  const displayPassword = c.plainPassword || (c.password && !String(c.password).startsWith('$2') ? c.password : '');
                  const isHashed = Boolean(c.password && String(c.password).startsWith('$2'));

                  return (
                    <tr key={idx} className="hover:bg-amber-50/20 transition-colors">
                      {/* Nama Pelanggan */}
                      <td className="py-3.5 px-4">
                        <strong className="text-slate-900 block text-xs font-bold leading-tight">{c.name}</strong>
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">ID: {c.id}</span>
                        {c.registeredAt && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">Reg: {c.registeredAt}</span>
                        )}
                      </td>

                      {/* Kontak */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <a
                            href={`https://wa.me/62${String(c.whatsapp || c.phone || '').replace(/^0/, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                            title="Chat WhatsApp Pelanggan"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{c.whatsapp || c.phone || '-'}</span>
                          </a>

                          {c.email ? (
                            <div className="flex items-center gap-1 text-[11px] text-slate-600 truncate max-w-[180px]">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{c.email}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic block">Tanpa email</span>
                          )}
                        </div>
                      </td>

                      {/* Kata Sandi Akun */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <Key className="w-3 h-3 text-amber-600 shrink-0" />
                          {displayPassword ? (
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-[11px] font-bold bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded border border-amber-200">
                                {isPassRevealed ? displayPassword : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(c.id)}
                                className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                                title={isPassRevealed ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                              >
                                {isPassRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>
                          ) : isHashed ? (
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono" title="Terenkripsi Bcrypt. Klik tombol Edit untuk ubah kata sandi">
                              🔒 Terenkripsi Bcrypt
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-mono">-</span>
                          )}
                        </div>
                      </td>

                      {/* Wilayah & Mitra Pengajak */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-slate-800 font-medium text-xs">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{c.district || 'Kota Malang'}</span>
                          </div>

                          {c.referredByMitra ? (
                            <div className="flex items-center gap-1">
                              <Tag className="w-3 h-3 text-amber-600 shrink-0" />
                              <span className="font-mono font-bold text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                                Ref: {c.referredByMitra}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 block">Jalur Mandiri</span>
                          )}
                        </div>
                      </td>

                      {/* Riwayat Servis */}
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-bold text-slate-900 block">
                          {c.ordersCount || 0} Kali Servis
                        </span>
                        <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
                          {formatRp(c.totalSpent || 0)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          String(c.status || '').toLowerCase().includes('aktif')
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            String(c.status || '').toLowerCase().includes('aktif') ? 'bg-emerald-500' : 'bg-red-500'
                          }`} />
                          <span>{c.status || 'Aktif'}</span>
                        </span>
                      </td>

                      {/* Aksi Admin */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingCustomer(c)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50/80 hover:bg-amber-100 text-amber-900 font-bold text-xs cursor-pointer shadow-2xs transition-all"
                            title="Edit data & kata sandi pelanggan"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edit Customer */}
      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSuccess={(updated) => {
            if (onCustomerUpdated) {
              onCustomerUpdated(updated);
            }
          }}
        />
      )}
    </div>
  );
}
