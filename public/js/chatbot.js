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
  const chatbotSendBtn = document.getElementById('chatbotSendBtn') || document.getElementById('chatbotSend');
  const chatbotChipsContainer = document.querySelector('.chatbot-chips');
  const chatbotContainer = document.querySelector('.chatbot-container');

  if (!chatbotTrigger || !chatbotPanel) return;

  async function getApiBase() {
    if (typeof window !== 'undefined' && window.resolveNgalamApiBase) {
      try {
        return await window.resolveNgalamApiBase();
      } catch (_) {}
    }
    return (typeof window !== 'undefined' && window.getNgalamApiBase)
      ? window.getNgalamApiBase()
      : '';
  }

  function setPanelState(open) {
    if (open) {
      chatbotPanel.classList.add('active');
      chatbotContainer?.classList.add('panel-open');
      setTimeout(() => chatbotInput?.focus(), 120);
    } else {
      chatbotPanel.classList.remove('active');
      chatbotContainer?.classList.remove('panel-open');
    }
  }

  function toggleChatbot() {
    const isNowOpen = !chatbotPanel.classList.contains('active');
    setPanelState(isNowOpen);
  }

  const isSubdir = window.location.pathname.includes('/layanan') ||
                   window.location.pathname.includes('/pesan-servis') ||
                   window.location.pathname.includes('/kontak') ||
                   window.location.pathname.includes('/lacak') ||
                   window.location.pathname.includes('/login') ||
                   window.location.pathname.includes('/mitra') ||
                   window.location.pathname.includes('/admin') ||
                   window.location.pathname.includes('/teknisi');
  const prefix = isSubdir ? '../' : '';

  function getAiBubbleAvatar(extraStyle = '') {
    return `
      <div class="ai-bubble-avatar" title="NgalamBot AI Assistant" style="${extraStyle}">
        <img src="${prefix}images/ngalambot-avatar.jpg" alt="NgalamBot" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;">
      </div>
    `;
  }

  chatbotTrigger.addEventListener('click', toggleChatbot);
  chatbotClose?.addEventListener('click', () => setPanelState(false));

  function appendMessage(sender, text) {
    if (!chatbotMessages) return;

    let processedText = text;
    if (sender === 'bot') {
      processedText = processedText.replace(/href="(login|lacak)\/index\.html/g, `href="${prefix}$1/index.html`);
    }

    const rowDiv = document.createElement('div');
    rowDiv.className = `chatbot-bubble-row ${sender}`;

    if (sender === 'bot') {
      rowDiv.innerHTML = `
        ${getAiBubbleAvatar()}
        <div class="chatbot-bubble bot">${processedText}</div>
      `;
    } else {
      rowDiv.innerHTML = `
        <div class="chatbot-bubble user">${processedText}</div>
      `;
    }

    function scrollChatToBottom(smooth = true) {
      if (!chatbotMessages) return;
      chatbotMessages.scrollTo({
        top: chatbotMessages.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }

    chatbotMessages.appendChild(rowDiv);
    scrollChatToBottom(true);
  }

  function showTyping() {
    // Activate thinking state on AI avatars
    document.querySelectorAll('.chatbot-avatar-frame, .chatbot-header-avatar, .ai-avatar-animated').forEach(el => el.classList.add('is-thinking'));

    const typingDiv = document.createElement('div');
    typingDiv.id = 'botTypingIndicator';
    typingDiv.className = 'chatbot-bubble-row bot';
    typingDiv.innerHTML = `
      ${getAiBubbleAvatar('border-color: #a855f7;')}
      <div class="chatbot-bubble bot" style="display:inline-flex;align-items:center;gap:8px;">
        <span style="font-size:0.76rem;color:#b45309;font-weight:700;">NgalamBot menganalisa</span>
        <span style="display:inline-flex;gap:4px;align-items:center;">
          <span style="width:5px;height:5px;background:#b45309;border-radius:50%;display:inline-block;animation:pulse 0.8s infinite;"></span>
          <span style="width:5px;height:5px;background:#b45309;border-radius:50%;display:inline-block;animation:pulse 0.8s infinite 0.2s;"></span>
          <span style="width:5px;height:5px;background:#b45309;border-radius:50%;display:inline-block;animation:pulse 0.8s infinite 0.4s;"></span>
        </span>
      </div>
    `;
    chatbotMessages?.appendChild(typingDiv);
    if (chatbotMessages) {
      chatbotMessages.scrollTo({
        top: chatbotMessages.scrollHeight,
        behavior: 'smooth',
      });
    }
  }

  function hideTyping() {
    document.querySelectorAll('.chatbot-avatar-frame, .chatbot-header-avatar, .ai-avatar-animated').forEach(el => el.classList.remove('is-thinking'));
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
      const apiBase = await getApiBase();
      const res = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      });
      const rawText = await res.text();
      let data = {};
      try {
        data = JSON.parse(rawText);
      } catch (_) {
        throw new Error(`Respon server tidak valid (${res.status})`);
      }
      hideTyping();
      if (data.success && data.reply) {
        appendMessage('bot', data.reply);
        if (data.chips && data.chips.length > 0) {
          updateChips(data.chips);
        }
      } else {
        appendMessage('bot', data.message || 'Maaf, terjadi kendala saat memproses jawaban dari server Node.js.');
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
