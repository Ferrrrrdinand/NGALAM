import React, { useState } from 'react';
import { Banknote, X, Users, Wallet, ArrowDownRight, Edit3, Key, Phone, Eye, EyeOff, Search, ShieldCheck } from 'lucide-react';
import { formatRp } from '../../utils/api';
import EditMitraModal from './EditMitraModal';

export default function MitraTab({
  mitras,
  loading,
  payoutModalMitra,
  setPayoutModalMitra,
  payoutAmount,
  setPayoutAmount,
  handlePayoutSubmit,
  onMitraUpdated
}: {
  mitras: any[];
  loading?: boolean;
  payoutModalMitra?: any;
  setPayoutModalMitra?: (m: any) => void;
  payoutAmount?: string;
  setPayoutAmount?: (amt: string) => void;
  handlePayoutSubmit?: (e: React.FormEvent) => void;
  onMitraUpdated?: (updated: any) => void;
}) {
  const [editingMitra, setEditingMitra] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (id: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredMitras = mitras.filter((m) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      (m.name && m.name.toLowerCase().includes(s)) ||
      (m.username && m.username.toLowerCase().includes(s)) ||
      (m.phone && m.phone.includes(s)) ||
      (m.referralCode && m.referralCode.toLowerCase().includes(s)) ||
      (m.plateNumber && m.plateNumber.toLowerCase().includes(s))
    );
  });

  const totalBalance = mitras.reduce((acc, m) => acc + (Number(m.balance) || 0), 0);
  const totalCommission = mitras.reduce((acc, m) => acc + (Number(m.totalCommission) || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-600" />
            <span>Manajemen Kredensial &amp; Komisi Mitra Driver / Rekanan</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Admin dapat melihat nomor WhatsApp, kata sandi, rekening, kode referral barcode, serta mengedit profil mitra secara langsung.
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, WhatsApp, plat, ref..."
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
              Total Mitra Aktif
            </span>
            <div className="text-2xl font-black text-slate-900">
              {mitras.length} Mitra
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Terverifikasi di database</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200/40">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">
              Saldo Siap Ditarik
            </span>
            <div className="text-2xl font-black text-emerald-700">
              {formatRp(totalBalance)}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Kewajiban kasir ke mitra</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-200/40">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block">
              Total Komisi Diberikan
            </span>
            <div className="text-2xl font-black text-slate-900">
              {formatRp(totalCommission)}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Akumulasi bagi hasil 10%</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200/40">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Mitra Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Tabel Data Kredensial, Rekening &amp; Komisi Mitra</h3>
            <p className="text-[11px] text-slate-500">Klik tombol Edit untuk memperbarui nama, nomor telepon, kata sandi, rekening, atau status mitra.</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 border border-amber-200/60 text-amber-800 rounded-lg">
            Menampilkan {filteredMitras.length} dari {mitras.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200/80 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Profil &amp; Username</th>
                <th className="py-3.5 px-4">Kontak &amp; Kata Sandi</th>
                <th className="py-3.5 px-4">Profesi / Kendaraan</th>
                <th className="py-3.5 px-4">Rekening / E-Wallet</th>
                <th className="py-3.5 px-4">Referral &amp; Saldo</th>
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
                      <span className="text-xs font-semibold text-slate-500">Memuat data mitra...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredMitras.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    {searchTerm ? 'Tidak ada mitra yang cocok dengan pencarian.' : 'Belum ada mitra driver / rekanan terdaftar.'}
                  </td>
                </tr>
              ) : (
                filteredMitras.map((m, idx) => {
                  const unwithdrawn = m.balance !== undefined ? m.balance : (m.totalCommission || 0);
                  const isPassRevealed = Boolean(revealedPasswords[m.id]);
                  const displayPassword = m.plainPassword || (m.password && !String(m.password).startsWith('$2') ? m.password : '');
                  const isHashed = Boolean(m.password && String(m.password).startsWith('$2'));

                  return (
                    <tr key={idx} className="hover:bg-amber-50/20 transition-colors">
                      {/* Profil & Username */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl shrink-0">{m.avatar || '🛵'}</span>
                          <div>
                            <strong className="text-slate-900 block text-xs font-bold leading-tight">{m.name}</strong>
                            <span className="text-[11px] font-mono text-amber-700 font-semibold block mt-0.5">@{m.username}</span>
                          </div>
                        </div>
                      </td>

                      {/* Kontak & Kata Sandi */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <a
                            href={`https://wa.me/62${String(m.phone || '').replace(/^0/, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                            title="Chat WhatsApp Mitra"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{m.phone || '-'}</span>
                          </a>

                          <div className="flex items-center gap-1.5">
                            <Key className="w-3 h-3 text-amber-600 shrink-0" />
                            {displayPassword ? (
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-[11px] font-bold bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded border border-amber-200">
                                  {isPassRevealed ? displayPassword : '••••••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => togglePasswordVisibility(m.id)}
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
                        </div>
                      </td>

                      {/* Profesi & Kendaraan */}
                      <td className="py-3.5 px-4">
                        <span className="text-slate-800 font-medium block text-xs">{m.category || m.vehicleType || 'Mitra Driver'}</span>
                        {m.plateNumber ? (
                          <span className="inline-block font-mono font-bold text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 mt-0.5">
                            {m.plateNumber}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 block mt-0.5">Tanpa Plat</span>
                        )}
                      </td>

                      {/* Rekening Bank */}
                      <td className="py-3.5 px-4">
                        {m.bankAccount ? (
                          <span className="text-xs font-semibold text-slate-800 block">
                            {m.bankAccount}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Belum diisi</span>
                        )}
                      </td>

                      {/* Referral & Saldo */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded text-[11px] inline-block mb-1">
                          {m.referralCode}
                        </span>
                        <div className="text-[11px]">
                          <span className="text-slate-500">Saldo: </span>
                          <strong className={unwithdrawn > 0 ? 'text-emerald-700 font-bold' : 'text-slate-500 font-medium'}>
                            {formatRp(unwithdrawn)}
                          </strong>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          String(m.status || '').toLowerCase().includes('aktif') || String(m.status || '').toLowerCase().includes('siaga')
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            String(m.status || '').toLowerCase().includes('aktif') || String(m.status || '').toLowerCase().includes('siaga')
                              ? 'bg-emerald-500'
                              : 'bg-red-500'
                          }`} />
                          <span>{m.status || 'Siaga / Aktif'}</span>
                        </span>
                      </td>

                      {/* Aksi Admin */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingMitra(m)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50/80 hover:bg-amber-100 text-amber-900 font-bold text-xs cursor-pointer shadow-2xs transition-all"
                            title="Edit data & kata sandi mitra"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                            <span>Edit</span>
                          </button>

                          {setPayoutModalMitra && setPayoutAmount && (
                            <button
                              disabled={unwithdrawn <= 0}
                              onClick={() => {
                                setPayoutModalMitra(m);
                                setPayoutAmount(String(unwithdrawn));
                              }}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium text-xs transition-all ${
                                unwithdrawn > 0
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-2xs'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              <Banknote className="w-3.5 h-3.5" />
                              <span>Cairkan</span>
                            </button>
                          )}
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

      {/* Modal Edit Mitra */}
      {editingMitra && (
        <EditMitraModal
          mitra={editingMitra}
          onClose={() => setEditingMitra(null)}
          onSuccess={(updated) => {
            if (onMitraUpdated) {
              onMitraUpdated(updated);
            }
          }}
        />
      )}

      {/* Modal Payout Kasir */}
      {payoutModalMitra && setPayoutModalMitra && setPayoutAmount && handlePayoutSubmit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Pencairan Saldo Komisi Mitra</span>
              </h3>
              <button
                onClick={() => setPayoutModalMitra(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Penerima:</span>
                <strong className="text-slate-800">{payoutModalMitra.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kode Referral:</span>
                <span className="font-mono font-bold text-amber-600">{payoutModalMitra.referralCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kontak:</span>
                <span className="font-mono text-slate-700">{payoutModalMitra.phone}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Saldo Tersedia:</span>
                <strong className="text-emerald-700">{formatRp(payoutModalMitra.balance || 0)}</strong>
              </div>
            </div>

            <form onSubmit={handlePayoutSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nominal Pencairan Saldo (Rp)
                </label>
                <div className="relative">
                  <span className="text-xs font-bold text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2">Rp</span>
                  <input
                    type="number"
                    required
                    min="1000"
                    max={payoutModalMitra.balance || 999999999}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-mono font-bold transition-all text-slate-900"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPayoutModalMitra(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs cursor-pointer transition-all"
                >
                  Konfirmasi Pencairan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
