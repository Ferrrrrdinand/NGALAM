const http = require('http');

function postJSON(urlPath, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: urlPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch (_) {
          resolve({ status: res.statusCode, headers: res.headers, text: body });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function getRequest(urlPath, token) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: urlPath,
      method: 'GET',
      headers
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          status: res.statusCode,
          headers: res.headers,
          buffer,
          text: buffer.toString('utf8')
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 MULAI PENGUJIAN FITUR EXPORT TRANSAKSI EXCEL NGALAM FIX PRO\n');

  // 1. Login Admin
  const adminLogin = await postJSON('/api/auth/login', { username: 'admin', password: 'password123' });
  const adminToken = adminLogin.data?.user?.token;
  console.log(`1. Login Admin: ${adminLogin.status === 200 ? '✅ Sukses' : '❌ Gagal'} (Token: ${adminToken ? 'OK' : 'NULL'})`);

  // 2. Login Kasir
  const kasirLogin = await postJSON('/api/auth/login', { username: 'kasir', password: 'password123' });
  const kasirToken = kasirLogin.data?.user?.token;
  console.log(`2. Login Kasir: ${kasirLogin.status === 200 ? '✅ Sukses' : '❌ Gagal'} (Token: ${kasirToken ? 'OK' : 'NULL'})`);

  // 3. Test Preview Tanpa Auth -> Harusnya 401
  const noAuthPreview = await getRequest('/api/export/transactions/preview?startDate=2026-08-01&endDate=2026-10-29');
  console.log(`3. Preview Tanpa Auth: Status ${noAuthPreview.status} (Harus 401) -> ${noAuthPreview.status === 401 ? '✅ BENAR' : '❌ SALAH'}`);

  // 4. Test Preview dengan Role Kasir -> Harusnya 403 Forbidden
  const kasirPreview = await getRequest(`/api/export/transactions/preview?startDate=2026-08-01&endDate=2026-10-29`, kasirToken);
  console.log(`4. Preview Role Kasir: Status ${kasirPreview.status} (Harus 403 Ditolak) -> ${kasirPreview.status === 403 ? '✅ BENAR' : '❌ SALAH'}`);

  // 5. Test Preview dengan Role Admin (3 Bulan: 2026-08-01 s/d 2026-10-29)
  const adminPreview = await getRequest(`/api/export/transactions/preview?startDate=2026-08-01&endDate=2026-10-29`, adminToken);
  let previewData = {};
  try { previewData = JSON.parse(adminPreview.text); } catch (_) {}
  console.log(`5. Preview Role Admin (3 Bulan): Status ${adminPreview.status} -> ${adminPreview.status === 200 ? '✅ OK' : '❌ GAGAL'}`);
  console.log(`   - Jumlah Transaksi: ${previewData.count} faktur`);
  console.log(`   - Total Omset: ${previewData.totalOmsetFormatted}`);
  console.log(`   - Total Diskon: ${previewData.totalDiscountFormatted}`);

  // 6. Test Download Excel dengan Kasir -> Harusnya 403 Forbidden
  const kasirExcel = await getRequest(`/api/export/transactions/excel?startDate=2026-08-01&endDate=2026-10-29`, kasirToken);
  console.log(`6. Unduh Excel Role Kasir: Status ${kasirExcel.status} (Harus 403 Ditolak) -> ${kasirExcel.status === 403 ? '✅ BENAR' : '❌ SALAH'}`);

  // 7. Test Download Excel dengan Admin -> Harusnya 200 OK & binary .xlsx
  const adminExcel = await getRequest(`/api/export/transactions/excel?startDate=2026-08-01&endDate=2026-10-29`, adminToken);
  const contentType = adminExcel.headers['content-type'];
  const disposition = adminExcel.headers['content-disposition'];
  const isExcelHeader = adminExcel.buffer[0] === 0x50 && adminExcel.buffer[1] === 0x4b; // 'PK' zip format of .xlsx
  console.log(`7. Unduh Excel Role Admin: Status ${adminExcel.status} -> ${adminExcel.status === 200 ? '✅ OK' : '❌ GAGAL'}`);
  console.log(`   - Content-Type: ${contentType}`);
  console.log(`   - Content-Disposition: ${disposition}`);
  console.log(`   - Header Signature 'PK': ${isExcelHeader ? '✅ Valid Excel (.xlsx)' : '❌ Bukan .xlsx'}`);
  console.log(`   - Ukuran Buffer: ${adminExcel.buffer.length} bytes`);

  // 8. Test 1 Bulan Terakhir (2026-10-01 s/d 2026-10-29)
  const oneMonthPreview = await getRequest(`/api/export/transactions/preview?startDate=2026-10-01&endDate=2026-10-29`, adminToken);
  let oneMonthData = {};
  try { oneMonthData = JSON.parse(oneMonthPreview.text); } catch (_) {}
  console.log(`8. Filter 1 Bulan Terakhir: ${oneMonthData.count} transaksi ditemukan (${oneMonthData.totalOmsetFormatted})`);

  console.log('\n🎉 SEMUA PENGUJIAN SELESAI!');
}

runTests().catch(console.error);
