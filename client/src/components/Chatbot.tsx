import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Send, Bot, Sparkles, MessageSquare, Zap, ShieldCheck, MapPin, Smartphone, Battery, ChevronRight
} from 'lucide-react';
import { fetchApi } from '../utils/api';
import botAvatar from '../assets/images/ngalambot-avatar.jpg';

interface ChatMessage {
  sender: 'bot' | 'user';
  text: string;
  chips?: string[];
  time?: string;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      text: 'Halo! Saya <b>NgalamBot</b>, asisten cerdas spesialis smartphone Ngalam Fix Pro. Ada yang bisa saya bantu terkait estimasi biaya, garansi resmi baterai 90 hari, ganti layar OLED, atau lokasi workshop kami?',
      chips: [
        '🔋 Ganti Baterai Original',
        '📱 Ganti Layar OLED / LCD',
        '🛡️ Kebijakan Garansi Servis',
        '📍 Alamat & Lokasi Workshop',
        '⚡ Servis Mati Total / Kena Air'
      ],
      time: 'Baru saja'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (queryText?: string) => {
    const text = (queryText || inputMessage).trim();
    if (!text || isTyping) return;

    const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = { sender: 'user', text, time: currentTime };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const res = await fetchApi('/api/chat', {
        method: 'POST',
        body: { message: text }
      });

      if (res.ok && res.data && res.data.success) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: res.data.reply || 'Mohon maaf, saya belum memahami pertanyaan Anda. Anda bisa langsung menghubungi teknisi kami via WhatsApp.',
            chips: Array.isArray(res.data.chips) ? res.data.chips : undefined,
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: 'Halo kak, untuk info lebih cepat silakan langsung hubungi PIC kami via WhatsApp di <b>0813-3030-4321</b>.',
            chips: ['💬 Hubungi WhatsApp PIC', '📍 Lokasi Workshop'],
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Jaringan sibuk. Anda dapat berkonsultasi langsung dengan tim teknisi kami via WhatsApp di <b>0813-3030-4321</b>.',
          chips: ['💬 Hubungi WhatsApp PIC'],
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Quick prompt presets
  const quickPresets = [
    { label: 'Ganti Baterai (90 Hari)', text: 'Berapa biaya ganti baterai original dan berapa lama garansinya?' },
    { label: 'Ganti Layar OLED', text: 'Berapa estimasi ganti layar OLED atau LCD iPhone dan Android?' },
    { label: 'Garansi Servis', text: 'Bagaimana kebijakan garansi servis di Ngalam Fix Pro?' },
    { label: 'Alamat Workshop', text: 'Dimana alamat dan jam operasional workshop Ngalam Fix Pro?' },
    { label: 'Mati Total / Kena Air', text: 'Apakah bisa servis HP mati total atau korsleting kena air?' },
  ];

  return (
    <div className={`chatbot-container ${isOpen ? 'panel-open' : ''}`}>
      {/* ======================================================== */}
      {/* FLOATING TRIGGER PILL (MINIMIZED) */}
      {/* ======================================================== */}
      {!isOpen && (
        <button
          type="button"
          className="chatbot-trigger group cursor-pointer"
          id="chatbotTrigger"
          aria-label="Buka Tanya NgalamBot AI"
          onClick={() => setIsOpen(true)}
        >
          <div className="chatbot-trigger-avatar">
            <div className="chatbot-avatar-frame">
              <img 
                src={botAvatar} 
                alt="NgalamBot AI" 
                className="chatbot-avatar-img" 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/images/ngalambot-avatar.jpg";
                }}
              />
            </div>
            <span className="chatbot-online-dot"></span>
          </div>

          <div className="chatbot-trigger-text">
            <span className="chatbot-trigger-title text-slate-900 group-hover:text-amber-800 transition-colors">
              Tanya NgalamBot
            </span>
            <span className="chatbot-trigger-sub text-amber-700 font-semibold">
              AI Asisten Servis HP
            </span>
          </div>

          <div className="chatbot-trigger-badge">
            <span className="pulse-green-dot"></span>
            <span>Online</span>
          </div>
        </button>
      )}

