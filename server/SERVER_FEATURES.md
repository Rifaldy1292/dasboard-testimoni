# Dokumentasi Fitur dan Endpoint Server

Dokumen ini merinci fitur utama, daftar endpoint API, dan penjelasan tugas terjadwal (cron jobs) yang ada di server aplikasi.

## 1. Daftar Fitur Utama

Berikut adalah kapabilitas utama yang dimiliki oleh backend aplikasi ini:

- **Manajemen Pengguna dan Akses**:

  - Registrasi, login, dan manajemen profil pengguna.
  - Sistem otentikasi berbasis token (JWT).
  - Pembatasan akses berdasarkan peran (Role-Based Access Control).

- **Pemantauan Mesin (Machine Monitoring)**:

  - Menerima dan mencatat data status mesin (misalnya, `running`, `stop`, `alarm`) secara real-time melalui MQTT.
  - Menampilkan histori log untuk setiap mesin.
  - Menghitung dan menyajikan data produktivitas seperti `Cutting Time` dan `Running Time`.

- **Transfer File NC (FTP)**:

  - Mengunggah file program (G-code/NC) dari server ke mesin.
  - Mengunduh daftar file yang ada di mesin.
  - Menghapus file dari mesin.

- **Komunikasi Real-time**:

  - Mengirim pembaruan status mesin dan data lainnya secara instan ke semua klien (dashboard) yang terhubung melalui WebSockets.

- **Manajemen Operator**:

  - Menugaskan operator (user) ke mesin tertentu.

- **Konfigurasi Dinamis**:

  - Mengatur konfigurasi harian seperti jadwal shift kerja yang akan digunakan dalam kalkulasi produktivitas.

- **Tugas Otomatis (Cron Jobs)**:

  - Menjalankan tugas pemeliharaan dan pembuatan data secara otomatis pada waktu yang ditentukan, seperti membuat entri `CuttingTime` harian dan membersihkan file-file sementara.

- **Pelaporan (Reporting)**:
  - Mengunduh laporan log mesin dalam format bulanan (kemungkinan besar Excel/CSV).

## 2. Daftar Endpoint API

Semua endpoint berada di bawah prefix `/api`.

| Method            | Endpoint                      | Controller                                     | Deskripsi                                                                     |
| :---------------- | :---------------------------- | :--------------------------------------------- | :---------------------------------------------------------------------------- |
| **User**          |                               |                                                |                                                                               |
| `POST`            | `/users/register`             | `UserController.register`                      | Mendaftarkan pengguna baru.                                                   |
| `POST`            | `/users/login`                | `UserController.login`                         | Login pengguna dan mendapatkan token JWT.                                     |
| `GET`             | `/users`                      | `UserController.getAll`                        | Mendapatkan daftar semua pengguna.                                            |
| `GET`             | `/users/check-token`          | `UserController.checkToken`                    | Memverifikasi validitas token (biasanya untuk inisialisasi sesi di frontend). |
| `PATCH`           | `/users/reset-password`       | `UserController.resetPassword`                 | Mereset password pengguna (biasanya oleh admin).                              |
| `PATCH`           | `/users/change-password`      | `UserController.changePassword`                | Mengubah password oleh pengguna yang sedang login.                            |
| `GET`             | `/users/:id`                  | `UserController.getById`                       | Mendapatkan detail pengguna berdasarkan ID.                                   |
| `DELETE`          | `/users/:id`                  | `UserController.deleteById`                    | Menghapus pengguna berdasarkan ID.                                            |
| **Role**          |                               |                                                |                                                                               |
| `GET`             | `/roles`                      | `RoleController.getAll`                        | Mendapatkan daftar semua peran (role) yang tersedia.                          |
| **Machine & FTP** |                               |                                                |                                                                               |
| `GET`             | `/machines/options`           | `MachineController.getMachineOption`           | Mendapatkan daftar mesin untuk dropdown/pilihan.                              |
| `GET`             | `/machines/logs/:machine_id`  | `MachineController.getMachineLogByMachineId`   | Mendapatkan log histori dari satu mesin.                                      |
| `POST`            | `/machines/logs/download`     | `MachineController.downloadMachineLogsMonthly` | Mengunduh laporan log bulanan.                                                |
| `GET`             | `/machines/cutting-time`      | `MachineController.getCuttingTime`             | Mendapatkan data cutting time untuk mesin.                                    |
| `POST`            | `/machines/files/transfer`    | `FTPController.transferFiles`                  | Mengirim file dari server ke mesin via FTP.                                   |
| `POST`            | `/machines/files/list`        | `FTPController.getListFiles`                   | Mendapatkan daftar file yang ada di mesin via FTP.                            |
| `POST`            | `/machines/files/delete`      | `FTPController.removeFileFromMachine`          | Menghapus file di mesin via FTP.                                              |
| **Settings**      |                               |                                                |                                                                               |
| `GET`             | `/settings/daily-configs`     | `SettingsController.getListDailyConfig`        | Mendapatkan daftar konfigurasi shift harian.                                  |
| `POST`            | `/settings/daily-configs`     | `SettingsController.createDailyConfig`         | Membuat konfigurasi shift harian baru.                                        |
| `PATCH`           | `/settings/daily-configs/:id` | `SettingsController.editDailyConfig`           | Mengedit konfigurasi shift harian.                                            |
| `DELETE`          | `/settings/daily-configs/:id` | `SettingsController.deleteDailyConfig`         | Menghapus konfigurasi shift harian.                                           |

