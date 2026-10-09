# Konfigurasi pembayaran ELITE.VTG

Aplikasi order ini menggunakan Site yang sama: https://elite-vtg-order.farisfzi.chatgpt.site. Rekening dan QRIS dibaca dari environment Worker pada runtime. Tidak ada nilai tujuan pembayaran yang ditanam pada bundle frontend atau diambil dari input pembeli maupun pengaturan dashboard.

## Konfigurasi pemilik

Kelola nilai berikut melalui **Sites runtime environment variables** pada project `appgprj_6ac14f2913d48191b83206a2dfb2b0a5`, kemudian deploy versi sumber yang telah diuji.

| Variable | Nilai yang diperlukan |
| --- | --- |
| `PAYMENT_BCA_ACCOUNT_NUMBER` | Nomor rekening BCA pemilik, tepat 10 digit |
| `PAYMENT_BCA_ACCOUNT_HOLDER` | Nama penerima sebenarnya, 2–100 karakter |
| `PAYMENT_QRIS_KEY` | Key aset QRIS asli di binding R2 `BUCKET`, berbentuk `qris/<key>` |
| `PAYMENT_QRIS_SHA256` | SHA-256 (64 digit hex lowercase) dari byte aset QRIS asli; aset yang berubah ditolak sebelum ditampilkan |
| `PAYMENT_QRIS_MIME` | `image/jpeg`, `image/png`, atau `image/webp`, sesuai aset asli |
| `PAYMENT_QRIS_MERCHANT` | Nama merchant yang tercantum pada QRIS asli |

Nomor, nama penerima, dan key R2 disimpan sebagai secret pada pengaturan Sites agar tidak dikembalikan oleh alat pembaca environment. Nomor rekening dan nama penerima memang ditampilkan kepada pembeli melalui respons publik `/api/config`. Secret bot, webhook, database, dan integrasi tidak ikut dikirim dalam respons tersebut. Jangan menggunakan awalan `NEXT_PUBLIC_` atau `VITE_` untuk variabel pembayaran.

Aset QRIS lama tetap digunakan; perubahan ini tidak membuat atau mengganti QRIS. `/api/qris` hanya mengambil key yang dikonfigurasi pemilik di R2. URL eksternal tidak diterima. Konfigurasi yang kosong/tidak valid dan aset yang hilang menonaktifkan metode terkait. Endpoint gambar memeriksa format gambar dan batas ukuran. Perubahan tujuan di kemudian hari harus dilakukan pemilik pada backend/deployment, lalu dipublikasikan; jangan mengaktifkan kembali upload QRIS pada dashboard.

## Alur dan kompatibilitas

- Pesanan baru memakai BCA secara default bila konfigurasi valid. QRIS tetap tersedia sebagai alternatif. Pilihan diubah melalui `PATCH /api/order` dengan cookie pesanan dan pemeriksaan Origin. Endpoint hanya menerima `paymentMethod` dan tidak menerima nominal atau penerima pembayaran.
- Metode tersimpan pada kolom `orders.payment_method`. Setelah bukti dikirim, metode dan detail pesanan terkunci. Unggahan menjaga kesesuaian metode dan snapshot nominal/barang/ongkir saat penyimpanan; permintaan yang bertabrakan dari tab lain ditolak.
- Unggahan tetap menggunakan validasi ukuran 4 MB dan signature JPG/PNG/WebP di server. Persiapan gambar pada browser tetap menerima hingga 20 MB dan memperkecil sebelum unggahan.
- Upload bukti menghasilkan `payment_state=proof_received`. Hanya konfirmasi pemilik pada alur Telegram existing yang menghasilkan `payment_confirmed` dan timestamp konfirmasi. Invoice dan notifikasi menunjukkan metode dan status verifikasi. Fitur salin alamat tetap ada.
- Migrasi `drizzle/0012_tidy_silk_fever.sql` hanya menambah `payment_method TEXT NOT NULL DEFAULT 'qris_dana'`. Pesanan lama mempertahankan QRIS dan data lainnya. Insert baru memilih metode default dari konfigurasi server. Tidak ada migrasi lama yang diubah.
- Pembeli yang masih membuka frontend lama perlu memuat ulang halaman. Bukti BCA tanpa informasi metode ditolak agar invoice tidak salah mencatat pembayaran.
- Harga katalog diambil ulang dari server; ongkir berasal dari quote tersimpan yang divalidasi. **Order manual tetap tersedia sesuai keputusan pemilik:** harga adalah harga kesepakatan yang diisi pembeli, lalu wajib dicocokkan pemilik sebelum konfirmasi. Sistem tidak mengklaim dapat memverifikasi kesepakatan manual secara otomatis.

