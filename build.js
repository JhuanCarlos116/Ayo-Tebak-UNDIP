// build.js — Membaca foto ber-geotag (GPS EXIF) di folder photos/,
// membuat versi terkompresi untuk web di photos-web/, lalu menghasilkan
// data.js untuk game. Jalankan: npm run build
const fs = require('fs');
const path = require('path');
const exifr = require('exifr');
const sharp = require('sharp');

const DIR = path.join(__dirname, 'photos');
const WEB_DIR = path.join(__dirname, 'photos-web');
const OUT = path.join(__dirname, 'data.js');
const EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];
const WEB_MAX = 1600;   // sisi terpanjang, piksel
const WEB_QUALITY = 78; // kualitas JPEG (mozjpeg)

function nameFromFile(file) {
  const base = file.replace(/\.[^.]+$/, '');
  return base.replace(/[_-]+/g, ' ').trim();
}

function loadJSON(file) {
  const p = path.join(__dirname, file);
  if (!fs.existsSync(p)) return {};
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { console.warn('! ' + file + ' tidak valid, dilewati.'); return {}; }
}

// Buat/perbarui versi terkompresi untuk web (dipakai sebagai `img` di data.js).
// Foto asli di photos/ tetap utuh — sumber kebenaran geotag & arsip.
async function buildWebPhoto(srcPath, destPath) {
  const srcStat = fs.statSync(srcPath);
  if (fs.existsSync(destPath) && fs.statSync(destPath).mtimeMs >= srcStat.mtimeMs) return false; // sudah up to date
  await sharp(srcPath)
    .rotate() // fisik-rotasi sesuai EXIF orientation dulu, sebelum metadata dibuang
    .resize({ width: WEB_MAX, height: WEB_MAX, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: WEB_QUALITY, mozjpeg: true })
    .toFile(destPath);
  return true;
}

async function main() {
  if (!fs.existsSync(DIR)) { console.error('Folder photos/ tidak ada.'); process.exit(1); }
  fs.mkdirSync(WEB_DIR, { recursive: true });
  const overrides = loadJSON('overrides.json'); // koreksi manual / foto tanpa geotag
  const hints = loadJSON('hints.json');         // { "Nama Lokasi": "petunjuk" }

  const files = fs.readdirSync(DIR).filter(f => EXTS.includes(path.extname(f).toLowerCase()));
  const data = [];
  const skipped = [];
  let compressed = 0, savedBytes = 0;

  for (const file of files) {
    const ov = overrides[file] || {};
    let lat = ov.lat, lng = ov.lng;
    if (lat == null || lng == null) {
      try {
        const g = await exifr.gps(path.join(DIR, file));
        if (g && isFinite(g.latitude) && isFinite(g.longitude)) { lat = g.latitude; lng = g.longitude; }
      } catch (e) { /* abaikan */ }
    }
    if (lat == null || lng == null) { skipped.push(file); continue; }

    const webName = file.replace(/\.[^.]+$/, '') + '.jpg';
    const srcPath = path.join(DIR, file);
    const destPath = path.join(WEB_DIR, webName);
    const before = fs.statSync(srcPath).size;
    const didWork = await buildWebPhoto(srcPath, destPath);
    if (didWork) { compressed++; savedBytes += before - fs.statSync(destPath).size; }

    const finalName = ov.name || nameFromFile(file);
    data.push({
      name: finalName,
      lat: +(+lat).toFixed(6),
      lng: +(+lng).toFixed(6),
      img: 'photos-web/' + encodeURIComponent(webName),
      hint: ov.hint || hints[finalName] || ''
    });
  }

  if (data.length === 0) {
    console.warn('\nTidak ada foto ber-geotag yang terbaca — data.js TIDAK diubah.');
    if (skipped.length) console.warn('Tanpa geotag: ' + skipped.join(', '));
    console.warn('Tip: pastikan lokasi/GPS aktif saat memotret, atau isi overrides.json.');
    return;
  }

  const banner = '// File ini DIHASILKAN otomatis oleh build.js — jangan diedit manual.\n';
  fs.writeFileSync(OUT, banner + 'window.LOCATIONS = ' + JSON.stringify(data, null, 2) + ';\n');
  console.log('\n✓ data.js diperbarui (' + data.length + ' lokasi)');
  if (compressed) console.log(`✓ ${compressed} foto dikompres ke photos-web/ (hemat ~${(savedBytes / 1024 / 1024).toFixed(1)} MB)`);
  if (skipped.length) {
    console.log('\n⚠ Dilewati (tanpa geotag). Tambahkan koordinat manual di overrides.json:');
    skipped.forEach(s => console.log('   - ' + s));
  }
}
main();