## 3. Penjelasan File `helpers/cronjob.js`

File ini menggunakan `node-cron` untuk menjadwalkan tugas-tugas yang berjalan secara otomatis di latar belakang pada waktu yang telah ditentukan.

### Fungsi Utama: `handleCronJob()`

Fungsi ini adalah inisiator utama yang akan menjalankan semua cron job ketika server dimulai.

### Daftar Tugas Terjadwal (Cron Jobs)

1.  **`createCuttingTime()`**

    - **Jadwal**: `0 1 * * *` (Setiap hari pukul 01:00 pagi).
    - **Tugas**: Fungsi ini secara otomatis membuat entri `CuttingTime` baru untuk setiap mesin di database dengan target default (misalnya `0` atau nilai standar lainnya). Tujuannya adalah menyiapkan baris data untuk hari yang baru sehingga data cutting time dapat langsung diisi ketika mesin beroperasi.

2.  **`createDailyConfig()`**

    - **Jadwal**: `0 2 * * *` (Setiap hari pukul 02:00 pagi).
    - **Tugas**: Membuat entri `DailyConfig` untuk hari saat ini, menyalin konfigurasi dari hari sebelumnya. Ini memastikan bahwa selalu ada konfigurasi shift yang valid untuk setiap hari, bahkan jika admin lupa mengaturnya secara manual.

3.  **`handleResetMachineStatus()`**

    - **Jadwal**: `0 4 * * *` (Setiap hari pukul 04:00 pagi).
    - **Tugas**: Mereset status semua mesin menjadi `off` atau status default lainnya di dalam cache aplikasi. Ini berguna untuk memastikan bahwa pada awal hari kerja baru, semua mesin dianggap dalam keadaan mati sebelum data MQTT pertama masuk.

4.  **`deleteCncFiles()`**

    - **Jadwal**: `0 3 * * *` (Setiap hari pukul 03:00 pagi).
    - **Tugas**: Membersihkan file-file sementara yang disimpan di direktori `server/public/cnc_files`. File-file ini kemungkinan adalah salinan dari file NC yang ditransfer ke mesin. Pembersihan ini dilakukan untuk menghemat ruang penyimpanan.

5.  **`cleanupLogFiles()`**
    - **Jadwal**: `0 0 * * 0` (Setiap hari Minggu pukul 00:00 atau tengah malam).
    - **Tugas**: Membersihkan file log aplikasi yang sudah lama (lebih dari 7 hari) dari direktori `server/logs`. Ini adalah praktik standar untuk manajemen log agar tidak membebani server dengan file log yang menumpuk.
