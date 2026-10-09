# ELITE.VTG: pengiriman KiriminAja

Integrasi utama untuk ongkir, wilayah tujuan, booking J&T, pickup, resi, label, dan pelacakan adalah KiriminAja. Desain, URL pelanggan, QRIS, invoice, nama setiap barang, unggahan bukti, tiga pesan Telegram, dan akun bot tetap dipakai. Booking baru hanya berjalan setelah pemilik mengonfirmasi uang masuk pada invoice Telegram. Tidak ada integrasi pembayaran ShopeePay atau perubahan pembayaran pelanggan.

## Aktivasi akun pemilik

1. Buka `/admin` memakai akun ChatGPT pemilik, lalu bagian **Pengiriman J&T · KiriminAja**.
2. Ajukan akses API Basic di https://kiriminaja.com/integration. Minta sandbox untuk UAT, akses produksi, J&T, KA Credit otomatis, serta API PDF label. Paket Basic diumumkan gratis; saldo, ongkir, asuransi, dan komitmen akun merupakan hal berbeda. KiriminAja perlu mengonfirmasi persyaratan saldo/deposit J&T yang berlaku pada akun.
3. Aktifkan KA Credit di https://app.kiriminaja.com, isi saldo sesuai ketentuan akun, dan siapkan PIN enam digit. Isi key serta PIN hanya dalam kolom password halaman pemilik. Key, PIN dan secret callback dienkripsi AES-GCM di backend; tidak dikembalikan ke browser. Simpan dahulu dengan booking belum aktif.
4. Cari kode pos **40375**, pilih kelurahan/desa KiriminAja yang tepat di Baleendah, Kabupaten Bandung. Template pengirim: **ELITE.VTG**, Kp. Cipicung RT 01 RW 01 No. 43, Kec. Baleendah, Kab. Bandung, Jawa Barat, 40375; **081321423020**. Aplikasi memverifikasi ID kecamatan dan kelurahan lewat API, bukan menebak ID RajaOngkir.
5. Isi berat dalam gram dan ukuran paket sebenarnya. Berat volumetrik juga dipakai pada cek tarif; berat pada invoice tidak otomatis berubah untuk order lama. Batas biaya toko dan berat per pesanan bisa disesuaikan sebelum booking. Pickup memakai WIB sebelum 16.00; pilihan hari ini/besok tetap tersedia. KiriminAja membuat booking dan pickup dalam satu permintaan, tanpa meminta pickup kedua.
6. Hubungkan callback KiriminAja dan periksa konfirmasi Telegram. KiriminAja hanya mengizinkan satu callback per akun; tombol pemilik menggantinya ke aplikasi ini. API key dan secret URL callback harus cocok. Callback hanya dapat memeriksa booking yang sudah diajukan; tidak dapat mengonfirmasi pembayaran atau membuat pengiriman baru.
7. Selesaikan UAT dengan KiriminAja, ganti ke key produksi, pilih ulang wilayah, hubungkan ulang callback, lalu aktifkan booking. Menyimpan konfigurasi atau memasang callback tidak memesan pengiriman. Booking nyata pertama tetap dipicu sendiri oleh pemilik pada pesanan nyata.

Ongkir RajaOngkir sebelumnya tetap berjalan selama key produksi dan wilayah KiriminAja belum siap. Setelah siap, aplikasi dan kalkulator privat memakai KiriminAja yang sama. Kegagalan KiriminAja yang sudah aktif tidak diam-diam memakai tarif penyedia lain. Quote lama tetap tersimpan sebagai bagian invoice.

## Batas produksi yang memerlukan UAT

Form pembuatan key KiriminAja dapat meminta domain, alamat IP, dan URL webhook sebelum key diterbitkan. Domain memakai origin aplikasi order. Secret `KIRIMINAJA_WEBHOOK_TOKEN` dapat diprovisikan lebih dahulu pada runtime agar URL `/api/kiriminaja/webhook/<token>` melayani pemeriksaan GET saat pendaftaran. URL tersebut tidak menerima event POST sampai API key tersimpan dan callback diaktifkan pemilik. Aktivasi berikutnya memakai token yang sama, lalu menyimpannya terenkripsi di D1. Nilai token tidak disimpan pada Git atau dikembalikan dalam respons pengaturan. IP hasil resolusi DNS aplikasi bukan bukti IP keluar API; aturan whitelist KiriminAja harus dikonfirmasi sebelum mengisi kolom IP.

