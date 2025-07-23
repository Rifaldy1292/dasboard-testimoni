# Dokumentasi Alur Data Real-time Menggunakan MQTT dan WebSocket

Dokumen ini menjelaskan bagaimana data dari mesin fisik dapat ditampilkan secara *real-time* di dasbor antarmuka pengguna (UI) menggunakan protokol MQTT dan WebSocket.

## Diagram Alur Data

```
+-----------------+      +----------------+      +---------------------+      +----------------------+      +-----------------+
| Mesin Fisik /   |----->|  MQTT Broker   |----->|   Node.js Server    |----->|   Node.js Server     |----->|   UI/Dashboard  |
| Sensor (Pabrik) | (1)  | (e.g.Mosquitto)| (2)  | (Subscriber Status) | (3)  | (WebSocket Handler)  | (4)  |   (Vue.js)      |
+-----------------+      +----------------+      +---------------------+      +----------------------+      +-----------------+
       |                                                 |                            ^
       |                                                 |                            |
       | Pesan Status:                                   | Notifikasi Update:         | (5) Kirim data baru
       | {                                               | "machine/update"           |     via WebSocket
       |   "name": "mc-1",                               |                            |
       |   "status": "Running",                          |                            |
       |   "transfer_file_id": 123                       |                            |
       | }                                               +----------------------------+
       |                                                      (Internal MQTT Bus)
       |
       +------------------------------------------------------------------------------------------------------>
```

## Komponen Utama

1.  **`server/mqtt.js` & `server/mqtt/MachineMqtt.js`**: Bertanggung jawab untuk menerima data langsung dari mesin melalui MQTT.
2.  **`server/websocket/handleWebsocket.js`**: Bertanggung jawab untuk mengelola koneksi dengan klien (browser) dan mengirimkan pembaruan data melalui WebSocket.
3.  **`server/cache/index.js` (MachineCache)**: Cache di dalam memori untuk menyimpan status terakhir dari setiap mesin. Tujuannya adalah untuk mengurangi kueri ke database dan dengan cepat mendeteksi perubahan status.
4.  **`server/cache/userMessageCache.js`**: Cache yang menyimpan preferensi setiap klien WebSocket yang terhubung. Misalnya, klien A sedang melihat data *timeline* untuk hari ini, sedangkan klien B sedang melihat data *persentase* bulanan.
5.  **MQTT Broker**: Perangkat lunak perantara (seperti Mosquitto) yang menangani pengiriman dan penerimaan pesan MQTT.

## Langkah-langkah Alur Data

### 1. Pengiriman Data dari Mesin

-   Setiap mesin di lantai produksi (atau simulatornya) dikonfigurasi untuk mengirim pesan MQTT ke **MQTT Broker** setiap kali ada perubahan status (misalnya, dari `Stopped` menjadi `Running`).
-   Pesan ini dikirim ke topik tertentu, misalnya `machine/status/mc-1`.
-   Payload pesan berisi informasi penting seperti nama mesin, status baru, dan `transfer_file_id` yang mengacu pada pekerjaan yang sedang berjalan.

### 2. Penerimaan Data oleh Server (MQTT Subscriber)

-   File `server/mqtt.js` menginisialisasi klien MQTT yang berlangganan (*subscribe*) ke topik status dari semua mesin (misalnya `machine/status/+`).
-   Ketika pesan baru masuk, fungsi di dalam `server/mqtt/MachineMqtt.js` dieksekusi.
-   **Pengecekan Cache**: Server pertama-tama memeriksa `machineCache` untuk membandingkan status baru dengan status yang tersimpan. Jika tidak ada perubahan, proses berhenti di sini untuk efisiensi.
-   **Pencatatan & Pembaruan**: Jika ada perubahan status:
    1.  Server mengambil detail pekerjaan dari database menggunakan `transfer_file_id`.
    2.  Sebuah log baru disimpan ke dalam tabel `MachineLog` di database untuk mencatat histori perubahan.
    3.  `machineCache` diperbarui dengan status terbaru.
    4.  **Langkah Kunci**: Server menerbitkan (*publish*) pesan notifikasi sederhana ke topik MQTT *internal*, yaitu `"machine/update"`. Pesan ini hanya berfungsi sebagai sinyal bahwa "ada sesuatu yang baru".

### 3. Jembatan dari MQTT ke WebSocket

-   Di dalam `server/websocket/handleWebsocket.js`, ada klien MQTT lain yang secara khusus berlangganan (*subscribe*) ke topik internal `"machine/update"`.
-   Ketika notifikasi diterima dari langkah sebelumnya, kode di dalam *handler* ini akan terpicu.

### 4. Pengiriman Pembaruan ke Klien (UI/Dashboard)

-   Setelah menerima notifikasi `"machine/update"`, server *tidak* langsung mengirim data mentah. Sebaliknya, ia melakukan hal berikut:
    1.  Server melakukan iterasi melalui semua klien WebSocket yang sedang terhubung.
    2.  Untuk setiap klien, server memeriksa `userMessageCache` untuk mengetahui data apa yang sedang dilihat oleh klien tersebut (misalnya, *timeline* hari ini, shift 1).
    3.  **Filter Cerdas**: Server hanya akan memproses lebih lanjut jika pembaruan relevan dengan apa yang sedang dilihat klien. Misalnya, jika klien melihat data kemarin, ia tidak akan menerima pembaruan *real-time* untuk hari ini.
    4.  **Pengambilan Data Baru**: Jika relevan, server akan menjalankan kembali fungsi untuk mengambil data yang sudah diformat dari database (misalnya `MachineWebsocket.timelines` atau `MachineWebsocket.percentages`).
    5.  Data yang baru dan segar ini kemudian dikirim langsung ke klien yang bersangkutan melalui koneksi WebSocket yang ada.

### 5. Pembaruan Antarmuka Pengguna (UI)

-   Aplikasi frontend (Vue.js) memiliki *listener* WebSocket yang siaga.
-   Ketika pesan baru masuk dari server, frontend akan memperbarui komponen yang relevan (grafik, tabel, dll.) dengan data baru tersebut, sehingga pengguna melihat perubahan secara instan tanpa perlu me-refresh halaman.

## Kesimpulan

Arsitektur ini secara efektif memisahkan antara proses penerimaan data dari mesin (yang bisa sangat sering) dengan proses pengiriman data ke klien. Penggunaan topik MQTT internal (`machine/update`) sebagai "bus notifikasi" dan cache preferensi klien memastikan bahwa pembaruan dikirim secara efisien hanya kepada klien yang membutuhkannya, sehingga menghemat sumber daya server dan jaringan.
