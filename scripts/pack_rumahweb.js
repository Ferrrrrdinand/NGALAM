const fs = require('fs');
const path = require('path');
const archiverModule = require('archiver');
const ZipArchive = archiverModule.ZipArchive || (typeof archiverModule === 'function' ? archiverModule : null);

const rootDir = path.resolve(__dirname, '..');
const outputZipPath = path.join(rootDir, 'NGALAM_FIX_PRO_RUMAHWEB.zip');

if (fs.existsSync(outputZipPath)) {
  fs.unlinkSync(outputZipPath);
}

const output = fs.createWriteStream(outputZipPath);
const archive = typeof archiverModule === 'function' 
  ? archiverModule('zip', { zlib: { level: 9 } }) 
  : new archiverModule.ZipArchive({ zlib: { level: 9 } });

output.on('close', function () {
  const sizeMB = (archive.pointer() / (1024 * 1024)).toFixed(2);
  console.log(`=======================================================`);
  console.log(`✅ Paket Deploy Rumahweb Selesai Dibuat!`);
  console.log(`📦 Lokasi File : ${outputZipPath}`);
  console.log(`📊 Ukuran File : ${sizeMB} MB`);
  console.log(`=======================================================`);
});

archive.on('warning', function (err) {
  if (err.code === 'ENOENT') {
    console.warn(err);
  } else {
    throw err;
  }
});

archive.on('error', function (err) {
  throw err;
});

archive.pipe(output);

// Individual root files
const rootFiles = [
  'server.js',
  'package.json',
  'package-lock.json',
  '.env.example',
  'PANDUAN_RUMAHWEB.txt'
];

for (const file of rootFiles) {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    archive.file(filePath, { name: file });
  }
}

// Folders
const folders = [
  { src: 'src', dest: 'src' },
  { src: 'data', dest: 'data' },
  { src: 'public', dest: 'public' },
  { src: 'scripts', dest: 'scripts' },
  { src: 'client/dist', dest: 'client/dist' }
];

for (const folder of folders) {
  const folderPath = path.join(rootDir, folder.src);
  if (fs.existsSync(folderPath)) {
    archive.directory(folderPath, folder.dest);
  }
}

archive.finalize();
