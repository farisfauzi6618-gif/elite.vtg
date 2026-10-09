# ELITE.VTG — review peluncuran 9 Oktober 2026

Perubahan ditujukan pada situs katalog dan order asli di `chatgpt.site`. Rekening produksi yang diperiksa adalah BCA **3370670403**, atas nama **MUHAMMAD FARIS FAUZI**. QRIS tetap menggunakan gambar asli dan merchant ELITE.VTG.

## Perbaikan pengalaman pelanggan

- Tombol invoice duplikat **Buat pesanan baru** dihapus sesuai persetujuan pemilik. **Lihat produk lainnya** tetap tersedia. Pesanan manual tetap didukung.
- Belanja kedua dengan pilihan katalog baru memeriksa pilihan itu dahulu, lalu melepas cookie invoice sebelumnya. Invoice tersimpan tetap ada; data penerima digunakan kembali, persetujuan diminta kembali, dan ongkir dihitung ulang.
- Ketika kembali dari invoice, hanya jumlah barang yang dikirim dari keranjang tersebut yang dibersihkan. Barang yang ditambahkan kemudian tetap ada. Penanda ini hanya mengatur keranjang perangkat; bukan bukti pembayaran dan tidak mengubah stok.
- Pesan kesiapan checkout membedakan proses memuat dengan gangguan pembayaran, sehingga tombol yang sedang disiapkan tidak langsung dianggap rusak.
- Kode pos otomatis dan berat paket tampil sebagai informasi singkat, dengan jarak formulir lebih rapat. Ukuran input tetap 16 px dan tombol utama tetap mudah diketuk.
- Jika respons unggah terputus, aplikasi memeriksa pesanan yang sama di server sebelum meminta pelanggan mencoba lagi. Hanya pesanan berstatus sudah dikirim yang dipulihkan sebagai invoice.
- Tautan pilihan yang kedaluwarsa memberikan jalan kembali ke katalog.

Untuk pesanan manual baru yang sudah disepakati, gunakan `https://elite-vtg-order.farisfzi.chatgpt.site/?manual=baru`. Simpan invoice lama sebelum membuka pesanan baru. Link ini memulai sesi perangkat baru, bukan menghapus pesanan tersimpan.

## Perlindungan pembayaran

- Nomor rekening dan nama penerima berasal dari konfigurasi server. API pembeli tidak menerima penggantian rekening, QRIS, nominal bayar, atau penerima pembayaran.
- QRIS harus cocok dengan SHA-256 gambar asli yang dipasang pada konfigurasi penerbitan. Gambar dengan format dan ukuran yang masih valid tetapi byte berbeda ditolak. Jika pemeriksaan gagal, API tidak mengirim gambar dan memberi pilihan transfer BCA.
- Unggah QRIS melalui admin tetap ditolak; akun tim katalog tidak memiliki hak mengatur pembayaran atau mengonfirmasi dana.
- Header anti-iframe kini melindungi seluruh checkout, disertai `nosniff` dan `no-referrer`.
- Dependensi diperbarui, termasuk Next 16.3.8 dan dependensi transitif yang tercatat dalam audit. `pnpm audit --prod` pada kedua checkout menghasilkan **0 kerentanan yang diketahui** saat pemeriksaan. Ini merupakan hasil basis data advisori pada saat audit, bukan jaminan tidak adanya seluruh celah.

## Bukti pemeriksaan dan batasannya

- Pengujian order: **139/139 lulus**. Mencakup harga dari server, sesi dan batas permintaan, bukti pembayaran, Telegram dengan respons simulasi, duplikasi konfirmasi, konflik stok, pengiriman dan renderer Worker, salin rekening, kompresi bukti, QRIS yang diganti, serta belanja ulang.
- Pengujian katalog: **8/8 lulus**, mencakup kartu ringkas, pencarian, paginasi 40 barang, size tag/fit, dan pemisahan hak tim dari pembayaran.
- TypeScript dan build produksi kedua situs berhasil.
- Pemeriksaan langsung di situs produksi mencapai pilih produk → keranjang → checkout → pencarian Baleendah → J&T Regular Rp7.000 → total Rp172.000 untuk barang Rp165.000. Tidak membuat pesanan, mengirim bukti, melakukan transfer, memesan kurir, atau mengirim pesan Telegram sungguhan.
- Permintaan admin anonim dan header identitas palsu ditolak. Percobaan penggantian QRIS anonim ditolak 401; permintaan lintas origin ditolak 403.
- Tahap unggah → invoice → konfirmasi pemilik → sinkron stok/pengiriman diuji dengan fixture terisolasi, bukan transaksi produksi. Browser menolak navigasi pratinjau lokal sehingga pemeriksaan visual lokal tahap-tahap itu belum selesai. Pemeriksaan ini bukan pentest penuh infrastruktur atau uji beban.

## Catatan operasional saat peluncuran

1. Cocokkan **dana yang benar-benar masuk** di BCA/QRIS sebelum menekan konfirmasi di Telegram. Foto bukti saja tidak menyatakan dana masuk.
2. Stok belum ditahan saat checkout. Dua pembeli dapat mencoba membayar unit terakhir; sistem mencegah stok negatif dan menahan pengiriman konflik, tetapi pemilik tetap perlu menyelesaikan barang pengganti atau pengembalian dana. Reservasi stok belum ditambahkan dalam perubahan ini.
3. Harga pesanan manual harus dicocokkan dengan kesepakatan sebelum konfirmasi pemilik, sesuai pilihan mempertahankan order manual.
4. Lindungi akun pemilik Sites/ChatGPT dan Telegram dengan autentikasi dua langkah. Perlindungan kode aplikasi tidak mencegah penggantian konfigurasi oleh orang yang sudah menguasai akun penerbit.

Rujukan pemeriksaan: [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html), [REST Security](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html), dan [Transaction Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html). Advisori Next yang ikut ditutup melalui pembaruan: [GHSA-vcvr-r3jv-pc5j](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j); kondisi eksploit advisori tersebut tidak diasumsikan terjadi pada situs ini.
