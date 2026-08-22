# Tebak Titik — Tembalang / UNDIP

GeoGuessr sederhana: pemain melihat cuplikan foto di sekitar Tembalang & UNDIP,
lalu menebak titiknya di peta. Skor bergantung seberapa dekat tebakan ke titik asli.
Ada tingkat Mudah, Menengah, dan Sulit, plus tombol petunjuk (memakainya memotong poin 50%).

## Menjalankan
Buka `index.html` di browser (klik dua kali). Sudah ada data contoh, jadi langsung bisa dimainkan.
Agar foto & peta muncul lancar, sebaiknya lewat server lokal:

    npm run serve      # lalu buka http://localhost:3000

## Memakai foto sendiri (otomatis dari geotag)
Alurnya: taruh foto → satu perintah → data + koordinat terisi sendiri.

1. Pastikan foto punya **geotag GPS** (aktifkan lokasi di kamera HP saat memotret).
2. Taruh foto di folder `photos/` dengan pola nama:

       tingkat_Nama Lokasi.jpg

   Contoh: `mudah_Masjid Kampus.jpg`, `menengah_Fakultas Teknik.jpg`, `sulit_Gang Banjarsari.jpg`
   Tingkat yang dikenali: `mudah` | `menengah` | `sulit` (tanpa awalan → `menengah`).
3. Sekali saja di awal, pasang dependensi:

       npm install

4. Bangun ulang data:

       npm run build

   Skrip membaca geotag tiap foto, lalu menulis ulang `data.js`. Refresh browser — selesai.

## Berkas penting
- `index.html` — game-nya.
- `data.js` — **dihasilkan otomatis** oleh build; jangan diedit tangan.
- `build.js` — pembaca geotag + penyusun data.
- `photos/` — tempat menaruh foto (input).
- `hints.json` — petunjuk per lokasi: `{ "Nama Lokasi": "teks petunjuk" }` (nama harus sama persis).
- `overrides.json` — koreksi manual untuk foto **tanpa** geotag atau bila ingin memaksa nilai:
  `{ "namafile.jpg": { "lat": .., "lng": .., "name": "..", "difficulty": "mudah", "hint": ".." } }`

## Menerbitkan (opsional)
Folder ini statis, jadi bisa langsung di-hosting:
- **GitHub Pages**: push ke repo, Settings → Pages → deploy dari branch.
- **Netlify**: seret folder ke app.netlify.com/drop.

## Catatan
- Foto yang tak punya geotag akan dilewati; build menampilkan daftarnya agar bisa diisi via `overrides.json`.
- `data.js` bawaan berisi data contoh (foto dari Google Maps) dan akan tertimpa saat pertama kali `npm run build`.
