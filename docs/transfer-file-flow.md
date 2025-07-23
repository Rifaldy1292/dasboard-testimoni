# Dokumentasi Alur Transfer File

Dokumen ini menjelaskan alur kerja fitur transfer file, mencakup interaksi antara frontend (aplikasi web) dan backend (server), serta bagaimana file dimodifikasi dan dikelola.

## Daftar Isi
1.  [Alur Utama](#alur-utama)
    -   [Upload File](#1-alur-upload-file)
    -   [Hapus File](#2-alur-hapus-file)
    -   [Undo Hapus File](#3-alur-undo-hapus-file)
2.  [Modifikasi File](#modifikasi-file)
3.  [Penanganan Khusus Mesin MC-3](#penanganan-khusus-mesin-mc-3)
4.  [Koneksi dengan MQTT](#koneksi-dengan-mqtt)

---

## Alur Utama

### 1. Alur Upload File

Proses ini dimulai dari antarmuka pengguna (frontend) hingga file berhasil dikirim ke mesin melalui server (backend).

**Frontend:**

1.  **Pemilihan Aksi & Mesin**: Pengguna memilih aksi "Upload File" dan memilih mesin target dari dropdown.
2.  **Pengecekan Kesiapan Mesin**: Sistem secara otomatis memanggil endpoint `GET /machines/is-ready-transfer-files` untuk memastikan tidak ada log mesin yang deskripsinya kosong. Jika ada, pengguna akan diminta untuk mengisinya terlebih dahulu.
3.  **Input Parameter**: Pengguna memasukkan parameter tambahan seperti *Work Position*, *Coordinate*, *Start Point*, dll.
4.  **Upload File/Folder**: Pengguna memilih file atau folder G-code yang akan di-transfer.
5.  **Pembuatan Main Program**: Setelah pengguna menekan tombol **"Execute"**, frontend **tidak langsung** meng-upload file. Sebaliknya, ia melakukan modifikasi penting:
    -   Sebuah file G-code baru yang disebut **"Main Program"** (contoh nama: `O0031`) dibuat secara dinamis di frontend.
    -   Isi dari "Main Program" ini adalah gabungan dari template G-code yang spesifik untuk tipe mesin yang dipilih dan perintah untuk memanggil setiap file yang di-upload pengguna (`M198P...` atau `M98P...`).
    -   Parameter yang diinput pengguna (seperti *Work Position*, *Coolant*, dll.) dan **ID Transfer File** (diperoleh dari backend) disisipkan ke dalam "Main Program" ini sebagai variabel makro (contoh: `#501=...`, `#541=...`).
6.  **Pratinjau**: Pengguna dapat melihat pratinjau dari "Main Program" yang baru dibuat.
7.  **Kirim ke Server**: Setelah menekan tombol **"Transfer Files"**, semua file (termasuk "Main Program" yang baru dibuat dan file-file asli dari pengguna) dikirim ke backend melalui endpoint `POST /machines/transfer`.

**Backend:**

1.  **Penerimaan File**: Controller `FTPController.js` menerima file-file tersebut.
2.  **Pengecekan Mesin**: Server memeriksa nama mesin yang dituju.
    -   **Untuk Mesin MC-3**: File tidak dikirim via FTP. Sebaliknya, file-file tersebut disimpan di direktori lokal server di `/transfer_files/MC-3/`. (Lihat [Penanganan Khusus Mesin MC-3](#penanganan-khusus-mesin-mc-3)).
    -   **Untuk Mesin Lain**: Server membuat koneksi FTP ke alamat IP mesin yang sesuai.
3.  **Transfer FTP**: Semua file di-upload ke direktori penyimpanan pada mesin (misalnya, `/Storage Card/USER/DataCenter` untuk MC-14/15 atau direktori root untuk mesin lain).
4.  **Update Status Operator**: Setelah transfer berhasil, status `is_using_custom` pada tabel `MachineOperatorAssignment` diubah menjadi `false` untuk menandakan bahwa tugas kustom (transfer file) telah selesai.

### 2. Alur Hapus File

**Frontend:**

1.  **Pemilihan Aksi & Mesin**: Pengguna memilih aksi "Remove File" dan memilih mesin target.
2.  **Ambil Daftar File**: Frontend memanggil endpoint `GET /machines/list-files/{machine_id}` untuk mendapatkan daftar file.
3.  **Tampilkan Daftar File**: Daftar file yang ada di mesin dan yang sudah dihapus (di-backup di server) ditampilkan.
4.  **Aksi Hapus**: Pengguna menekan ikon hapus pada file yang diinginkan.

**Backend:**

1.  **Permintaan Daftar File**: `FTPController.getListFiles` menerima permintaan. Ia mengambil daftar file dari mesin via FTP dan juga dari direktori backup lokal di server (`/server/public/cnc_files/<machine_id>`). File dari direktori lokal ditandai sebagai `isDeleted: true`.
2.  **Permintaan Hapus**: `FTPController.removeFileFromMachine` menerima permintaan hapus.
3.  **Backup File**: Sebelum menghapus, server **mengunduh (download)** file yang akan dihapus dari mesin ke direktori backup lokal (`/server/public/cnc_files/<machine_id>`).
4.  **Hapus File di Mesin**: Setelah backup berhasil, file tersebut dihapus dari mesin melalui perintah FTP `remove`.

### 3. Alur Undo Hapus File

**Frontend:**

1.  **Aksi Undo**: Pada daftar file yang ditampilkan, pengguna menekan ikon "undo" pada file yang berstatus `isDeleted: true`.

**Backend:**

1.  **Permintaan Undo**: `FTPController.undoRemove` menerima permintaan.
2.  **Baca File Backup**: Server membaca file dari direktori backup lokal (`/server/public/cnc_files/<machine_id>`).
3.  **Transfer Kembali ke Mesin**: File yang sudah dibaca tersebut kemudian di-upload kembali ke mesin menggunakan alur `transferFiles` yang sama seperti pada proses upload.
4.  **Hapus File Backup**: Setelah file berhasil dikembalikan ke mesin, file dari direktori backup lokal akan dihapus.

---

## Modifikasi File

Modifikasi file G-code **hanya terjadi di sisi frontend** dan merupakan langkah krusial dalam alur upload.

-   **File**: `client/src/components/modules/TransferFile/utils/contentMainProgram.util.ts`
-   **Tujuan**: Untuk membuat satu file "Main Program" yang berfungsi sebagai orkestrator atau pemanggil file-file G-code lainnya yang di-upload oleh pengguna.
-   **Proses**:
    1.  Fungsi `contentMainProgram` mengambil daftar file yang di-upload dan semua parameter input dari pengguna.
    2.  Berdasarkan tipe mesin yang dipilih (`startMacro`), fungsi ini memilih template G-code yang sesuai.
    3.  Ia melakukan iterasi melalui setiap file yang di-upload dan menghasilkan baris perintah `M198P{nama_file}` atau `M98P{nama_file}` untuk memanggil file tersebut.
    4.  Yang terpenting, ia menyisipkan **ID Transfer File** (`transfer_file_id`) ke dalam G-code menggunakan variabel makro (misal: `#501`, `#541`, dll.). ID ini didapat dari `TransferFile` model di database.
    5.  Hasil akhirnya adalah sebuah string berisi G-code lengkap untuk "Main Program" yang siap di-upload bersama file-file lainnya.

---

## Penanganan Khusus Mesin MC-3

Mesin MC-3 tidak mendukung koneksi FTP secara stabil dari aplikasi. Oleh karena itu, alurnya dimodifikasi:

-   **Upload**: Saat pengguna mentransfer file untuk MC-3, backend melalui `FTPMC3Controller.handleMC3TransferFiles` tidak melakukan koneksi FTP. Sebaliknya, ia hanya menyimpan file-file yang di-upload ke sebuah direktori di dalam server: `/transfer_files/MC-3/`. Proses transfer dari server ke mesin MC-3 kemudian dilakukan secara manual di luar aplikasi.
-   **Hapus & List File**: Koneksi untuk menghapus dan melihat daftar file menggunakan mode "Active" FTP yang dipaksakan, karena ini satu-satunya mode yang cukup stabil untuk operasi sederhana pada MC-3.

---

## Koneksi dengan MQTT

Meskipun tidak secara langsung terlibat dalam transfer via HTTP/FTP, alur ini sangat terhubung dengan sistem MQTT.

1.  **Penyimpanan ID**: Saat frontend membuat "Main Program", ia meminta backend untuk membuat entri di tabel `TransferFile`. Backend membuat record yang berisi detail transfer (user_id, nama G-code, k_num, dll.) dan mengembalikan `id` dari record tersebut.
2.  **Injeksi ID ke G-Code**: Frontend menyuntikkan `id` ini ke dalam "Main Program" sebagai nilai dari variabel makro (contoh: `#501=123`).
3.  **Eksekusi di Mesin**: Ketika "Main Program" dieksekusi di mesin, mesin akan membaca variabel makro tersebut dan mengirimkannya sebagai bagian dari pesan MQTT ke topik `machine/status`.
4.  **Pengambilan Konteks oleh Server**: Server MQTT (`MachineMqtt.js`) menerima pesan, mengekstrak `transfer_file_id` dari pesan tersebut, dan menggunakan fungsi `getTransferFile` untuk mengambil detail lengkap dari transfer tersebut dari database.
5.  **Logging**: Dengan informasi ini, server dapat membuat log (`MachineLog`) yang akurat, mencatat siapa yang melakukan transfer, file apa yang dijalankan, dan metrik lainnya, sehingga menghubungkan aksi di aplikasi web dengan aktivitas aktual di mesin.
