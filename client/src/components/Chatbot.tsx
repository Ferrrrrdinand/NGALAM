import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Send, Bot 
} from 'lucide-react';
import { fetchApi } from '../utils/api';
import botAvatar from '../assets/images/ngalambot-avatar.jpg';

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

  const handleSend = async (queryText?: string) => {
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
          text: 'Jaringan sibuk. Silakan langsung chat kami melalui WhatsApp di 0813-3030-4321.'
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
            <span className="chatbot-trigger-title">Tanya NgalamBot</span>
            <span className="chatbot-trigger-sub">AI Asisten Servis HP</span>
          </div>
          <div className="chatbot-trigger-badge">
            <span className="pulse-green-dot"></span>
            <span>Online</span>
          </div>
        </button>
      )}

      {/* Popup Panel */}
      <div className={`chatbot-panel ${isOpen ? 'active' : ''}`}>
        <div className="chatbot-header">
          <div className="chatbot-title-box">
            <div className="chatbot-header-avatar">
              <img 
                src={botAvatar} 
                alt="NgalamBot AI" 
                className="chatbot-avatar-img" 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/images/ngalambot-avatar.jpg";
                }}
              />
              <span className="chatbot-online-dot"></span>
            </div>
            <div className="chatbot-header-text">
              <strong>NgalamBot AI <span className="chatbot-pill-tag">ONLINE</span></strong>
              <small><span className="pulse-green-dot"></span> Asisten Spesialis Servis HP</small>
            </div>
          </div>
          <div className="chatbot-header-actions">
            <button 
              type="button" 
              className="chatbot-icon-btn" 
              onClick={() => setIsOpen(false)}
              aria-label="Tutup Chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="chatbot-banner">
          ⚡ Tanya estimasi biaya, garansi, atau cek stok LCD &amp; baterai
        </div>

        <div className="chatbot-messages">
          {messages.map((m, idx) => (
            <div key={idx} className={`chatbot-msg-row ${m.sender === 'user' ? 'user' : 'bot'}`}>
              {m.sender === 'bot' && (
                <div className="chatbot-msg-avatar">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="chatbot-msg-content">
                <div 
                  className={`chatbot-bubble ${m.sender === 'user' ? 'user' : 'bot'}`}
                  dangerouslySetInnerHTML={{ __html: m.text }}
                />
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="chatbot-msg-row bot">
              <div className="chatbot-msg-avatar">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="chatbot-msg-content">
                <div className="chatbot-bubble bot typing">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="chatbot-input-bar">
          <input 
            type="text" 
            className="chatbot-input" 
            placeholder="Ketik pertanyaan atau kendala HP Anda..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
          />
          <button type="submit" className="chatbot-send-btn" disabled={!inputMessage.trim() || isTyping}>
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
      </div>
    </div>
  );
}