      {/* ======================================================== */}
      {/* CHATBOT POPUP PANEL (WHITE & GOLD LUXURY THEME) */}
      {/* ======================================================== */}
      <div 
        className={`chatbot-panel ${isOpen ? 'active' : ''}`}
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(212, 175, 55, 0.25), 0 10px 25px rgba(212, 175, 55, 0.1)',
          border: '1.5px solid rgba(212, 175, 55, 0.35)'
        }}
      >
        {/* Top Gold Gradient Trim */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-300 shrink-0"></div>

        {/* Panel Header */}
        <div className="px-4 py-3.5 bg-white border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full border-2 border-amber-400 p-0.5 shadow-sm bg-white shrink-0">
              <img 
                src={botAvatar} 
                alt="NgalamBot AI" 
                className="w-full h-full object-cover rounded-full" 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/images/ngalambot-avatar.jpg";
                }}
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 leading-tight">
                  NgalamBot AI
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  ONLINE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 leading-tight">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Asisten Spesialis Servis HP</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <a
              href="https://wa.me/6281330304321?text=Halo%20Admin%20Ngalam%20Fix%20Pro,%20saya%20ingin%20konsultasi%20langsung"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors hidden sm:inline-flex items-center gap-1"
              title="Chat WhatsApp Teknisi"
            >
              <span>WhatsApp</span>
            </a>

            <button 
              type="button" 
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Tutup Chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feature Banner Bar */}
        <div className="px-4 py-2 bg-gradient-to-r from-amber-50/90 via-amber-50/50 to-amber-100/40 border-b border-amber-200/60 text-[11px] font-semibold text-amber-900 flex items-center gap-1.5 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="truncate">Tanya estimasi biaya, garansi resmi &amp; ketersediaan part</span>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
          {messages.map((m, idx) => (
            <div 
              key={idx} 
              className={`flex gap-2.5 items-start ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'bot' && (
                <div className="w-7 h-7 rounded-full border border-amber-300 bg-white p-0.5 shadow-2xs shrink-0 mt-0.5">
                  <img 
                    src={botAvatar} 
                    alt="Bot" 
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/images/ngalambot-avatar.jpg";
                    }}
                  />
                </div>
              )}

              <div className="max-w-[85%] space-y-1">
                <div 
                  className={`p-3.5 text-xs sm:text-[13px] leading-relaxed shadow-2xs ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl rounded-tr-xs font-medium shadow-amber-500/20'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-2xl rounded-tl-xs'
                  }`}
                  style={{
                    wordBreak: 'break-word'
                  }}
                  dangerouslySetInnerHTML={{ __html: m.text }}
                />

                {/* Sub Quick Chips inside bot reply if provided */}
                {m.chips && m.chips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {m.chips.map((ch, cIdx) => (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => handleSend(ch)}
                        className="text-[11px] font-semibold text-amber-900 bg-white hover:bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-full shadow-2xs transition-all hover:scale-102 cursor-pointer flex items-center gap-1"
                      >
                        <span>{ch}</span>
                        <ChevronRight className="w-3 h-3 text-amber-600" />
                      </button>
                    ))}
                  </div>
                )}

                {m.time && (
                  <span className={`text-[10px] text-slate-400 block px-1 ${m.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {m.time}
                  </span>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-2.5 items-center">
              <div className="w-7 h-7 rounded-full border border-amber-300 bg-white p-0.5 shadow-2xs shrink-0">
                <img src={botAvatar} alt="Bot" className="w-full h-full object-cover rounded-full" />
              </div>
              <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs px-3.5 py-2.5 shadow-2xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Horizontal Quick Preset Chips (Always accessible above input) */}
        <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          {quickPresets.map((pr, pIdx) => (
            <button
              key={pIdx}
              type="button"
              onClick={() => handleSend(pr.text)}
              className="text-[11px] font-bold text-slate-700 hover:text-amber-900 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 px-2.5 py-1 rounded-full whitespace-nowrap transition-all shadow-2xs cursor-pointer shrink-0"
            >
              {pr.label}
            </button>
          ))}
        </div>

        {/* Chat Input Bar (PURE WHITE & LUXURY GOLD) */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
          className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0"
        >
          <input 
            type="text" 
            className="flex-1 bg-slate-50 border border-slate-200/90 rounded-full px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none transition-all" 
            placeholder="Tulis pertanyaan kendala HP Anda..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={!inputMessage.trim() || isTyping}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 disabled:opacity-40 text-white flex items-center justify-center shadow-md shadow-amber-500/20 active:scale-95 transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed"
            title="Kirim Pesan"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
      </div>
    </div>
  );
}
