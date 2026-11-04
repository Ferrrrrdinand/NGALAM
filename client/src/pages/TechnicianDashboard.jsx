import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wrench, CheckCircle2, Smartphone, 
  RefreshCw, LogOut, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchApi, formatDateId } from '../utils/api';

export default function TechnicianDashboard() {
  const { user, loading: authLoading, logoutStaff } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'assigned' | 'step2' | 'step3' | 'step4' | 'step5'
  const [updateMsg, setUpdateMsg] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/api/orders');
      if (res.ok && res.data.success) {
        setOrders(res.data.data || []);
      }
    } catch {
      console.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/teknisi/login');
      return;
    }
    fetchOrders();
  }, [user, authLoading]);

  const handleUpdateStep = async (orderId, newStep, statusText) => {
    try {
      const res = await fetchApi(`/api/orders/${orderId}`, {
        method: 'PUT',
        body: {
          currentStep: newStep,
          statusText: statusText,
          technician: user?.name || user?.username || 'Teknisi Lab'
        }
      });
      if (res.ok && res.data.success) {
        setUpdateMsg(`Tiket ${orderId} berhasil diperbarui ke Tahap ${newStep}!`);
        setTimeout(() => setUpdateMsg(''), 4000);
        fetchOrders();
      }
    } catch {
      alert('Gagal memperbarui status pengerjaan tiket.');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === 'all') return true;
    if (filter === 'step2') return o.currentStep === 2;
    if (filter === 'step3') return o.currentStep === 3;
    if (filter === 'step4') return o.currentStep === 4;
    if (filter === 'step5') return o.currentStep === 5;
    return true;
  });

  return (
    <div className="tech-dashboard-root max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Meja Kerja Lab Teknisi</h1>
            <p className="text-xs text-slate-400">
              Staf Teknisi: <strong className="text-amber-400">{user?.name || user?.username}</strong> ({user?.desk || 'Lab Workshop'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1.5"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Segarkan</span>
          </button>
          <button
            onClick={async () => { await logoutStaff(); navigate('/teknisi/login'); }}
            className="p-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl transition-all text-xs flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {updateMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{updateMsg}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: 'Semua Antrian' },
          { id: 'step2', label: 'Tahap 2: Diagnosa Lab' },
          { id: 'step3', label: 'Tahap 3: Pengerjaan / Ganti Part' },
          { id: 'step4', label: 'Tahap 4: Pengujian QC' },
          { id: 'step5', label: 'Tahap 5: Selesai' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === item.id
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-amber-600 animate-spin"></div>
            <span className="text-xs font-bold text-slate-600">Memuat antrian lab workshop teknisi...</span>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
          Tidak ada antrian unit untuk kategori filter ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((o) => (
            <div
              key={o.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-black text-amber-600 font-mono">{o.id}</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    o.currentStep === 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    Step {o.currentStep || 1} / 5
                  </span>
                </div>

                <div className="pt-3 space-y-2">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-amber-600" />
                    {o.phoneType}
                  </h3>
                  <p className="text-xs text-slate-600">
                    <strong className="text-slate-800">Pemilik:</strong> {o.customerName} ({o.whatsapp || '-'})
                  </p>
                  <p className="text-xs text-slate-600">
                    <strong className="text-slate-800">Keluhan:</strong> {o.damage || '-'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Masuk: {formatDateId(o.orderDate || o.createdAt)}
                  </p>
                </div>
              </div>

              {/* Progress Update Actions */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Perbarui Tahap Pengerjaan:
                </span>
                
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleUpdateStep(o.id, 2, 'Sedang dalam diagnosa skematik lab')}
                    className={`py-1.5 px-2 text-[10px] font-bold rounded-lg border text-center transition-all ${
                      o.currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    2. Diagnosa
                  </button>
                  <button
                    onClick={() => handleUpdateStep(o.id, 3, 'Sedang proses pengerjaan perbaikan')}
                    className={`py-1.5 px-2 text-[10px] font-bold rounded-lg border text-center transition-all ${
                      o.currentStep === 3 ? 'bg-amber-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    3. Pengerjaan
                  </button>
                  <button
                    onClick={() => handleUpdateStep(o.id, 4, 'Pengujian ketahanan fungsi (QC Lolos)')}
                    className={`py-1.5 px-2 text-[10px] font-bold rounded-lg border text-center transition-all ${
                      o.currentStep === 4 ? 'bg-purple-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    4. Uji QC
                  </button>
                  <button
                    onClick={() => handleUpdateStep(o.id, 5, 'Perbaikan selesai, unit siap diambil')}
                    className={`py-1.5 px-2 text-[10px] font-bold rounded-lg border text-center transition-all flex items-center justify-center gap-1 ${
                      o.currentStep === 5 ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    <span>5. Selesai</span>
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