## Batas akses dan pencatatan

Dashboard menampilkan tujuan pembayaran hanya baca. `POST /api/admin/qris` memeriksa autentikasi pemilik dan Origin, lalu selalu menolak perubahan dengan 403; percobaan pemilik dicatat di log Worker dengan actor dan action, tanpa isi rekening atau payload. Tidak ada endpoint lain yang disediakan untuk menulis rekening/QRIS. Revisi environment dan versi publikasi mengikuti mekanisme Sites.

Penguasaan akun deployment atau akses tulis langsung ke backend/R2 tetap dapat mengubah konfigurasi/aset. Tampilan tujuan pembayaran tidak membuktikan dana sudah diterima. Pemilik tetap perlu mencocokkan dana masuk, nominal, dan nama pengirim, terutama untuk pesanan manual.

## Pengujian dan deployment

1. Jalankan `pnpm test:shipping`, `pnpm test:checkout`, serta tes katalog dan berat. Untuk tes katalog dari checkout berbeda, gunakan `ELITE_CATALOG_TEST_ROOT` menunjuk sumber katalog yang sesuai.
2. Jalankan `node node_modules/typescript/bin/tsc --noEmit`, `pnpm lint`, dan `pnpm build`. Folder runtime, emulator, dan output diabaikan oleh lint, bukan kode aplikasi.
3. Push sumber melalui workflow Sites dengan kredensial repository yang berumur pendek. Paketkan output Worker `dist`, `.openai/hosting.json`, dan direktori Drizzle termasuk journal serta snapshot baru. Jangan sertakan environment lokal, fixture, atau database emulator.
4. Simpan versi dari commit yang sama dengan paket build, lalu deploy versi tersebut ke Site existing dengan audience yang sama. Revisi environment baru berlaku saat deployment.
5. Setelah publikasi, pemilik dapat membuka checkout baru dan memeriksa BCA default, nomor/nama rekening, opsi QRIS, copy nominal/rekening, perbesaran/unduhan, invoice dan Telegram. Uji transfer nyata dilakukan pemilik; rangkaian tes pengembangan tidak mengirim uang, tidak membuat order produksi, dan tidak mengirim notifikasi nyata.

Hasil pemeriksaan implementasi: 130 pengujian otomatis lulus; TypeScript dan build lulus. Lint repository masih memiliki 9 error yang sudah ada pada sumber sebelum perubahan (efek/ref React, JSX dalam try/catch, tipe `any`, dan `prefer-const`). Perbandingan kode lama dan baru mengonfirmasi jumlah/rule error tersebut tidak berubah; komponen serta endpoint pembayaran baru bebas error lint. Pemeriksaan browser lokal mencakup desktop 1280×900, mobile 390×844, copy rekening/total, ganti metode tanpa ganti nominal, gambar QRIS asli, dialog/Escape, dan unduhan JPG. Integrasi Telegram/provider diuji memakai mock; tidak ada transfer atau pemesanan kurir produksi dalam pengujian.

## Pemeriksaan launch 9 Oktober 2026

Gambar QRIS kini diverifikasi menggunakan SHA-256 terhadap fingerprint yang dikunci di konfigurasi deployment. Mengganti isi file di R2 dengan gambar berformat sama tetap ditolak. Rekening BCA tetap hanya berasal dari konfigurasi server; endpoint pemilihan metode dan unggah bukti tidak menerima rekening, merchant, URL QRIS, maupun nominal dari pembeli. Checkout dan admin menolak tampilan dalam iframe pihak lain.

Tombol duplikat “Buat pesanan baru” pada invoice dihapus atas persetujuan pemilik. “Lihat produk lainnya” membawa pembeli kembali ke katalog, membersihkan hanya jumlah barang dari keranjang yang dikirim, dan mempertahankan barang yang ditambahkan sesudahnya. Pemilihan katalog baru memvalidasi harga/stok dahulu, kemudian melepas cookie invoice sebelumnya tanpa menghapus rekaman pesanan.

Pesanan manual baru tetap tersedia di `/?manual=baru`, untuk harga yang telah disepakati dan diverifikasi pemilik. Membuka tautan ini memulai sesi formulir baru; simpan invoice sebelumnya terlebih dahulu. Tidak ada harga manual yang otomatis dianggap terverifikasi.
