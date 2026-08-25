// vendor-assets.js — Mengunduh Leaflet (CSS/JS/gambar) & font Google Fonts
// sekali jalan, disimpan lokal di vendor/, supaya game bisa dimainkan tanpa
// internet sama sekali. Jalankan: node vendor-assets.js
const fs = require('fs');
const path = require('path');

const LEAFLET_VER = '1.9.4';
const LEAFLET_BASE = `https://cdnjs.cloudflare.com/ajax/libs/leaflet/${LEAFLET_VER}`;
const LEAFLET_DIR = path.join(__dirname, 'vendor', 'leaflet');
const FONTS_DIR = path.join(__dirname, 'vendor', 'fonts');
const EXIFR_DIR = path.join(__dirname, 'vendor', 'exifr');
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

async function download(url, dest, headers) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Gagal unduh ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  return buf;
}

async function vendorLeaflet() {
  console.log('→ Mengunduh Leaflet ' + LEAFLET_VER + '...');
  await download(`${LEAFLET_BASE}/leaflet.css`, path.join(LEAFLET_DIR, 'leaflet.css'));
  await download(`${LEAFLET_BASE}/leaflet.js`, path.join(LEAFLET_DIR, 'leaflet.js'));
  const images = ['images/layers.png', 'images/layers-2x.png', 'images/marker-icon.png', 'images/marker-icon-2x.png', 'images/marker-shadow.png'];
  for (const img of images) {
    try {
      await download(`${LEAFLET_BASE}/${img}`, path.join(LEAFLET_DIR, img));
      console.log('  ✓ ' + img);
    } catch (e) { console.warn('  ! lewati ' + img + ' (' + e.message + ')'); }
  }
  console.log('✓ Leaflet ter-vendor di vendor/leaflet/\n');
}

async function vendorFonts() {
  console.log('→ Mengambil daftar font (Space Grotesk, Space Mono)...');
  const cssUrl = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap';
  const css = await fetch(cssUrl, { headers: { 'User-Agent': BROWSER_UA } }).then(r => r.text());

  // Ambil hanya blok "latin" dasar (unicode-range diawali U+0000-00FF) — cukup untuk teks Indonesia.
  const blocks = css.split('@font-face').slice(1).map(b => '@font-face' + b);
  const wanted = blocks.filter(b => /unicode-range:\s*U\+0000-00FF/.test(b));

  let out = '/* Font lokal (Space Grotesk & Space Mono) — di-vendor dari Google Fonts, subset latin. */\n';
  for (const block of wanted) {
    const family = block.match(/font-family:\s*'([^']+)'/)[1];
    const weight = block.match(/font-weight:\s*(\d+)/)[1];
    const url = block.match(/url\(([^)]+)\)/)[1];
    const fname = `${family.replace(/\s+/g, '-').toLowerCase()}-${weight}.woff2`;
    await download(url, path.join(FONTS_DIR, fname));
    console.log(`  ✓ ${family} ${weight}`);
    out += `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:swap;src:url('${fname}') format('woff2');}\n`;
  }
  fs.writeFileSync(path.join(FONTS_DIR, 'fonts.css'), out);
  console.log('✓ Font ter-vendor di vendor/fonts/\n');
}

function vendorExifr() {
  console.log('→ Menyalin exifr (pembaca EXIF di browser, untuk deteksi geotag saat "+ Tambah foto")...');
  const src = path.join(__dirname, 'node_modules', 'exifr', 'dist', 'lite.umd.js');
  if (!fs.existsSync(src)) { console.warn('  ! node_modules/exifr tak ditemukan — jalankan `npm install` dulu.'); return; }
  fs.mkdirSync(EXIFR_DIR, { recursive: true });
  fs.copyFileSync(src, path.join(EXIFR_DIR, 'exifr.js'));
  console.log('✓ exifr ter-vendor di vendor/exifr/\n');
}

(async () => {
  await vendorLeaflet();
  await vendorFonts();
  vendorExifr();
  console.log('Selesai. index.html sudah memakai vendor/leaflet, vendor/fonts, & vendor/exifr (lokal).');
})().catch(e => { console.error(e); process.exit(1); });
