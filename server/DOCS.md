# Dokumentasi Server Express.js

Dokumentasi ini menjelaskan arsitektur, struktur proyek, dan cara menjalankan server backend untuk aplikasi Dashboard Mesin.

## 1. Ikhtisar

Server ini dibangun menggunakan **Express.js** dan berfungsi sebagai tulang punggung aplikasi, bertanggung jawab untuk:

- Menyediakan **RESTful API** untuk operasi data (CRUD) terkait mesin, pengguna, log, dan konfigurasi.
- Menangani **otentikasi dan otorisasi** pengguna berbasis peran (role).
- Menerima data dari mesin secara real-time melalui **MQTT**.
- Mengirimkan pembaruan data ke klien (frontend) secara real-time menggunakan **WebSockets**.
- Berinteraksi dengan database **PostgreSQL** melalui **Sequelize ORM**.

## 2. Struktur Proyek

Proyek ini memiliki struktur yang modular untuk memisahkan setiap concern.

```
server/
├── app.js                    # File entri utama aplikasi Express
├── mqtt.js                   # File entri untuk proses listener MQTT
├── config/                   # Konfigurasi aplikasi (database, env)
├── controllers/              # Logika bisnis untuk setiap endpoint API
├── helpers/                  # Fungsi bantuan (enkripsi, token, cron job)
├── middlewares/              # Middleware Express (otentikasi, error handling)
├── migrations/               # Migrasi skema database Sequelize
├── models/                   # Model data (definisi tabel) Sequelize
├── routes/                   # Definisi rute/endpoint API
├── seeders/                  # Seeder data awal untuk database
├── utils/                    # Utilitas umum (logger, dll.)
└── websocket/                # Logika untuk menangani koneksi WebSocket
```

- **`app.js`**: Menginisialisasi server Express, mengatur middleware (CORS, parser), menghubungkan router, dan memulai server WebSocket.
- **`mqtt.js`**: Berjalan sebagai proses terpisah. Terhubung ke MQTT broker untuk mendengarkan data dari mesin, memprosesnya, dan menyimpannya ke database.
- **`/controllers`**: Berisi semua logika inti. Misalnya, `UserController.js` menangani registrasi dan login, sementara `MachineController.js` mengelola data mesin.
- **`/routes`**: Menghubungkan URL endpoint (misalnya `/api/users`) ke fungsi controller yang sesuai.
- **`/models`**: Mendefinisikan struktur tabel database dan hubungan antar tabel (asosiasi).
- **`/middlewares`**: Fungsi yang dieksekusi sebelum request mencapai controller. `auth.js` adalah contoh penting yang memverifikasi token JWT.

## 3. Rute API (Endpoints)

API diekspos di bawah prefix `/api`. Berikut adalah rute utama yang tersedia:

- **`/api/users`**: Endpoint untuk manajemen pengguna (register, login, get all, get by id, dll). Dikontrol oleh `UserController`.
- **`/api/roles`**: Endpoint untuk mendapatkan daftar peran (role) pengguna. Dikontrol oleh `RoleController`.
- **`/api/machines`**: Endpoint untuk semua operasi terkait mesin, termasuk:
  - Mendapatkan daftar mesin.
  - Melihat log detail per mesin.
  - Mengunduh log bulanan.
  - Mendapatkan data cutting time dan running time.
  - Menangani transfer file via FTP ke mesin.
- **`/api/settings`**: Endpoint untuk mengelola konfigurasi aplikasi, seperti jadwal shift harian.

## 4. Komunikasi Real-time

Aplikasi ini sangat bergantung pada komunikasi real-time.

### WebSocket

- **Lokasi**: `websocket/handleWebsocket.js`
- **Fungsi**: Setelah klien (browser) terhubung, server dapat mengirim data secara proaktif. Ini digunakan untuk memperbarui UI dashboard secara langsung ketika ada perubahan status mesin atau data baru masuk, tanpa perlu klien melakukan polling.

### MQTT

- **Lokasi**: `mqtt.js` dan `mqtt/MachineMqtt.js`
- **Fungsi**: Dijalankan sebagai proses terpisah oleh PM2. Proses ini bertindak sebagai klien MQTT yang berlangganan (subscribe) topik dari broker. Ketika sebuah mesin mempublikasikan datanya (misalnya, status 'running' atau 'stop'), proses ini menangkap pesan tersebut, menyimpannya sebagai `MachineLog` di database, dan kemudian memicu pembaruan melalui WebSocket ke semua klien yang terhubung.

## 5. Konfigurasi

- **`config/config.json`**: File konfigurasi standar Sequelize. Di sini Anda mengatur kredensial koneksi database (username, password, host, dll.) untuk lingkungan `development`, `test`, dan `production`.
- **`.env`**: File ini harus dibuat di root folder `server/` untuk menyimpan variabel lingkungan yang sensitif, seperti:
  - `PORT`: Port tempat server Express berjalan.
  - `JWT_SECRET`: Kunci rahasia untuk menandatangani JSON Web Tokens.
  - Informasi sensitif lainnya.

## 6. Instalasi dan Menjalankan Server

### Prasyarat

- Node.js
- pnpm
- Database PostgreSQL yang sedang berjalan

### Langkah-langkah

1.  **Masuk ke direktori server:**

    ```bash
    cd server
    ```

2.  **Install dependensi:**

    ```bash
    pnpm install
    ```

3.  **Setup Database:**

    - Salin `config/config.json.example` (jika ada) menjadi `config/config.json` dan sesuaikan dengan konfigurasi database Anda.
    - Buat database di PostgreSQL sesuai nama yang ada di `config.json`.
    - Jalankan migrasi untuk membuat semua tabel:
      ```bash
      pnpx sequelize-cli db:migrate
      ```
    - (Opsional) Isi data awal dengan seeder:
      ```bash
      pnpx sequelize-cli db:seed:all
      ```

4.  **Menjalankan dalam mode Development:**
    Server akan berjalan menggunakan `nodemon` dan otomatis restart saat ada perubahan file.

    ```bash
    pnpx nodemon app.js
    ```

5.  **Menjalankan dalam mode Production:**
    Aplikasi ini dirancang untuk dijalankan menggunakan **PM2**. Konfigurasi sudah ada di `client/ecosystem.config.cjs`. Untuk menjalankannya, dari direktori **root proyek**, jalankan:
    ```bash
    pm2 start client/ecosystem.config.cjs
    ```
    Ini akan memulai server Express, listener MQTT, dan layanan lainnya secara bersamaan.

## 7. Manajemen Database (Contoh Perintah)

Perintah-perintah ini berguna untuk backup dan restore database PostgreSQL Anda. Pastikan path ke `pg_dump.exe` dan `pg_restore.exe` sudah benar.

- **Backup Database:**

  ```bash
  "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" -U postgres -h localhost -p 5432 -F c -b -v -f dashboard_machine_backup.dump nama_database_anda
  ```

- **Restore Database:**
  ```bash
  "C:\Program Files\PostgreSQL\17\bin\pg_restore.exe" -U postgres -h localhost -p 5432 -d nama_database_tujuan -v nama_file_backup.dump
  ```
