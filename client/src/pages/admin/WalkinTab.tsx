import React, { useState, useRef, useEffect } from 'react';
import { 
  Smartphone, Battery, Zap, Gem, Camera, PowerOff, 
  Check, CheckCircle2, User, Phone, MapPin, Mail, 
  Tag, Wrench, ShieldCheck, Printer, Share2, 
  RotateCcw, Search, ChevronDown, Plus, X, 
  FileText, Sparkles, Clock, AlertCircle, Eye, Droplet, Volume2, Cpu, Wrench as ToolIcon
} from 'lucide-react';
import { fetchApi, formatRp } from '../../utils/api';

export default function WalkinTab({
  walkin,
  setWalkin,
  walkinSuccess,
  handleWalkinSubmit,
  loadData,
  currentUser
}: any) {
  // Brand list dengan logo resmi
  const brandsList = [
    {
      id: 'apple',
      name: 'Apple iPhone',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 1.01-2.87-.96.04-2.08.64-2.73 1.4-.56.64-1.06 1.7-1.01 2.74 1.07.08 2.15-.55 2.73-1.27z" />
        </svg>
      )
    },
    {
      id: 'samsung',
      name: 'Samsung',
      icon: (
        <svg className="w-4 h-3" viewBox="0 0 44 16" fill="none">
          <rect width="44" height="16" rx="3.5" fill="#034EA2" />
          <text x="22" y="11.5" fill="#FFFFFF" fontFamily="'Inter', Arial, sans-serif" fontWeight="900" fontSize="7" letterSpacing="0.6" textAnchor="middle">SAMSUNG</text>
        </svg>
      )
    },
    {
      id: 'xiaomi',
      name: 'Xiaomi / Redmi',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="6.5" fill="#FF6900" />
          <path d="M6 7.5h2.8v4.8c0 .7.5 1.2 1.2 1.2s1.2-.5 1.2-1.2V7.5H14v4.8c0 .7.5 1.2 1.2 1.2s1.2-.5 1.2-1.2V7.5H18v5.2c0 2.2-1.8 4-4 4-1.3 0-2.4-.6-3.1-1.6-.7 1-1.8 1.6-3.1 1.6-2.2 0-4-1.8-4-4V7.5z" fill="#FFFFFF" />
          <rect x="15.2" y="10" width="1.4" height="3.8" rx="0.4" fill="#FF6900" />
        </svg>
      )
    },
    {
      id: 'poco',
      name: 'POCO',
      icon: (
        <svg className="w-4 h-3" viewBox="0 0 32 16" fill="none">
          <rect width="32" height="16" rx="3.5" fill="#FFD700" />
          <text x="16" y="11.5" fill="#000000" fontFamily="'Arial Black', Impact, sans-serif" fontWeight="900" fontSize="8" letterSpacing="0.5" textAnchor="middle">POCO</text>
        </svg>
      )
    },
    {
      id: 'oppo',
      name: 'OPPO',
      icon: (
        <svg className="w-4 h-3" viewBox="0 0 34 16" fill="none">
          <rect width="34" height="16" rx="3.5" fill="#00875A" />
          <text x="17" y="11.2" fill="#FFFFFF" fontFamily="'Inter', Arial, sans-serif" fontWeight="900" fontSize="7.5" letterSpacing="-0.2" textAnchor="middle">oppo</text>
        </svg>
      )
    },
    {
      id: 'vivo',
      name: 'Vivo',
      icon: (
        <svg className="w-4 h-3" viewBox="0 0 32 16" fill="none">
          <rect width="32" height="16" rx="3.5" fill="#0055FF" />
          <text x="16" y="11.2" fill="#FFFFFF" fontFamily="'Inter', Arial, sans-serif" fontWeight="800" fontSize="8" letterSpacing="0.2" textAnchor="middle">vivo</text>
        </svg>
      )
    },
    {
      id: 'realme',
      name: 'Realme',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="6" fill="#FFC915" />
          <path d="M7 17V7h4.8c2.2 0 3.7 1.3 3.7 3.2 0 1.5-.9 2.5-2.2 2.9L16 17h-2.8l-2.4-3.5H9.4V17H7zm2.4-5.5h2.2c1 0 1.6-.5 1.6-1.3 0-.8-.6-1.3-1.6-1.3H9.4v2.6z" fill="#000000" />
        </svg>
      )
    },
    {
      id: 'infinix',
      name: 'Infinix',
      icon: (
        <svg className="w-4 h-3" viewBox="0 0 36 16" fill="none">
          <rect width="36" height="16" rx="3.5" fill="#0B1528" stroke="#15E89B" strokeWidth="1.2" />
          <text x="18" y="11.2" fill="#15E89B" fontFamily="'Inter', Arial, sans-serif" fontWeight="900" fontSize="6.8" letterSpacing="0.5" textAnchor="middle">infinix</text>
        </svg>
      )
    },
    {
      id: 'iqoo',
      name: 'iQOO',
      icon: (
        <svg className="w-4 h-3" viewBox="0 0 32 16" fill="none">
          <rect width="32" height="16" rx="3.5" fill="#FFCC00" />
          <text x="16" y="11.5" fill="#000000" fontFamily="'Arial Black', Impact, sans-serif" fontWeight="900" fontSize="7.5" letterSpacing="-0.3" textAnchor="middle">iQOO</text>
        </svg>
      )
    },
    {
      id: 'tecno_itel',
      name: 'Tecno & itel',
      icon: (
        <svg className="w-4 h-3" viewBox="0 0 36 16" fill="none">
          <rect width="18" height="16" rx="3.5" fill="#0066FF" />
          <rect x="18" width="18" height="16" rx="3.5" fill="#E60012" />
          <text x="9" y="11" fill="#FFFFFF" fontFamily="'Inter', sans-serif" fontWeight="900" fontSize="5.8" textAnchor="middle">TEC</text>
          <text x="27" y="11" fill="#FFFFFF" fontFamily="'Inter', sans-serif" fontWeight="900" fontSize="5.8" textAnchor="middle">itel</text>
        </svg>
      )
    },
    {
      id: 'asus',
      name: 'ASUS ROG',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
          <path d="M2.5 13.5l4.8 2.2-2.1 1.7 5.5 3.6 4.3-5-3.8-1.5 5.5-2.2 4.1 4.2 2.7-1.5-3.5-3.8 4.7-1.8L12.5 1.5C9.8 1.5 7.6 2.7 6.1 4.7L2.5 13.5z" fill="#FF0033" />
          <path d="M12.2 8.5l-2.8 1.2 1.8.7-2.2 2.5 2.1-.8 1.1-3.6z" fill="#FFFFFF" />
        </svg>
      )
    },
    {
      id: 'others',
      name: 'Lainnya / Pixel',
      icon: <Smartphone className="w-3.5 h-3.5 text-slate-600" />
    }
  ];

  // Database model smartphone populer
  const modelsByBrand: Record<string, string[]> = {
    apple: [
      'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16',
      'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15',
      'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14',
      'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13 / 13 Mini',
      'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12 / 12 Mini',
      'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11',
      'iPhone XS Max', 'iPhone XS / XR', 'iPhone X', 'iPhone 8 / 8 Plus'
    ],
    samsung: [
      'Samsung Galaxy S24 Ultra', 'Samsung Galaxy S24+ / S24',
      'Samsung Galaxy S23 Ultra', 'Samsung Galaxy S23+ / S23',
      'Samsung Galaxy S22 Ultra', 'Samsung Galaxy S21 / S20 FE',
      'Samsung Galaxy Z Fold 5 / Z Fold 6', 'Samsung Galaxy Z Flip 5 / Z Flip 6',
      'Samsung Galaxy A55 5G', 'Samsung Galaxy A54 5G', 'Samsung Galaxy A35 / A34',
      'Samsung Galaxy A25 / A15', 'Samsung Galaxy Note 20 Ultra'
    ],
    xiaomi: [
      'Xiaomi 14 / 14 Ultra', 'Xiaomi 13T / 13T Pro', 'Xiaomi 12 / 12 Pro',
      'Redmi Note 13 Pro+ 5G', 'Redmi Note 13 Pro', 'Redmi Note 13 4G/5G',
      'Redmi Note 12 Pro 5G', 'Redmi Note 12', 'Redmi 13C / 12',
      'Redmi Note 11 / 10 Pro'
    ],
    poco: [
      'POCO F6 / F6 Pro', 'POCO X6 Pro 5G', 'POCO X6 5G',
      'POCO F5 / F5 Pro', 'POCO X5 Pro 5G', 'POCO F4 GT / F4',
      'POCO M6 Pro', 'POCO C65'
    ],
    oppo: [
      'OPPO Find X7 Ultra / Find X6 Pro', 'OPPO Reno 11 Pro 5G', 'OPPO Reno 11 5G',
      'OPPO Reno 10 Pro+ 5G', 'OPPO Reno 10 5G', 'OPPO Reno 8 / 8T',
      'OPPO A98 5G', 'OPPO A79 5G', 'OPPO A58 / A38'
    ],
    vivo: [
      'Vivo X100 Pro / X100', 'Vivo X90 Pro', 'Vivo V30 Pro 5G', 'Vivo V30 5G',
      'Vivo V29 5G', 'Vivo V27 5G', 'Vivo Y100 5G', 'Vivo Y36 / Y27'
    ],
    realme: [
      'Realme 12 Pro+ 5G', 'Realme 12+ 5G', 'Realme 11 Pro+ 5G',
      'Realme GT Neo 5', 'Realme GT 6', 'Realme C67', 'Realme C55 / C53'
    ],
    infinix: [
      'Infinix GT 20 Pro', 'Infinix Note 40 Pro+ 5G', 'Infinix Note 40',
      'Infinix GT 10 Pro', 'Infinix Zero 30 5G', 'Infinix Hot 40 Pro'
    ],
    iqoo: [
      'iQOO 12 / 12 Pro', 'iQOO Neo 9 Pro', 'iQOO Z9 5G / Z9 Turbo',
      'iQOO 11', 'iQOO Z7 5G'
    ],
    tecno_itel: [
      'Tecno Camon 30 Pro 5G', 'Tecno Spark 20 Pro+', 'Tecno Pova 6 Pro 5G',
      'itel S23+ (Curved AMOLED)', 'itel P55 5G', 'itel RS4'
    ],
    asus: [
      'ROG Phone 8 / 8 Pro', 'ROG Phone 7 Ultimate', 'ROG Phone 6',
      'Zenfone 10', 'Zenfone 9'
    ],
    others: [
      'Google Pixel 8 Pro / Pixel 8', 'Google Pixel 7 Pro / Pixel 7',
      'Huawei Mate 60 Pro / P60 Pro', 'Sony Xperia 1 V', 'iPad / Tablet'
    ]
  };

  // Daftar kerusakan & layanan komponen lengkap
  const problemOptions = [
    { 
      id: 'lcd', 
      label: 'Ganti Layar / LCD', 
      desc: 'OLED / Super Retina / Layar Sentuh / Kaca Retak',
      defaultCost: 450000, 
      warrantyDays: 30,
      icon: <Smartphone className="w-4 h-4 text-sky-500" />
    },
    { 
      id: 'baterai', 
      label: 'Ganti Baterai Original', 
      desc: 'Baterai drop, kembung, boros, restart sendiri (Garansi 90 Hari Penuh)',
      defaultCost: 250000, 
      warrantyDays: 90,
      icon: <Battery className="w-4 h-4 text-emerald-500" />
    },
    { 
      id: 'kaca', 
      label: 'Kaca Retak OCA (Glass)', 
      desc: 'Ganti kaca luar saja, LCD dan touchscreen masih normal',
      defaultCost: 300000, 
      warrantyDays: 30,
      icon: <Gem className="w-4 h-4 text-purple-500" />
    },
    { 
      id: 'charging', 
      label: 'Konektor / Port Cas', 
      desc: 'Tidak bisa cas, cas longgar, arus pengisian lambat',
      defaultCost: 150000, 
      warrantyDays: 14,
      icon: <Zap className="w-4 h-4 text-amber-500" />
    },
    { 
      id: 'kamera', 
      label: 'Kamera & Kaca Lensa', 
      desc: 'Kamera buram, getar OIS, kaca lensa pecah, blank hitam',
      defaultCost: 200000, 
      warrantyDays: 30,
      icon: <Camera className="w-4 h-4 text-rose-500" />
    },
    { 
      id: 'matot', 
      label: 'Mati Total / IC Power', 
      desc: 'Mati total, short sirkuit, konslet motherboard lab',
      defaultCost: 350000, 
      warrantyDays: 30,
      icon: <PowerOff className="w-4 h-4 text-red-500" />
    },
    { 
      id: 'air', 
      label: 'Pembersihan Kena Air', 
      desc: 'Water damage restoration, chemical cleaning sirkuit lab',
      defaultCost: 175000, 
      warrantyDays: 14,
      icon: <Droplet className="w-4 h-4 text-cyan-500" />
    },
    { 
      id: 'speaker', 
      label: 'Speaker & Mic Suara', 
      desc: 'Speaker kresek, suara telepon mati, mikrofon tidak terdengar',
      defaultCost: 150000, 
      warrantyDays: 14,
      icon: <Volume2 className="w-4 h-4 text-indigo-500" />
    },
    { 
      id: 'software', 
      label: 'Software & Flash', 
      desc: 'Bootloop logo, stuck recovery, lupa pola/sandi, update gagal',
      defaultCost: 100000, 
      warrantyDays: 7,
      icon: <Cpu className="w-4 h-4 text-blue-500" />
    },
    { 
      id: 'casing', 
      label: 'Backdoor / Housing', 
      desc: 'Backdoor pecah, housing bengkok, tombol volume/power',
      defaultCost: 150000, 
      warrantyDays: 30,
      icon: <ToolIcon className="w-4 h-4 text-slate-500" />
    }
  ];

  // Quick physical condition tags for counter offline
  const conditionTags = [
    'Layar Pecah / Retak',
    'Backdoor Retak',
    'Bezel Lecet Pemakaian',
    'Tanpa Kartu SIM',
    'Tanpa Softcase',
    'Unit Masih Bisa Hidup',
    'Mati Total dari Pelanggan',
    'Kamera Depan Masih Normal',
    'Baut Bawah Masih Utuh'
  ];

  // Form State
  const [selectedBrand, setSelectedBrand] = useState('apple');
  const [selectedModel, setSelectedModel] = useState('iPhone 11');
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [customModelInput, setCustomModelInput] = useState('');
  
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  const [selectedProblems, setSelectedProblems] = useState<Set<string>>(new Set(['baterai']));
  const [damageNotes, setDamageNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [district, setDistrict] = useState('Klojen');
  const [email, setEmail] = useState('');
  const [technician, setTechnician] = useState('Teknisi Meja 1 (Lab Layar & Hardware)');
  const [referralCode, setReferralCode] = useState('');
  const [mitraInfo, setMitraInfo] = useState<any>(null);
  const [mitraCheckStatus, setMitraCheckStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [estimatedCost, setEstimatedCost] = useState<number>(250000);
  
  const [submitting, setSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Update default model when brand changes
  const handleSelectBrand = (brandId: string) => {
    setSelectedBrand(brandId);
    setIsCustomModel(false);
    const list = modelsByBrand[brandId] || modelsByBrand.apple;
    setSelectedModel(list[0] || 'Smartphone');
  };

  // Recalculate estimated cost when problem checkboxes change
  const handleToggleProblem = (id: string) => {
    const next = new Set(selectedProblems);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedProblems(next);

    // Sum up default cost
    let total = 0;
    next.forEach((pId) => {
      const match = problemOptions.find(p => p.id === pId);
      if (match) total += match.defaultCost;
    });
    setEstimatedCost(total > 0 ? total : 200000);
  };

  // Quick append condition tag to physical notes
  const handleAddConditionTag = (tag: string) => {
    if (!damageNotes) {
      setDamageNotes(tag);
    } else if (!damageNotes.includes(tag)) {
      setDamageNotes(prev => `${prev}, ${tag}`);
    }
  };

  // Auto lookup customer if phone number entered
  const handlePhoneBlur = async () => {
    const raw = whatsapp.trim();
    if (!raw || customerName) return;
    try {
      const res = await fetchApi(`/api/customer/lookup?identifier=${encodeURIComponent(raw)}`);
      if (res.ok && res.data && res.data.success && res.data.customer) {
        const c = res.data.customer;
        setCustomerName(c.name || customerName);
        if (c.district) setDistrict(c.district);
        if (c.email) setEmail(c.email);
      }
    } catch (_) {}
  };

  // Live check referral code mitra
  const handleCheckReferral = async () => {
    const code = referralCode.trim().toUpperCase();
    if (!code) {
      setMitraInfo(null);
      setMitraCheckStatus('idle');
      return;
    }
    setMitraCheckStatus('checking');
    try {
      const res = await fetchApi(`/api/mitra/ref/${encodeURIComponent(code)}`);
      if (res.ok && res.data && res.data.success && res.data.mitra) {
        setMitraInfo(res.data.mitra);
        setMitraCheckStatus('valid');
      } else {
        setMitraInfo(null);
        setMitraCheckStatus('invalid');
      }
    } catch {
      setMitraCheckStatus('invalid');
    }
  };

  // Submit Handler: Register walk-in unit directly
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const finalPhoneType = isCustomModel ? (customModelInput.trim() || 'Smartphone') : selectedModel;
    if (!customerName.trim() || !whatsapp.trim() || !finalPhoneType) {
      setErrorMsg('Nama pelanggan, nomor WhatsApp, dan tipe smartphone wajib diisi.');
      return;
    }

    // Prepare problem labels
    const selectedProblemLabels: string[] = [];
    selectedProblems.forEach(pId => {
      const match = problemOptions.find(p => p.id === pId);
      if (match) selectedProblemLabels.push(match.label);
    });

    const fullDamageDescription = [
      selectedProblemLabels.length > 0 ? selectedProblemLabels.join(', ') : 'Servis Komponen Meja 1',
      damageNotes.trim() ? `Catatan: ${damageNotes.trim()}` : ''
    ].filter(Boolean).join(' • ');

    setSubmitting(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        district: district,
        brand: selectedBrand,
        phoneType: finalPhoneType,
        damage: fullDamageDescription,
        problemTags: Array.from(selectedProblems),
        cost: Number(estimatedCost) || 0,
        estimatedCost: Number(estimatedCost) || 0,
        technician: technician || currentUser?.name || 'Teknisi Meja 1',
        referralCode: referralCode.trim().toUpperCase() || '',
        affiliateRef: referralCode.trim().toUpperCase() || '',
        serviceMethod: 'walk_in_meja1',
        currentStep: 1,
        step: 1,
        status: 'Registrasi & Masuk',
        statusText: 'Unit diterima di counter Front Desk Meja 1'
      };

      const res = await fetchApi('/api/orders', {
        method: 'POST',
        body: payload
      });

      if (res.ok && res.data && res.data.success) {
        const orderCreated = res.data.data;
        setCreatedOrder(orderCreated);
        if (loadData) loadData();
      } else {
        setErrorMsg(res.data?.message || 'Gagal menerbitkan tiket walk-in. Silakan coba kembali.');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan jaringan server saat mendaftarkan unit walk-in.');
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form for next walk-in customer
  const handleResetForm = () => {
    setCreatedOrder(null);
    setCustomerName('');
    setWhatsapp('');
    setEmail('');
    setDamageNotes('');
    setReferralCode('');
    setMitraInfo(null);
    setMitraCheckStatus('idle');
    setIsCustomModel(false);
    setCustomModelInput('');
    setSelectedProblems(new Set(['baterai']));
    setEstimatedCost(250000);
  };

  // Print Slip Tanda Terima Fisik (Thermal Printer & A4)
  const handlePrintSlip = (order: any) => {
    const printWindow = window.open('', '_blank', 'width=450,height=650');
    if (!printWindow) {
      window.print();
      return;
    }

    const todayStr = new Date().toLocaleDateString('id-ID', { 
      day: 'numeric', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });

    const isBattery = /baterai|battery/i.test(order.damage || order.damageDescription || '');
    const warrantyLabel = isBattery ? 'Garansi Resmi Baterai 90 Hari (3 Bulan)' : 'Garansi Servis Hardware 30 Hari (1 Bulan)';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tanda Terima Servis - ${order.id}</title>
          <style>
            @page { size: 80mm auto; margin: 4mm; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              font-size: 11px; 
              line-height: 1.35; 
              margin: 0; 
              padding: 10px; 
              color: #000000; 
              max-width: 320px; 
            }
            .center { text-align: center; }
            .border-b { border-bottom: 1px dashed #444; padding-bottom: 8px; margin-bottom: 8px; }
            .row { display: flex; justify-content: space-between; margin: 3px 0; }
            .bold { font-weight: bold; }
            .title { font-size: 14px; font-weight: 900; letter-spacing: 0.5px; }
            .subtitle { font-size: 9px; color: #333; }
            .ticket-badge { 
              display: inline-block; 
              font-size: 15px; 
              font-weight: 900; 
              letter-spacing: 1px; 
              border: 2px solid #000; 
              padding: 4px 8px; 
              margin: 6px 0; 
            }
            .footer { font-size: 8.5px; text-align: center; margin-top: 10px; color: #444; }
            .sign-grid { display: flex; justify-content: space-between; margin-top: 25px; text-align: center; font-size: 9px; }
          </style>
        </head>
        <body>
          <div class="center border-b">
            <div class="title">NGALAM FIX PRO</div>
            <div class="subtitle">Pusat Reparasi Smartphone & Apple iPhone Malang</div>
            <div class="subtitle">Jl. Candi Mendut No.12 • WhatsApp: 082245233306</div>
            <div class="ticket-badge">${order.id}</div>
            <div class="subtitle">TANDA TERIMA INTAKE MEJA 1 (OFFLINE)</div>
          </div>

          <div class="border-b">
            <div class="row"><span>Waktu Masuk:</span><span>${todayStr}</span></div>
            <div class="row"><span>Front Desk:</span><span>${order.technician || 'Kasir Meja 1'}</span></div>
            <div class="row"><span>Pelanggan:</span><span class="bold">${order.customerName}</span></div>
            <div class="row"><span>WhatsApp:</span><span>${order.whatsapp}</span></div>
            ${order.district ? `<div class="row"><span>Wilayah:</span><span>${order.district}</span></div>` : ''}
          </div>

          <div class="border-b">
            <div class="row"><span>Tipe Perangkat:</span><span class="bold">${order.phoneType}</span></div>
            <div class="row"><span>Layanan / Kerusakan:</span></div>
            <div style="padding: 2px 0 4px 0; font-weight: bold;">${order.damage || order.damageDescription || 'Pemeriksaan Meja 1'}</div>
            <div class="row"><span>Estimasi Biaya:</span><span class="bold">Rp ${Number(order.cost || order.estimatedCost || 0).toLocaleString('id-ID')}</span></div>
            <div class="row"><span>Garansi Resmi:</span><span class="bold">${warrantyLabel}</span></div>
          </div>

          <div class="border-b footer">
            <div class="bold">KETENTUAN SERVIS MEJA TERBUKA:</div>
            <div>1. Harap bawa tanda terima ini saat pengambilan unit di counter.</div>
            <div>2. Garansi resmi berlaku terhitung setelah unit selesai & diambil.</div>
            <div>3. Lacak progres pengerjaan teknisi online 24 jam di:</div>
            <div class="bold" style="margin-top:2px;">ngalam1-delta.vercel.app/lacak?id=${order.id}</div>
          </div>

          <div class="sign-grid">
            <div>
              Hormat Kami,<br/><br/><br/>
              <b>( Petugas Kasir )</b>
            </div>
            <div>
              Pemilik Unit,<br/><br/><br/>
              <b>( ${order.customerName || 'Pelanggan'} )</b>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  // WhatsApp Notification Link Generator
  const generateWhatsAppLink = (order: any) => {
    const rawPhone = String(order.whatsapp || '').replace(/\D/g, '');
    const cleanPhone = rawPhone.startsWith('62') ? rawPhone : rawPhone.startsWith('0') ? '62' + rawPhone.slice(1) : '62' + rawPhone;
    const msg = encodeURIComponent(
      `Halo Kak *${order.customerName || 'Pelanggan'}*,\n\n` +
      `Terima kasih telah mempercayakan perbaikan smartphone Anda di workshop kami *Ngalam Fix Pro*!\n\n` +
      `📋 *TANDA TERIMA PENDAFTARAN UNIT WALK-IN*\n` +
      `• No. Tiket: *${order.id}*\n` +
      `• Perangkat: *${order.phoneType}*\n` +
      `• Kerusakan / Layanan: ${order.damage || order.damageDescription || '-'}\n` +
      `• Estimasi Biaya: Rp ${Number(order.cost || order.estimatedCost || 0).toLocaleString('id-ID')}\n` +
      `• Garansi Resmi: ${/baterai/i.test(order.damage || '') ? '90 Hari Penuh' : '30 Hari Hardware'}\n\n` +
      `🔍 *Pantau Progres Pengerjaan Meja Lab Live:*\n` +
      `https://ngalam1-delta.vercel.app/lacak?id=${order.id}\n\n` +
      `Unit Anda sedang masuk antrean meja lab teknisi kami. Tim kami akan segera mengabari saat unit siap diambil di workshop.\n\n` +
      `Workshop Ngalam Fix Pro • Jl. Candi Mendut No.12, Malang`
    );
    return `https://wa.me/${cleanPhone}?text=${msg}`;
  };

  const currentBrandModels = modelsByBrand[selectedBrand] || modelsByBrand.apple;
  const filteredModels = currentBrandModels.filter(m => 
    m.toLowerCase().includes(modelSearchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* 1. Header Banner Kasir Offline */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-300"></div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-600" />
                <span>Pendaftaran Unit Masuk Walk-in (Front Desk Offline)</span>
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                Meja 1 Kasir Counter
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Formulir penerimaan unit pelanggan offline yang datang langsung ke workshop. Dilengkapi pemilih merek &amp; tipe HP, estimasi biaya otomatis, cetak slip fisik kasir, dan notifikasi WhatsApp tiket antrian.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Standar Lab: 30 - 60 Menit</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. SUCCESS CARD (Saat Tiket Walk-in Berhasil Dibuat) */}
      {createdOrder ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-400 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 border-2 border-emerald-300 flex items-center justify-center mx-auto shadow-inner">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <span className="text-[11px] font-black text-emerald-700 uppercase tracking-widest block">
              Pendaftaran Unit Offline Berhasil!
            </span>
            <h3 className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-wider">
              {createdOrder.id}
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Unit smartphone <b>{createdOrder.phoneType}</b> milik <b>{createdOrder.customerName}</b> telah resmi terdaftar di sistem antrean Meja Lab Teknisi.
            </p>
          </div>

          {/* Rincian Slip Ringkas */}
          <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs space-y-2 text-slate-800 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Nomor WhatsApp:</span>
              <strong className="text-slate-900">{createdOrder.whatsapp}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tipe Smartphone:</span>
              <strong className="text-slate-900">{createdOrder.phoneType}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Kerusakan / Layanan:</span>
              <span className="font-semibold text-right max-w-xs">{createdOrder.damage || createdOrder.damageDescription}</span>
            </div>
            <div className="flex justify-between border-t border-amber-200/80 pt-2 text-sm font-sans font-bold">
              <span>Estimasi Biaya Awal:</span>
              <span className="text-amber-800">{formatRp(createdOrder.cost || createdOrder.estimatedCost || 0)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-emerald-700 font-sans font-bold">
              <span>Garansi Resmi:</span>
              <span>{/baterai/i.test(createdOrder.damage || '') ? '🛡️ Garansi Baterai 90 Hari' : '🛡️ Garansi Hardware 30 Hari'}</span>
            </div>
          </div>

          {/* Action Buttons: Cetak Slip & Kirim WA & Reset */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              type="button"
              onClick={() => handlePrintSlip(createdOrder)}
              className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Cetak Slip Tanda Terima (Fisik)</span>
            </button>

            <a
              href={generateWhatsAppLink(createdOrder)}
              target="_blank"
              rel="noreferrer"
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
            >
              <Share2 className="w-4 h-4 text-white" />
              <span>Kirim Tiket ke WhatsApp Pelanggan</span>
            </a>

            <button
              type="button"
              onClick={handleResetForm}
              className="py-3 px-4 rounded-xl border-2 border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4 text-amber-700" />
              <span>+ Input Pendaftaran Berikutnya</span>
            </button>
          </div>
        </div>
      ) : (
        /* 3. MAIN FORM PENDAFTARAN WALK-IN BIASA */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-8">
          
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* LANGKAH 1: PILIH MEREK & TIPE SMARTPHONE */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-500 text-white text-[11px] font-black flex items-center justify-center">1</span>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Pilih Merek &amp; Model Smartphone Pelanggan <span className="text-rose-500">*</span>
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">Pilih logo merek untuk menampilkan seri HP</span>
              </div>

              {/* Grid Chips Logo Merek */}
              <div className="flex flex-wrap gap-2">
                {brandsList.map((b) => {
                  const isSelected = selectedBrand === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleSelectBrand(b.id)}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-amber-500 border-amber-600 text-white shadow-md shadow-amber-500/25 scale-102'
                          : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-700 hover:border-amber-300'
                      }`}
                    >
                      {b.icon}
                      <span>{b.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tipe / Seri Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Tipe / Seri Smartphone</span>
                  <button
                    type="button"
                    onClick={() => setIsCustomModel(!isCustomModel)}
                    className="text-[11px] text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {isCustomModel ? '← Pilih dari Daftar Populer' : '✏️ Tipe Tidak Ada? Ketik Manual'}
                  </button>
                </div>

                {isCustomModel ? (
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Contoh: iPhone 13 Pro Max 256GB Sierra Blue, Samsung Galaxy A73 5G..."
                      value={customModelInput}
                      onChange={(e) => setCustomModelInput(e.target.value)}
                      className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-amber-300 bg-amber-50/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-slate-900 placeholder:text-slate-400"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="relative w-full" ref={modelDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer text-left bg-white ${
                        modelDropdownOpen 
                          ? 'border-amber-500 ring-2 ring-amber-400/20' 
                          : 'border-slate-200 hover:border-amber-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Smartphone className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {selectedModel || 'Pilih Tipe Smartphone...'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full hidden sm:inline">
                          {currentBrandModels.length} Tipe Tersedia
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${modelDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {modelDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl bg-white border border-amber-300 shadow-2xl overflow-hidden">
                        <div className="p-2 bg-slate-50 border-b border-slate-200">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              placeholder="Cari tipe model..."
                              value={modelSearchQuery}
                              onChange={(e) => setModelSearchQuery(e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:border-amber-500 outline-none text-slate-800"
                              autoFocus
                            />
                          </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                          {filteredModels.map((m) => {
                            const isCurrent = selectedModel === m;
                            return (
                              <button
                                key={m}
                                type="button"
                                onClick={() => {
                                  setSelectedModel(m);
                                  setModelDropdownOpen(false);
                                  setModelSearchQuery('');
                                }}
                                className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-xs transition-colors cursor-pointer ${
                                  isCurrent ? 'bg-amber-50 text-amber-900 font-bold border-l-4 border-amber-500' : 'text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <span>{m}</span>
                                {isCurrent && <Check className="w-3.5 h-3.5 text-amber-600" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* LANGKAH 2: PILIH KERUSAKAN & LAYANAN KOMPONEN */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-500 text-white text-[11px] font-black flex items-center justify-center">2</span>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Gejala Kerusakan &amp; Layanan Komponen <span className="text-rose-500">*</span>
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">Bisa pilih lebih dari satu kendala</span>
              </div>

              {/* Grid Opsi Kerusakan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {problemOptions.map((item) => {
                  const isChecked = selectedProblems.has(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleToggleProblem(item.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                        isChecked 
                          ? 'bg-amber-50/70 border-amber-400 shadow-xs' 
                          : 'bg-slate-50/50 hover:bg-white border-slate-200'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center mt-0.5 shrink-0 ${
                        isChecked ? 'bg-amber-500 text-white' : 'border border-slate-300 bg-white'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            {item.icon}
                            <span>{item.label}</span>
                          </span>
                          <span className="text-[11px] font-mono font-bold text-amber-800">
                            {formatRp(item.defaultCost)}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Quick Physical Condition Tags */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-500 block">
                  Tag Cepat Kondisi Fisik Unit Saat Diterima (Klik untuk menambahkan):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {conditionTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddConditionTag(tag)}
                      className="px-2.5 py-1 rounded-lg text-[10.5px] font-semibold bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 transition-colors cursor-pointer"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Catatan Fisik / Keluhan Tambahan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Kondisi Fisik &amp; Kronologi Kerusakan
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Layar retak sudut kanan bawah, bezel lecet pemakaian, tanpa kartu SIM, kondisi awal masih bisa dicas..."
                  value={damageNotes}
                  onChange={(e) => setDamageNotes(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-slate-800 placeholder:text-slate-400"
                />
              </div>

              {/* Estimasi Biaya Reparasi Awal (Editable) */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 block">
                    Estimasi Biaya Awal Disepakati Pelanggan (Rp)
                  </span>
                  <span className="text-[11px] text-slate-600">
                    Otomatis terakumulasi dari checklist komponen, dapat disesuaikan manual oleh kasir.
                  </span>
                </div>

                <div className="relative w-full sm:w-48">
                  <span className="text-xs font-bold text-amber-900 absolute left-3 top-1/2 -translate-y-1/2">Rp</span>
                  <input
                    type="number"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(Number(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-amber-300 bg-white font-mono text-sm font-black text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* LANGKAH 3: DATA PELANGGAN OFFLINE */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-500 text-white text-[11px] font-black flex items-center justify-center">3</span>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Data Kontak Pelanggan Walk-in <span className="text-rose-500">*</span>
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">Notifikasi nomor tiket dikirim ke WhatsApp ini</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="08123456789 (Ketik lalu klik luar untuk cek pelanggan lama)"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      onBlur={handlePhoneBlur}
                      className="w-full text-xs font-mono font-bold pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap Pelanggan <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Bpk. Ferdinand / Ibu Dewi"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full text-xs font-bold pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Wilayah / Kecamatan Malang
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-slate-800"
                  >
                    <option value="Klojen">Klojen (Pusat Kota)</option>
                    <option value="Lowokwaru">Lowokwaru (Area Kampus UB/UM/Polinema)</option>
                    <option value="Blimbing">Blimbing / Araya</option>
                    <option value="Sukun">Sukun / Gadang</option>
                    <option value="Kedungkandang">Kedungkandang / Sawojajar</option>
                    <option value="Kota Batu">Kota Wisata Batu</option>
                    <option value="Kabupaten Malang">Kabupaten Malang (Singosari, Lawang, Kepanjen)</option>
                    <option value="Luar Kota">Tamu / Luar Kota Malang</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Pelanggan (Opsional)
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="email@pelanggan.com (Opsional)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* LANGKAH 4: MEJA LAB & REKOMENDASI MITRA */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-500 text-white text-[11px] font-black flex items-center justify-center">4</span>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Penugasan Meja Lab &amp; Referral Driver
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teknisi / Meja Lab Penanggungjawab
                  </label>
                  <select
                    value={technician}
                    onChange={(e) => setTechnician(e.target.value)}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-slate-800"
                  >
                    <option value="Teknisi Meja 1 (Lab Layar & Hardware)">Teknisi Meja 1 (Lab Layar &amp; Hardware)</option>
                    <option value="Teknisi Meja 2 (Lab Baterai & Charging)">Teknisi Meja 2 (Lab Baterai &amp; Charging)</option>
                    <option value="Teknisi Meja 3 (Lab Mesin, IC & Soldering)">Teknisi Meja 3 (Lab Mesin, IC &amp; Soldering)</option>
                    <option value="Front Desk Meja 1">Front Desk / Meja 1 Intake</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Kode Referral Mitra / Driver</span>
                    <span className="text-[10px] text-amber-700 font-bold">Bagi Hasil Otomatis</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-amber-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="MTR-ROHMAN-5678 (Kosongkan jika mandiri)"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        onBlur={handleCheckReferral}
                        className="w-full text-xs font-mono font-bold pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase text-amber-700"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCheckReferral}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 font-bold text-xs cursor-pointer transition-colors"
                    >
                      Cek
                    </button>
                  </div>
                  {mitraCheckStatus === 'valid' && mitraInfo && (
                    <span className="text-[11px] font-bold text-emerald-700 mt-1 block">
                      ✨ Rekomendasi Mitra: {mitraInfo.name} ({mitraInfo.code || mitraInfo.referralCode})
                    </span>
                  )}
                  {mitraCheckStatus === 'invalid' && (
                    <span className="text-[11px] text-rose-600 mt-1 block font-semibold">
                      ⚠️ Kode mitra tidak terdaftar di sistem.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-black text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Menerbitkan Tiket Antrian Masuk Meja 1...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 stroke-[3]" />
                    <span>Daftarkan Unit Walk-in &amp; Terbitkan Tiket Resmi Meja 1</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-2.5 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Unit otomatis masuk ke antrean Step 1 Meja Lab Teknisi dan siap dicetak tanda terima fisiknya.</span>
              </p>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
