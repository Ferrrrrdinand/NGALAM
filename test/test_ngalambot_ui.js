const fs = require('fs');
const http = require('http');

console.log('🧪 Starting NgalamBot AI UI Verification...');

const avatarPath = 'client/public/images/ngalambot-avatar.jpg';
if (!fs.existsSync(avatarPath)) {
  console.error('❌ ngalambot-avatar.jpg not found!');
  process.exit(1);
}
const stat = fs.statSync(avatarPath);
if (stat.size < 10000) {
  console.error('❌ ngalambot-avatar.jpg is too small or invalid!');
  process.exit(1);
}
console.log(`✅ ngalambot-avatar.jpg verified: ${stat.size} bytes.`);

const css = fs.readFileSync('client/public/css/style.css', 'utf8');
const expectedCssRules = [
  '.chatbot-trigger {',
  '.chatbot-avatar-frame {',
  '.chatbot-avatar-img {',
  '.chatbot-online-dot {',
  '.chatbot-trigger-title {',
  '.chatbot-trigger-sub {',
  '.chatbot-trigger-badge {',
  '.chatbot-header-avatar {'
];
expectedCssRules.forEach(rule => {
  if (!css.includes(rule)) {
    console.error(`❌ style.css missing rule: ${rule}`);
    process.exit(1);
  }
});
console.log('✅ style.css verified with modern 3D AI mascot styling.');

const chatbot = fs.readFileSync('client/src/components/Chatbot.jsx', 'utf8');
if (!chatbot.includes('/images/ngalambot-avatar.jpg')) {
  console.error('❌ Chatbot.jsx does not reference ngalambot-avatar.jpg!');
  process.exit(1);
}
if (!chatbot.includes('chatbot-avatar-frame')) {
  console.error('❌ Chatbot.jsx missing chatbot-avatar-frame!');
  process.exit(1);
}
console.log('✅ Chatbot.jsx verified with 3D mascot avatar in trigger and chat bubbles.');

http.get('http://localhost:3000/images/ngalambot-avatar.jpg', (res) => {
  if (res.statusCode === 200) {
    console.log(`✅ Server HTTP 200 OK: /images/ngalambot-avatar.jpg (${res.headers['content-type']})`);
    console.log('\n🎉 ALL NGALAMBOT AI UI ENHANCEMENTS VERIFIED 100% SUCCESFULLY!\n');
    process.exit(0);
  } else {
    console.error(`❌ Server returned ${res.statusCode} for /images/ngalambot-avatar.jpg`);
    process.exit(1);
  }
}).on('error', (err) => {
  console.error('❌ HTTP request failed:', err.message);
  process.exit(1);
});
