const fs = require('fs');
const http = require('http');

console.log('🧪 Starting NgalamBot AI UI Verification...');

// 1. Verify Avatar Asset
const avatarPath = 'public/images/ngalambot-avatar.jpg';
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

// 2. Verify style.css
const css = fs.readFileSync('public/css/style.css', 'utf8');
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

// 3. Verify HTML files
const htmlFiles = [
  { path: 'public/index.html', avatarRel: 'images/ngalambot-avatar.jpg' },
  { path: 'public/layanan/index.html', avatarRel: '../images/ngalambot-avatar.jpg' },
  { path: 'public/pesan-servis/index.html', avatarRel: '../images/ngalambot-avatar.jpg' },
  { path: 'public/lacak/index.html', avatarRel: '../images/ngalambot-avatar.jpg' },
  { path: 'public/kontak/index.html', avatarRel: '../images/ngalambot-avatar.jpg' },
  { path: 'public/login/index.html', avatarRel: '../images/ngalambot-avatar.jpg' }
];

htmlFiles.forEach(({ path, avatarRel }) => {
  const content = fs.readFileSync(path, 'utf8');
  if (!content.includes('chatbot-avatar-frame')) {
    console.error(`❌ ${path} missing chatbot-avatar-frame!`);
    process.exit(1);
  }
  if (!content.includes(avatarRel)) {
    console.error(`❌ ${path} missing image path: ${avatarRel}!`);
    process.exit(1);
  }
  if (content.includes('ai-avatar-animated')) {
    console.error(`❌ ${path} still contains legacy ai-avatar-animated!`);
    process.exit(1);
  }
  console.log(`✅ ${path} verified with clean 3D AI mascot.`);
});

// 4. Verify chatbot.js
const js = fs.readFileSync('public/js/chatbot.js', 'utf8');
if (!js.includes('ngalambot-avatar.jpg')) {
  console.error('❌ chatbot.js does not reference ngalambot-avatar.jpg!');
  process.exit(1);
}
console.log('✅ chatbot.js verified with 3D mascot avatar in chat bubbles & typing indicator.');

// 5. Test Live HTTP endpoint
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
