// download-tiles.js — Mengunduh tile peta (basemap CARTO Positron, dengan
// label nama jalan/tempat di sekitar kampus) untuk area kampus UNDIP (sekali
// jalan, butuh internet) supaya game bisa dimainkan TANPA internet sesudahnya.
// Tile disimpan di tiles/{z}/{x}/{y}.png.
// Jalankan: node download-tiles.js
//
// Batas area & zoom HARUS sama dengan AREA_BOUNDS/minZoom/maxZoom di index.html.
const fs = require('fs');
const path = require('path');

const AREA_BOUNDS = [[-7.0602, 110.4285], [-7.0431, 110.4509]];
const MIN_ZOOM = 14;
const MAX_ZOOM = 18;
const OUT_DIR = path.join(__dirname, 'tiles');
const TILE_SUBDOMAINS = ['a', 'b', 'c', 'd'];
const USER_AGENT = 'TebakTitikUndip/1.0 (+https://github.com/JhuanCarlos116/Ayo-Tebak-UNDIP; kebutuhan game edukasi kampus, unduhan sekali jalan)';
const DELAY_MS = 150; // sopan ke server tile

function lon2x(lon, z) { return Math.floor((lon + 180) / 360 * Math.pow(2, z)); }
function lat2y(lat, z) {
  const r = lat * Math.PI / 180;
  return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * Math.pow(2, z));
}
function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

async function fetchTile(z, x, y, attempt = 1) {
  const s = TILE_SUBDOMAINS[(x + y) % TILE_SUBDOMAINS.length];
  const url = `https://${s}.basemaps.cartocdn.com/light_all/${z}/${x}/${y}.png`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (res.status === 429 || res.status >= 500) {
    if (attempt > 4) throw new Error(`gagal (${res.status}) setelah ${attempt} percobaan`);
    await sleep(1000 * attempt);
    return fetchTile(z, x, y, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const [[latMin, lonMin], [latMax, lonMax]] = AREA_BOUNDS;
  let planned = [];
  for (let z = MIN_ZOOM; z <= MAX_ZOOM; z++) {
    const x1 = lon2x(lonMin, z), x2 = lon2x(lonMax, z);
    const y1 = lat2y(latMax, z), y2 = lat2y(latMin, z);
    for (let x = x1; x <= x2; x++) for (let y = y1; y <= y2; y++) planned.push({ z, x, y });
  }
  console.log(`Total tile yang perlu diunduh: ${planned.length} (zoom ${MIN_ZOOM}-${MAX_ZOOM})`);

  let done = 0, skipped = 0, failed = [];
  for (const { z, x, y } of planned) {
    const dest = path.join(OUT_DIR, String(z), String(x), `${y}.png`);
    if (fs.existsSync(dest)) { skipped++; done++; continue; }
    try {
      const buf = await fetchTile(z, x, y);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, buf);
      done++;
      await sleep(DELAY_MS);
    } catch (e) {
      failed.push({ z, x, y, err: e.message });
      done++;
    }
    if (done % 50 === 0 || done === planned.length) {
      process.stdout.write(`\r  ${done}/${planned.length} (lewati cache: ${skipped}, gagal: ${failed.length})   `);
    }
  }
  console.log('\n✓ Selesai mengunduh tile ke folder tiles/');
  if (failed.length) {
    console.log(`⚠ ${failed.length} tile gagal diunduh — jalankan ulang skrip ini untuk mencoba lagi (yang sudah ada dilewati):`);
    failed.slice(0, 10).forEach(f => console.log(`   z${f.z}/${f.x}/${f.y}: ${f.err}`));
  }
}
main().catch(e => { console.error(e); process.exit(1); });
