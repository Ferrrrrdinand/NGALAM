import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, X, Smartphone, Battery, MapPin, 
  Search, MessageSquare 
} from 'lucide-react';
import { fetchApi } from '../utils/api';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Halo! Saya <b>NgalamBot</b>, asisten cerdas spesialis smartphone Ngalam Fix Pro. Ada yang bisa saya bantu terkait estimasi biaya, ganti layar OLED, baterai original, atau lokasi workshop kami?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (queryText) => {
    const text = (queryText || inputMessage).trim();
    if (!text || isTyping) return;

    const userMsg = { sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const res = await fetchApi('/api/chat', {
        method: 'POST',
        body: { message: text }
      });

      if (res.ok && res.data.success) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: res.data.reply || 'Mohon maaf, saya belum memahami pertanyaan Anda. Anda bisa langsung menghubungi teknisi kami via WhatsApp.'
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: 'Halo kak, untuk bantuan lebih cepat silakan hubungi tim kami via WhatsApp di 0813-3030-4321 ya!'
          }
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Jaringan sibuk. Silakan langsung chat kami melalui WhatsApp.'
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={`chatbot-container ${isOpen ? 'panel-open' : ''}`}>
      {!isOpen && (
        <button
          type="button"
          className="chatbot-trigger"
          id="chatbotTrigger"
          aria-label="Buka NgalamBot AI"
          onClick={() => setIsOpen(true)}
        >
          <div className="chatbot-trigger-avatar">
            <div className="chatbot-avatar-frame">
              <img src="/images/ngalambot-avatar.jpg" alt="NgalamBot AI" className="chatbot-avatar-img" />
            </div>
            <span className="chatbot-online-dot"></span>
          </div>
          <div className="chatbot-trigger-text">
            <span className="chatbot-trigger-title">Tanya NgalamBot</span>
            <span className="chatbot-trigger-sub">AI Asisten Servis HP</span>
          </div>
          <div className="chatbot-trigger-badge">
            <span className="pulse-green-dot"></span>
            <span>Online</span>
          </div>
        </button>
      )}

      <div className={`chatbot-panel ${isOpen ? 'active show' : ''}`} id="chatbotPanel" style={{ display: isOpen ? 'flex' : 'none' }}>
        <div className="chatbot-header">
          <div className="chatbot-title-box">
            <div className="chatbot-header-avatar">
              <img src="/images/ngalambot-avatar.jpg" alt="NgalamBot AI" className="chatbot-avatar-img" />
              <span className="chatbot-online-dot"></span>
            </div>
            <div className="chatbot-header-text">
              <strong>NgalamBot <span className="chatbot-pill-tag">AI PRO</span></strong>
              <small><span className="pulse-green-dot"></span> Siap Menjawab 24/7</small>
            </div>
          </div>
          <div className="chatbot-header-actions">
            <a href="https://wa.me/6281330304321?text=Halo%20Ngalam%20Fix%20Pro,%20saya%20ingin%20tanya%20servis%20HP" target="_blank" rel="noopener noreferrer" className="chatbot-wa-btn" title="Chat WhatsApp PIC Workshop">
              <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5 inline" /> WA</span>
            </a>
            <button type="button" className="chatbot-close-btn" id="chatbotClose" aria-label="Tutup Chat" onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="chatbot-body" id="chatbotMessages">
          {messages.map((m, idx) => (
            <div key={idx} className={`chatbot-bubble-row ${m.sender}`}>
              {m.sender === 'bot' && (
                <div className="ai-bubble-avatar" title="NgalamBot AI Assistant">
                  <div className="ai-mini-orb-plasma"></div>
                  <svg className="ai-mini-orb-svg" viewBox="0 0 24 24" fill="none">
                    <defs>
                      <linearGradient id={`aiOrbGradWelcome_${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#38bdf8"/>
                        <stop offset="50%" stopColor="#ffffff"/>
                        <stop offset="100%" stopColor="#d4af37"/>
                      </linearGradient>
                    </defs>
                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill={`url(#aiOrbGradWelcome_${idx})`}/>
                    <circle cx="12" cy="12" r="2.8" fill="#ffffff"/>
                  </svg>
                </div>
              )}
              <div
                className={`chatbot-bubble ${m.sender}`}
                dangerouslySetInnerHTML={{ __html: m.text }}
              />
            </div>
          ))}
          {isTyping && (
            <div className="chatbot-bubble-row bot">
              <div className="chatbot-bubble bot">
                <i>NgalamBot sedang mengetik...</i>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chatbot-chips">
          <button type="button" className="chatbot-chip flex items-center gap-1" onClick={() => handleSend('Berapa biaya ganti LCD?')}>
            <Smartphone className="w-3 h-3 text-sky-400" /> Biaya Layar/LCD
          </button>
          <button type="button" className="chatbot-chip flex items-center gap-1" onClick={() => handleSend('Berapa biaya ganti baterai?')}>
            <Battery className="w-3 h-3 text-emerald-400" /> Ganti Baterai
          </button>
          <button type="button" className="chatbot-chip flex items-center gap-1" onClick={() => handleSend('Di mana lokasi workshop?')}>
            <MapPin className="w-3 h-3 text-rose-400" /> Lokasi Workshop
          </button>
          <button type="button" className="chatbot-chip flex items-center gap-1" onClick={() => handleSend('Bagaimana cara lacak status servis?')}>
            <Search className="w-3 h-3 text-indigo-400" /> Lacak Tiket
          </button>
          <button type="button" className="chatbot-chip flex items-center gap-1" onClick={() => handleSend('Bagaimana cara hubungi WhatsApp workshop?')}>
            <MessageSquare className="w-3 h-3 text-emerald-400" /> Kontak WhatsApp
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="chatbot-input-area">
          <div className="chatbot-input-box">
            <input
              type="text"
              id="chatbotInput"
              placeholder="Ketik pertanyaan seputar servis HP..."
              autoComplete="off"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
            />
          </div>
          <button type="submit" id="chatbotSendBtn" className="chatbot-send-icon-btn" aria-label="Kirim Pesan">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
