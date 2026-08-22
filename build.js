// build.js — Membaca foto ber-geotag (GPS EXIF) di folder photos/,
// lalu menghasilkan data.js untuk game. Jalankan: npm run build
const fs = require('fs');
const path = require('path');
const exifr = require('exifr');

const DIR = path.join(__dirname, 'photos');
const OUT = path.join(__dirname, 'data.js');
const DIFFS = ['mudah', 'menengah', 'sulit'];
const EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];

// Nama file: "tingkat_Nama Lokasi.jpg"  (mis. "mudah_Masjid Kampus.jpg")
function parseName(file) {
  const base = file.replace(/\.[^.]+$/, '');
  const i = base.indexOf('_');
  let diff = 'menengah', name = base;
  if (i > 0) {
    const p = base.slice(0, i).toLowerCase();
    if (DIFFS.includes(p)) { diff = p; name = base.slice(i + 1); }
  }
  return { diff, name: name.replace(/[_]+/g, ' ').trim() };
}

function loadJSON(file) {
  const p = path.join(__dirname, file);
  if (!fs.existsSync(p)) return {};
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { console.warn('! ' + file + ' tidak valid, dilewati.'); return {}; }
}

async function main() {
  if (!fs.existsSync(DIR)) { console.error('Folder photos/ tidak ada.'); process.exit(1); }
  const overrides = loadJSON('overrides.json'); // koreksi manual / foto tanpa geotag
  const hints = loadJSON('hints.json');         // { "Nama Lokasi": "petunjuk" }

  const files = fs.readdirSync(DIR).filter(f => EXTS.includes(path.extname(f).toLowerCase()));
  const data = { mudah: [], menengah: [], sulit: [] };
  const skipped = [];

  for (const file of files) {
    const { diff, name } = parseName(file);
    const ov = overrides[file] || {};
    let lat = ov.lat, lng = ov.lng;
    if (lat == null || lng == null) {
      try {
        const g = await exifr.gps(path.join(DIR, file));
        if (g && isFinite(g.latitude) && isFinite(g.longitude)) { lat = g.latitude; lng = g.longitude; }
      } catch (e) { /* abaikan */ }
    }
    if (lat == null || lng == null) { skipped.push(file); continue; }

    const finalName = ov.name || name;
    const d = DIFFS.includes(ov.difficulty) ? ov.difficulty : diff;
    data[d].push({
      name: finalName,
      lat: +(+lat).toFixed(6),
      lng: +(+lng).toFixed(6),
      img: 'photos/' + encodeURIComponent(file),
      hint: ov.hint || hints[finalName] || ''
    });
  }

  const total = data.mudah.length + data.menengah.length + data.sulit.length;
  if (total === 0) {
    console.warn('\nTidak ada foto ber-geotag yang terbaca — data.js TIDAK diubah.');
    if (skipped.length) console.warn('Tanpa geotag: ' + skipped.join(', '));
    console.warn('Tip: pastikan lokasi/GPS aktif saat memotret, atau isi overrides.json.');
    return;
  }

  const banner = '// File ini DIHASILKAN otomatis oleh build.js — jangan diedit manual.\n';
  fs.writeFileSync(OUT, banner + 'window.LOCATIONS = ' + JSON.stringify(data, null, 2) + ';\n');
  console.log('\n✓ data.js diperbarui (' + total + ' lokasi):');
  for (const d of DIFFS) console.log('   ' + d.padEnd(9) + data[d].length);
  if (skipped.length) {
    console.log('\n⚠ Dilewati (tanpa geotag). Tambahkan koordinat manual di overrides.json:');
    skipped.forEach(s => console.log('   - ' + s));
  }
}
main();