Dokumentasi resmi v6.2 masih memberi contoh respons create bertanda mock. Aplikasi memperlakukan `status=true` sebagai penerimaan, menyimpan invoice sebagai merchant `order_id`, lalu memverifikasi booking lewat API tracking sebelum memakai resi/label. Aplikasi tidak bergantung pada bentuk respons mock untuk mengambil AWB.

Endpoint pemeriksaan PIN `/api/mitra/v6.2/pin/validate` dan saldo `/api/mitra/v6.2/credit/balance` masih dilabeli **Beta, tidak disarankan untuk produksi** dalam dokumentasi saat migrasi. Akses dan kontrak KA Credit otomatis harus disetujui KiriminAja pada UAT akun ini; integrasi belum dinyatakan lulus produksi tanpa key/akun nyata. Akun TOP berbeda dari akun KA Credit yang ditargetkan implementasi ini. Jika endpoint beta tidak tersedia pada akun, booking ditahan tanpa mengirim request berbayar.

Untuk layanan yang mewajibkan geolokasi, koordinat Indonesia pengirim dan penerima wajib diisi oleh pemilik. Layanan tanpa kebutuhan geolokasi mengirim `0` sebagai sentinel titik tidak tersedia; ini perlu diverifikasi pada UAT v6.2 dan bukan titik alamat yang dibuat-buat. `package_type_id=7` mengikuti contoh pakaian resmi; pastikan dukungan kategori pada akun. Domain PDF yang diterima dibatasi ke HTTPS `kiriminaja.com` dan subdomainnya. Domain CDN lain ditahan sampai diverifikasi sebagai domain unduhan resmi; token API tidak pernah diteruskan saat mengunduh PDF.

## Status, keamanan, dan booking tunggal

Status pembayaran `proof_received` dan `payment_confirmed` terpisah dari `awaiting_confirmation`, `booking_processing`, `booking_failed`, `booking_unknown`, `booked`, serta `awb_available`. Upload bukti hanya mengirim bukti, invoice dengan tombol, dan detail penerima. Resi tersedia dan pickup terjadwal belum berarti paket sudah diserahkan ke kurir.

Konfirmasi membutuhkan secret webhook Telegram, akun Telegram pemilik, chat privat yang sesuai, dan message ID invoice asli. Callback berulang dan klik bersamaan dilindungi receipt serta lease D1 per pesanan. Penanda pengiriman create disimpan sebelum request. PIN tidak disimpan dalam snapshot payload booking.

Jika create timeout, respons tidak terbaca, atau ID invoice sudah ada, status menjadi `booking_unknown`. Percobaan ulang melakukan lookup read-only berdasarkan invoice dan mencocokkan nama/HP/alamat pengirim-penerima, layanan J&T, invoice, COD nol, dan premi. Aplikasi tidak mengulang create secara buta. Jika penyedia tidak dapat membuktikan keberadaan booking, pemilik perlu memeriksa dashboard atau meminta KiriminAja mencari invoice tersebut. Penolakan validasi yang pasti dapat dicoba ulang. Saldo rendah, alamat tidak cocok, asuransi tidak tersedia, dan biaya melampaui batas ditahan sebelum request booking. PIN yang pertama kali ditolak dihapus dari konfigurasi sehingga aplikasi tidak mengulang PIN salah dan mengunci KA Credit.

Booking Komship yang sudah ada tetap memakai penyedia asalnya, termasuk rekonsiliasi dan label. Migrasi tidak membuat booking pengganti. Pesanan baru diarahkan ke KiriminAja. Key/env lama perlu dipertahankan untuk menyelesaikan booking lama; jangan menghapus saldo atau akun lama sebelum paket selesai.

## Asuransi, biaya, dan promo

Nilai barang selalu harga barang pada invoice, tanpa ongkir, tanpa menaikkan deklarasi dan tanpa membuat harga satuan fiktif untuk order berisi beberapa nama barang. Asuransi wajib ditanggung toko; pelanggan tetap membayar total invoice sebelumnya. Premi mengikuti respons tarif. Estimasi J&T 0,2% dibulatkan ke atas per Rp100. Aplikasi menahan booking jika premi atau persentase asuransi tidak tersedia.

