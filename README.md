# Tebak Titik — Tembalang / UNDIP

GeoGuessr sederhana: tekan Main, isi nama, lalu main 5 ronde foto acak dari katalog foto
sekitar kampus UNDIP, dan menebak titiknya di peta (area peta dikunci hanya di kampus).
Skor per ronde meluruh linear sampai 0 pada jarak 150 m dari titik asli. Peta tidak
menampilkan nama jalan/tempat (biar tidak nyontek dari teks di peta) dan lokasi jawaban
juga tidak ditampilkan namanya. Ada tombol petunjuk (lingkaran radius 200 m di sekitar
titik asli, memakainya memotong poin 50%), tombol berhenti di tengah main, dan papan skor
(leaderboard) tersimpan di browser — bisa direset kapan saja.

**100% offline saat dimainkan.** Peta (tile OpenStreetMap), library Leaflet, font, dan
foto semuanya disajikan dari file lokal — tidak ada koneksi internet yang dipanggil saat
main. Kebenaran tebakan murni ditentukan oleh geotag foto yang kamu taruh di `photos/`.

## Menjalankan
Sekali saja di awal, pasang dependensi:

    npm install

Lewat server lokal (disarankan, supaya foto & peta muncul lancar):

    npm run serve      # lalu buka http://localhost:3000

Bisa juga langsung buka `index.html` di browser (klik dua kali).

## Memakai foto sendiri (otomatis dari geotag)
Ada dua cara menambah foto ke katalog — boleh dipakai berbarengan:

### Cara 1: folder `photos/` (katalog utama, dilihat semua pemain)
1. Pastikan foto punya **geotag GPS** (aktifkan lokasi di kamera HP saat memotret).
2. Taruh foto di folder `photos/`. Nama file bebas, dipakai sebagai nama lokasi
   (garis bawah/strip otomatis jadi spasi) — mis. `Masjid_Kampus.jpg` → "Masjid Kampus".
   Kalau mau nama lain, atur lewat `overrides.json`.
3. Bangun ulang data:

       npm run build

   Skrip membaca geotag tiap foto, lalu menulis ulang `data.js`. Refresh browser — selesai.
   `data.js` bawaan kosong (belum ada lokasi) sampai kamu menjalankan ini dengan foto asli.

### Cara 2: tombol "+ Tambah foto" di halaman (tanpa perlu minta bantuan siapa pun)
Di layar awal ada tombol **+ Tambah foto** — pilih foto dari perangkatmu, geotag-nya
otomatis dideteksi di browser (dipakai `exifr`, sudah di-vendor lokal, tanpa internet).
Foto yang punya geotag akan diminta nama & petunjuk singkat, lalu tersimpan di
**IndexedDB browser ini** dan langsung ikut masuk pool ronde acak. Foto tanpa geotag
otomatis ditolak dengan pesan jelas.

⚠️ Bedanya dengan Cara 1: foto lewat tombol ini **hanya tersimpan di browser/perangkat
yang dipakai menambahkannya** — tidak ikut ter-commit ke repo dan tidak otomatis muncul
buat orang lain yang membuka situs ini di perangkat lain. Cocok untuk koleksi pribadi;
kalau mau foto itu jadi bagian katalog resmi untuk semua orang, tetap taruh juga di
`photos/` lalu `npm run build`.

## Sekali di awal: siapkan aset offline
Dua hal ini hanya perlu dijalankan sekali (butuh internet saat itu saja), hasilnya
disimpan lokal dan langsung ikut ter-commit ke repo:

    npm run vendor      # unduh Leaflet + font ke vendor/
    npm run tiles        # unduh tile peta (CARTO Voyager tanpa label) area kampus UNDIP ke tiles/

Sudah dijalankan sekali di repo ini — biasanya kamu tidak perlu mengulang, kecuali
mengubah `AREA_BOUNDS`/`minZoom`/`maxZoom` di `index.html` (lalu samakan juga di
`download-tiles.js`).

## Berkas penting
- `index.html` — game-nya.
- `data.js` — **dihasilkan otomatis** oleh build; jangan diedit tangan.
- `build.js` — pembaca geotag + penyusun data dari `photos/`.
- `photos/` — tempat menaruh foto (input, sumber kebenaran tebakan).
- `hints.json` — petunjuk per lokasi: `{ "Nama Lokasi": "teks petunjuk" }` (nama harus sama persis).
- `overrides.json` — koreksi manual untuk foto **tanpa** geotag atau bila ingin memaksa nilai:
  `{ "namafile.jpg": { "lat": .., "lng": .., "name": "..", "hint": ".." } }`
- `vendor/` — Leaflet, font, & `exifr` (pembaca EXIF di browser), hasil `npm run vendor` (lokal, tak perlu diedit).
- `tiles/` — tile peta CARTO Voyager tanpa label, hasil `npm run tiles` (lokal, tak perlu diedit).
- `vendor-assets.js` / `download-tiles.js` — skrip pengunduh sekali-jalan untuk dua folder di atas.

## Leaderboard & foto pribadi (disimpan di browser)
Nama pemain + skor tersimpan di `localStorage` browser (per perangkat/browser, bukan
file yang ter-share ke pemain lain) — sesuai sifat situs statis tanpa server. Begitu juga
foto yang ditambahkan lewat tombol "+ Tambah foto" (tersimpan di IndexedDB browser).
Kalau kamu bersihkan data situs / ganti browser, keduanya ikut hilang.

## Menerbitkan (opsional)
Folder ini statis, jadi bisa langsung di-hosting — termasuk `vendor/` dan `tiles/`, karena
itu bagian dari aset situsnya (bukan cuma alat build):
- **GitHub Pages**: push ke repo, Settings → Pages → deploy dari branch.
- **Netlify**: seret folder ke app.netlify.com/drop.

## Catatan
- Foto yang tak punya geotag akan dilewati; build menampilkan daftarnya agar bisa diisi via `overrides.json`.
- Peta hanya menampilkan tile untuk area yang sudah diunduh & dikunci ke area kampus UNDIP (lihat
  `AREA_BOUNDS` di `index.html`, zoom 15–18 saat main). Kalau perlu memperluas area, ubah
  `AREA_BOUNDS` di `index.html` **dan** `download-tiles.js`, lalu jalankan ulang `npm run tiles`.
- Nama lokasi (field `name`) tetap disimpan di data untuk keperluan pengelolaan katalog, tapi
  sengaja **tidak ditampilkan ke pemain** (baik di layar hasil maupun ringkasan akhir).
