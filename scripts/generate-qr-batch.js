const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const archiver = require('archiver');

const BASE_URL = process.env.APP_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'qr-codes');
const MITRA_COUNT = 100;

async function generateQRBatch() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('🎨 Generating 100 QR Code PNGs...');
  
  const qrFiles = [];
  
  for (let i = 1; i <= MITRA_COUNT; i++) {
    const num = String(i).padStart(3, '0');
    const refCode = `MITRA-${num}`;
    const url = `${BASE_URL}/?ref=${refCode}`;
    const filename = `${refCode}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);
    
    await QRCode.toFile(filepath, url, {
      width: 400,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff'
      }
    });
    
    qrFiles.push({ refCode, filename, filepath });
    if (i % 10 === 0) console.log(`  ✓ Generated ${i}/${MITRA_COUNT}`);
  }
  
  console.log('✅ All PNG files generated\n');
  
  // Generate PDF Sheet (10x10 grid)
  console.log('📄 Generating PDF print sheet...');
  await generatePDFSheet(qrFiles);
  
  // Generate ZIP archive
  console.log('📦 Creating ZIP archive...');
  await generateZIP(qrFiles);
  
  console.log('\n🎉 Done! Files saved to:', OUTPUT_DIR);
  console.log('  - Individual PNGs: MITRA-001.png to MITRA-100.png');
  console.log('  - PDF Sheet: qr-codes-print-sheet.pdf');
  console.log('  - ZIP Archive: qr-codes-batch.zip');
}

async function generatePDFSheet(qrFiles) {
  const pdfPath = path.join(OUTPUT_DIR, 'qr-codes-print-sheet.pdf');
  const doc = new PDFDocument({ 
    size: 'A4', 
    margin: 20,
    layout: 'portrait'
  });
  
  doc.pipe(fs.createWriteStream(pdfPath));
  
  const qrSize = 100;
  const cols = 5;
  const rows = 4;
  const perPage = cols * rows;
  const marginX = 30;
  const marginY = 40;
  const spacingX = 110;
  const spacingY = 135;
  
  qrFiles.forEach((qr, index) => {
    if (index > 0 && index % perPage === 0) {
      doc.addPage();
    }
    
    const posInPage = index % perPage;
    const col = posInPage % cols;
    const row = Math.floor(posInPage / cols);
    
    const x = marginX + (col * spacingX);
    const y = marginY + (row * spacingY);
    
    doc.image(qr.filepath, x, y, { width: qrSize, height: qrSize });
    doc.fontSize(9).text(qr.refCode, x, y + qrSize + 5, { 
      width: qrSize, 
      align: 'center' 
    });
  });
  
  doc.end();
  console.log('  ✓ PDF sheet created');
}

async function generateZIP(qrFiles) {
  const zipPath = path.join(OUTPUT_DIR, 'qr-codes-batch.zip');
  const output = fs.createWriteStream(zipPath);
  const { ZipArchive } = require('archiver');
  const archive = new ZipArchive({ zlib: { level: 9 } });
  
  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log(`  ✓ ZIP created (${output.bytesWritten} bytes)`);
      resolve();
    });
    
    archive.on('error', reject);
    archive.pipe(output);
    
    qrFiles.forEach(qr => {
      archive.file(qr.filepath, { name: qr.filename });
    });
    
    archive.finalize();
  });
}

generateQRBatch().catch(console.error);
