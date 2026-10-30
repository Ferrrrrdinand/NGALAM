/**
 * Test Suite: Auth Feedback UI Modals Verification
 * Validates that all login portals in Ngalam Fix Pro are equipped with:
 * 1. auth-feedback.css link
 * 2. auth-feedback.js script
 * 3. novalidate on all forms to suppress default Chrome bubble tooltips
 * 4. showAuthSuccessModal & showAuthErrorModal integration in corresponding JS controllers
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Starting Auth Feedback UI Verification...\n');

const ROOT = path.join(__dirname, '..');

// 1. Verify CSS File
const cssPath = path.join(ROOT, 'public', 'css', 'auth-feedback.css');
assert(fs.existsSync(cssPath), 'auth-feedback.css must exist');
const cssContent = fs.readFileSync(cssPath, 'utf8');
assert(cssContent.includes('.ngalam-auth-overlay'), 'CSS must define .ngalam-auth-overlay');
assert(cssContent.includes('.ngalam-auth-modal'), 'CSS must define .ngalam-auth-modal');
assert(cssContent.includes('.modal-success'), 'CSS must define .modal-success');
assert(cssContent.includes('.modal-error'), 'CSS must define .modal-error');
assert(cssContent.includes('authModalShake'), 'CSS must define error shake keyframes');
assert(cssContent.includes('authDrawCheck'), 'CSS must define checkmark draw keyframes');
assert(cssContent.includes('auth-progress-fill'), 'CSS must define animated progress fill');
console.log('✅ auth-feedback.css verified: complete design tokens, keyframes, and glassmorphism styling present.');

// 2. Verify JS File
const jsPath = path.join(ROOT, 'public', 'js', 'auth-feedback.js');
assert(fs.existsSync(jsPath), 'auth-feedback.js must exist');
const jsContent = fs.readFileSync(jsPath, 'utf8');
assert(jsContent.includes('showAuthSuccessModal'), 'JS must define showAuthSuccessModal');
assert(jsContent.includes('showAuthErrorModal'), 'JS must define showAuthErrorModal');
assert(jsContent.includes('closeAuthModal'), 'JS must define closeAuthModal');
assert(jsContent.includes('authSuccessProgressFill'), 'JS must manage animated progress bar');
assert(jsContent.includes('authErrorRetryBtn'), 'JS must have Coba Masuk Lagi retry button');
console.log('✅ auth-feedback.js verified: exports showAuthSuccessModal, showAuthErrorModal, and closeAuthModal.');

// 3. Verify Login Portals
const portals = [
  {
    name: 'Admin & Kasir Portal',
    html: 'public/admin/login.html',
    js: 'public/admin/admin_login.js',
    forms: ['adminLoginForm', 'adminRegisterForm']
  },
  {
    name: 'Teknisi Lab Portal',
    html: 'public/teknisi/login.html',
    js: 'public/teknisi/teknisi_login.js',
    forms: ['techLoginForm', 'techRegisterForm']
  },
  {
    name: 'Customer / Pelanggan Member Portal',
    html: 'public/login/index.html',
    js: 'public/login/login.js',
    forms: ['customerLoginForm', 'customerRegisterForm']
  },
  {
    name: 'Mitra Workshop Portal',
    html: 'public/mitra/index.html',
    js: 'public/mitra/mitra.js',
    forms: ['formMitraLogin', 'formMitraRegister']
  }
];

portals.forEach(p => {
  const htmlFile = path.join(ROOT, p.html);
  const jsFile = path.join(ROOT, p.js);

  assert(fs.existsSync(htmlFile), `${p.html} must exist`);
  assert(fs.existsSync(jsFile), `${p.js} must exist`);

  const html = fs.readFileSync(htmlFile, 'utf8');
  const js = fs.readFileSync(jsFile, 'utf8');

  // Verify CSS inclusion
  assert(html.includes('auth-feedback.css'), `${p.name} HTML must include auth-feedback.css`);

  // Verify JS inclusion
  assert(html.includes('auth-feedback.js'), `${p.name} HTML must include auth-feedback.js`);

  // Verify novalidate on all forms
  p.forms.forEach(f => {
    const formRegex = new RegExp(`<form[^>]*id=["']${f}["'][^>]*novalidate`, 'i');
    assert(formRegex.test(html), `${p.name} form "${f}" must have novalidate attribute to suppress default browser tooltips`);
  });

  // Verify showAuthSuccessModal & showAuthErrorModal in JS controller
  assert(js.includes('showAuthSuccessModal'), `${p.name} JS must call showAuthSuccessModal`);
  assert(js.includes('showAuthErrorModal'), `${p.name} JS must call showAuthErrorModal`);

  console.log(`✅ ${p.name} fully verified: HTML, CSS, novalidate forms, and controller modals integrated.`);
});

console.log('\n🎉 ALL 4 LOGIN PORTALS VERIFIED 100% SUCCESFULLY!');
