/**
 * NGALAM FIX PRO - Floating Chatbot Assistant (NgalamBot)
 * Lightweight Client Connector to Node.js Backend (/api/chat)
 */

document.addEventListener('DOMContentLoaded', () => {
  const chatbotTrigger = document.getElementById('chatbotTrigger');
  const chatbotPanel = document.getElementById('chatbotPanel');
  const chatbotClose = document.getElementById('chatbotClose');
  const chatbotMessages = document.getElementById('chatbotMessages');
  const chatbotInput = document.getElementById('chatbotInput');
  const chatbotSendBtn = document.getElementById('chatbotSendBtn');
  const chatbotChipsContainer = document.querySelector('.chatbot-chips');

  if (!chatbotTrigger || !chatbotPanel) return;

  let API_BASE = (typeof window !== 'undefined' && window.getNgalamApiBase)
    ? window.getNgalamApiBase()
    : ((window.location.port === '3000' || window.location.port === '3001' || window.location.port === '3002') ? '' : 'http://localhost:3000');

  function toggleChatbot() {
    chatbotPanel.classList.toggle('active');
    if (chatbotPanel.classList.contains('active')) {
      chatbotInput?.focus();
    }
  }

  chatbotTrigger.addEventListener('click', toggleChatbot);
  chatbotClose?.addEventListener('click', () => chatbotPanel.classList.remove('active'));

  function appendMessage(sender, text) {
    if (!chatbotMessages) return;

    const isSubdir = window.location.pathname.includes('/layanan') ||
                     window.location.pathname.includes('/pesan-servis') ||
                     window.location.pathname.includes('/kontak') ||
                     window.location.pathname.includes('/login') ||
                     window.location.pathname.includes('/admin') ||
                     window.location.pathname.includes('/teknisi');
    const prefix = isSubdir ? '../' : '';
    const avatarImg = `${prefix}images/ngalam-bot-ai.jpg`;

    let processedText = text;
    if (sender === 'bot') {
      processedText = processedText.replace(/href="login\/index\.html/g, `href="${prefix}login/index.html`);
    }

    const rowDiv = document.createElement('div');
    rowDiv.className = `chatbot-bubble-row ${sender}`;

    if (sender === 'bot') {
      rowDiv.innerHTML = `
        <div class="ai-bubble-avatar" title="NgalamBot AI Assistant">
          <img src="${avatarImg}" alt="NgalamBot AI Avatar">
        </div>
        <div class="chatbot-bubble bot">${processedText}</div>
      `;
    } else {
      rowDiv.innerHTML = `
        <div class="chatbot-bubble user">${processedText}</div>
      `;
    }

    chatbotMessages.appendChild(rowDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }

  function showTyping() {
    const isSubdir = window.location.pathname.includes('/layanan') ||
                     window.location.pathname.includes('/pesan-servis') ||
                     window.location.pathname.includes('/kontak') ||
                     window.location.pathname.includes('/login') ||
                     window.location.pathname.includes('/admin') ||
                     window.location.pathname.includes('/teknisi');
    const prefix = isSubdir ? '../' : '';
    const avatarImg = `${prefix}images/ngalam-bot-ai.jpg`;

    // Activate thinking state on all AI animated avatars
    document.querySelectorAll('.ai-avatar-animated').forEach(el => el.classList.add('is-thinking'));

    const typingDiv = document.createElement('div');
    typingDiv.id = 'botTypingIndicator';
    typingDiv.className = 'chatbot-bubble-row bot';
    typingDiv.innerHTML = `
      <div class="ai-bubble-avatar" style="border-color: #a855f7;">
        <img src="${avatarImg}" alt="NgalamBot AI Avatar">
      </div>
      <div class="chatbot-bubble bot" style="display:inline-flex;align-items:center;gap:8px;">
        <span style="font-size:0.76rem;color:#c084fc;font-weight:600;">NgalamBot menganalisa</span>
        <span style="display:inline-flex;gap:4px;align-items:center;">
          <span style="width:5px;height:5px;background:#c084fc;border-radius:50%;display:inline-block;animation:pulse 0.8s infinite;"></span>
          <span style="width:5px;height:5px;background:#c084fc;border-radius:50%;display:inline-block;animation:pulse 0.8s infinite 0.2s;"></span>
          <span style="width:5px;height:5px;background:#c084fc;border-radius:50%;display:inline-block;animation:pulse 0.8s infinite 0.4s;"></span>
        </span>
      </div>
    `;
    chatbotMessages?.appendChild(typingDiv);
    if (chatbotMessages) chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }

  function hideTyping() {
    document.querySelectorAll('.ai-avatar-animated').forEach(el => el.classList.remove('is-thinking'));
    const el = document.getElementById('botTypingIndicator');
    if (el) el.remove();
  }

  function updateChips(chips = []) {
    if (!chatbotChipsContainer || !chips || chips.length === 0) return;
    chatbotChipsContainer.innerHTML = '';
    chips.forEach((c) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chatbot-chip';
      btn.textContent = c;
      btn.addEventListener('click', () => {
        appendMessage('user', c);
        fetchBotResponse(c);
      });
      chatbotChipsContainer.appendChild(btn);
    });
  }

  // Communicate directly with Node.js Backend
  async function fetchBotResponse(userText) {
    showTyping();
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      });
      const data = await res.json();
      hideTyping();
      if (data.success && data.reply) {
        appendMessage('bot', data.reply);
        if (data.chips && data.chips.length > 0) {
          updateChips(data.chips);
        }
      } else {
        appendMessage('bot', 'Maaf, terjadi kendala saat memproses jawaban dari server Node.js.');
      }
    } catch (err) {
      hideTyping();
      appendMessage('bot', `⚠️ Gagal menghubungi server Node.js (${err.message}). Pastikan server aktif.`);
    }
  }

  function handleSend() {
    const text = chatbotInput?.value.trim();
    if (!text) return;
    appendMessage('user', text);
    if (chatbotInput) chatbotInput.value = '';
    fetchBotResponse(text);
  }

  chatbotSendBtn?.addEventListener('click', handleSend);
  chatbotInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend();
  });

  // Attach click listener to initial chips
  document.querySelectorAll('.chatbot-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const q = chip.getAttribute('data-query') || chip.textContent.trim();
      appendMessage('user', q);
      fetchBotResponse(q);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && chatbotPanel?.classList.contains('active')) {
      chatbotPanel.classList.remove('active');
    }
  });
});