Setelah booking, API tracking harus mencatat premi sesuai permintaan. Endpoint itu tidak memuat ulang `item_value`; status asuransi terverifikasi berarti nilai barang sebenarnya telah diajukan dan premi tercatat sesuai, bukan bahwa nilai deklarasi telah diperiksa independen atau klaim dijamin. Klaim mengikuti KiriminAja/J&T. Batas biaya diberlakukan pada **ongkir bruto + premi**, karena kelayakan diskon dapat berubah. `shipping_cost` tetap tarif bruto sesuai dokumentasi. Saldo KA Credit digunakan oleh penyedia setelah booking/pickup diterima.

Aplikasi memilih potongan pickup terbesar yang dikembalikan API untuk layanan J&T yang sama dan mengabaikan promo `drop_only` ketika pickup. Tidak mengganti layanan pilihan pelanggan demi promo. Tidak ada API daftar/klaim voucher akun yang terdokumentasi; implementasi tidak menjanjikan penukaran semua voucher dashboard secara otomatis. Tarif/diskon final mengikuti akun KiriminAja.

## Resi, label, dan pelacakan

AWB hanya diambil dari API tracking penyedia. PDF diambil dari `/api/mitra/v6.1/awb/print` dan disimpan asli di R2 privat. PDFium mengubah PDF yang sama menjadi PNG; barcode, alamat, dan HP tidak digambar ulang. Telegram menerima ringkasan invoice/nama/AWB dan dua dokumen. Callback `processed_packages` dapat melanjutkan resi yang terlambat; nomor/status/data pelanggan dalam callback hanya hint dan diverifikasi lewat tracking API. Jika callback atau Telegram gagal, tombol coba ulang melanjutkan booking/file yang sama dan hanya mengirim bagian yang belum berhasil. AWB yang berubah ditahan agar label lama tidak dipakai untuk nomor berbeda.

Halaman `/lacak` tetap memakai tautan pribadi 180 hari atau invoice serta nomor HP penuh. Token acak di fragment URL disimpan hash/terenkripsi dan hanya memberi akses status. Data publik tidak memuat alamat, HP, API key, PIN, driver, biaya internal, atau respons mentah penyedia. Cache tracking berhasil 10 menit, retry kegagalan minimal 2 menit, dan lease membatasi refresh bersamaan. Callback mengizinkan refresh berikutnya. Status paket berasal dari API tracking dan scan kurir, bukan hanya penerbitan AWB, bukan GPS langsung. Riwayat lama tetap terlihat saat API gagal.

Label PDF/PNG bisa diunduh dari dashboard atau tombol Telegram **Buka label & cetak**. Pilihan ukuran 10×15 cm, 10×10 cm, dan A4 mengatur halaman cetak perangkat; PDF tetap format resmi penyedia. Tombol Cetak membuka dialog printer. Cetak fisik otomatis HP/Bluetooth masih membutuhkan model printer, sistem perangkat dan penghubung resmi; keberhasilan membuka dialog tidak dianggap kertas telah keluar.

## Verifikasi migrasi

`pnpm test:shipping` lulus **82 pengujian** aplikasi: otorisasi, proof tanpa booking, replay/konkurensi, kegagalan/timeout, PIN/saldo, mandatory insurance, label/Telegram retry, callback, pendaftaran webhook sebelum key tersedia, bridge read-only, legacy booking, invoice/pembayaran lama, pelacakan dan cetak privat. PDFium juga diuji pada workerd/Miniflare. Kalkulator memiliki **5 pengujian** lewat `node --test tests/shipping.test.mjs`. TypeScript diperiksa pada kedua aplikasi. Semua API/Telegram diintersep dan database/R2 menggunakan fixture simulasi; tidak ada pengiriman berbayar atau pesan produksi saat pengujian.

Sumber resmi: https://developer.kiriminaja.com/docs/ (OpenAPI JSON, versi 6.2.0); https://github.com/kiriminaja/kiriminaja-node (fungsi print AWB); https://kiriminaja.com/integration (akses akun/API). Status produksi menunggu aktivasi key, KA Credit/PIN, persetujuan UAT, kategori/koordinat dan unduhan label akun ini.
