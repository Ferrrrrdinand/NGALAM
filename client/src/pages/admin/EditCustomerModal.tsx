import React, { useState } from 'react';
import { X, Save, Key, Phone, User, Mail, MapPin, Tag, Shield, Eye, EyeOff } from 'lucide-react';
import { fetchApi } from '../../utils/api';

interface EditCustomerModalProps {
  customer: any;
  onClose: () => void;
  onSuccess: (updated: any) => void;
}

export default function EditCustomerModal({ customer, onClose, onSuccess }: EditCustomerModalProps) {
  const [formData, setFormData] = useState({
    name: customer.name || '',
    whatsapp: customer.whatsapp || customer.phone || '',
    email: customer.email || '',
    password: '',
    district: customer.district || 'Kota Malang',
    referredByMitra: customer.referredByMitra || '',
    status: customer.status || 'Aktif'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      const payload: any = { ...formData };
      if (!payload.password || !payload.password.trim()) {
        delete payload.password;
      }

      const res = await fetchApi(`/api/customer/${customer.id}`, {
        method: 'PATCH',
        body: payload
      });

      if (res.ok && res.data.success) {
        onSuccess(res.data.data);
        onClose();
      } else {
        setErrorMsg(res.data.message || res.data.error || 'Gagal memperbarui data pelanggan.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-amber-200/50 my-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Edit Akun &amp; Kredensial Pelanggan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ID: <span className="font-mono font-semibold text-amber-700">{customer.id}</span> • {customer.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <Shield className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3.5">
            
            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap Pelanggan <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Nomor WhatsApp */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor WhatsApp / Telepon <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="whatsapp"
                  required
                  value={formData.whatsapp}
                  onChange={handleChange}
                  placeholder="08xxxxxxxxxx"
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold transition-all text-slate-900"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alamat Email (Opsional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="pelanggan@email.com"
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>

            {/* Password / PIN Pelanggan */}
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ubah / Reset Kata Sandi Pelanggan</span>
                </label>
                {customer.plainPassword ? (
                  <span className="text-[11px] text-amber-800 font-mono">
                    Sandi saat ini: <strong>{customer.plainPassword}</strong>
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500 font-mono">
                    (Terenkripsi Bcrypt)
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Kosongkan jika kata sandi tidak ingin diubah"
                  className="w-full text-xs pr-10 pl-3 py-2 rounded-lg border border-amber-300/80 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-amber-700/80 mt-1">
                💡 Admin dapat mengatur kata sandi pelanggan yang lupa password. Pelanggan dapat menggunakannya untuk login ke Portal Pelanggan &amp; Klaim Garansi.
              </p>
            </div>

            {/* Wilayah / Kecamatan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Wilayah / Kecamatan
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="Contoh: Klojen, Lowokwaru"
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>
              </div>

              {/* Mitra Pengajak */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kode Referral Mitra Pengajak
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="referredByMitra"
                    value={formData.referredByMitra}
                    onChange={handleChange}
                    placeholder="KODE MITRA"
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold uppercase text-amber-700"
                  />
                </div>
              </div>
            </div>

            {/* Status Akun */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status Akun Pelanggan
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
              >
                <option value="Aktif">🟢 Aktif (Normal)</option>
                <option value="Nonaktif">🟡 Nonaktif</option>
                <option value="Suspended">🔴 Ditangguhkan (Suspended)</option>
              </select>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer transition-all disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan Akun'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

