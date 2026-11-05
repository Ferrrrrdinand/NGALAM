import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Check } from 'lucide-react';
import { fetchApi, formatRp } from '../utils/api';

export default function Lacak() {
  const [searchParams] = useSearchParams();
  const [ticketInput, setTicketInput] = useState(searchParams.get('id') || '');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const performLookup = async (idToSearch?: string) => {
    const q = (idToSearch || ticketInput).trim();
    if (!q) return;
    setLoading(true);
    setErrorMsg('');
    setOrder(null);

    try {
      const res = await fetchApi(`/api/orders/${encodeURIComponent(q)}`);
      if (res.ok && res.data.success) {
        setOrder(res.data.data);
      } else {
        setErrorMsg(res.data.message || 'Nomor tiket, WhatsApp, atau Email tidak ditemukan.');
      }
    } catch {
      setErrorMsg('Gagal terhubung ke server untuk melacak tiket.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialId = searchParams.get('id');
    if (initialId) {
      setTicketInput(initialId);
      performLookup(initialId);
    }
  }, [searchParams]);

  const steps = [
    { num: 1, title: 'Registrasi & Intake', desc: 'Unit diterima Meja 1' },
    { num: 2, title: 'Diagnosa Lab', desc: 'Analisa kerusakan & part' },
    { num: 3, title: 'Pengerjaan Lab', desc: 'Proses perbaikan unit' },
    { num: 4, title: 'Quality Control', desc: 'Pengujian ketahanan fungsi' },
    { num: 5, title: 'Selesai & Siap Ambil', desc: 'Garansi resmi workshop aktif' }
  ];

  return (
    <div className="wrap" style={{ maxWidth: '850px', marginTop: '40px', marginBottom: '80px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div className="eyebrow blue" style={{ display: 'inline-flex', marginBottom: '8px' }}>
          <span>PELACAKAN TIKET ONLINE</span>
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#000000', margin: '8px 0' }}>
          Lacak Status Unit Servis HP
        </h1>
        <p style={{ color: '#000000', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
          Masukkan Nomor Tiket Servis resmi Anda, nomor WhatsApp, atau email untuk memantau tahapan pengerjaan di lab workshop secara live.
        </p>

        <form onSubmit={(e) => { e.preventDefault(); performLookup(); }} style={{ marginTop: '24px', display: 'flex', gap: '10px', maxWidth: '560px', margin: '24px auto 0' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Ketik Nomor Tiket Servis (Cth: NGL-20261103-...) atau No. WA..."
            value={ticketInput}
            onChange={(e) => setTicketInput(e.target.value)}
            style={{ flex: 1, padding: '14px 18px', borderRadius: '14px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem' }}
          />
          <button type="submit" className="btn" disabled={loading} style={{ borderRadius: '14px', padding: '0 24px' }}>
            <span>{loading ? 'Mencari...' : 'Lacak Unit ↗'}</span>
          </button>
        </form>

        {errorMsg && (
          <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '14px', background: '#fef2f2', padding: '10px 16px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1px solid #fecaca' }}>
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {order && (
        <div className="tracking-card">
          <div className="tracking-card-header">
            <div>
              <span className="tracking-ticket-badge">{order.id}</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#000000', marginTop: '8px' }}>
                {order.phoneType}
              </h2>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Pemilik: <b>{order.customerName}</b> ({order.whatsapp || '-'})
              </span>
            </div>

            <span className={`tracking-status-badge ${order.currentStep === 5 ? 'step-5' : ''}`}>
              {order.currentStep === 5 ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> SELESAI &amp; SIAP DIAMBIL
                </span>
              ) : (
                `TAHAP ${order.currentStep || 1} DARI 5`
              )}
            </span>
          </div>

          <div className="tracking-timeline-box">
            <div className="tracking-timeline">
              {steps.map((st) => {
                const isCompleted = (order.currentStep || 1) > st.num;
                const isActive = (order.currentStep || 1) === st.num;
                return (
                  <div key={st.num} className={`tracking-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                    <div
                      className="tracking-step-node flex items-center justify-center"
                      style={{
                        background: isCompleted ? '#10b981' : isActive ? '#d4af37' : '#e2e8f0',
                        color: isCompleted || isActive ? '#ffffff' : '#64748b'
                      }}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5 text-white" /> : st.num}
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#000000' }}>{st.title}</div>
                    <small style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginTop: '2px' }}>{st.desc}</small>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block' }}>KELUHAN KERUSAKAN:</span>
              <strong style={{ fontSize: '0.9rem', color: '#000000' }}>{order.damage || '-'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block' }}>TOTAL BIAYA:</span>
              <strong style={{ fontSize: '1.2rem', color: '#000000', fontWeight: 900 }}>{formatRp(order.cost || 0)}</strong>
              <small style={{ color: order.paid ? '#059669' : '#d97706', fontWeight: 700, display: 'block' }}>
                {order.paid ? '● Lunas Kasir' : '○ Menunggu Pembayaran'}
              </small>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block' }}>TEKNISI LAB:</span>
              <strong style={{ fontSize: '0.9rem', color: '#b45309' }}>{order.technician || 'Meja Lab Workshop'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block' }}>GARANSI WORKSHOP:</span>
              <strong style={{ fontSize: '0.9rem', color: '#059669' }}>
                {order.warranty?.warrantyTypeLabel || (
                  /baterai|battery/i.test(order.damageDescription || order.damage || '')
                    ? 'Garansi Baterai 90 Hari (3 Bulan)'
                    : 'Garansi Servis (1 Minggu s/d 1 Bulan)'
                )}
              </strong>
            </div>
            {order.affiliateRef && (
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block' }}>REKOMENDASI MITRA:</span>
                <strong style={{ fontSize: '0.85rem', color: '#065f46' }}>
                  {order.partnerName || order.affiliateMitraName || 'Mitra'} ({order.affiliateRef})
                </strong>
              </div>
            )}
          </div>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <a
              href={`https://wa.me/6281330304321?text=Halo%20Admin%20Ngalam%20Fix%20Pro,%20saya%20mau%20menanyakan%20status%20tiket%20${order.id}`}
              target="_blank"
              rel="noreferrer"
              className="btn outline"
              style={{ borderRadius: '12px' }}
            >
              <span>Hubungi Teknisi via WhatsApp ↗</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}