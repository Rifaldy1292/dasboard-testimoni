// eslint-disable-next-line no-undef
module.exports = {
  apps: [
    {
      name: `vue-client`,
      script: 'serve',
      autorestart: true,
      watch: true,
      // cwd: './client', // Pastikan ini path yang benar jika PM2 dijalankan dari root proyek
      env: {
        PM2_SERVE_PATH: './dist',
        PM2_SERVE_PORT: 5173,
        PM2_SERVE_SPA: 'true',
        NODE_ENV: 'production'
      }
    },
    {
      name: 'express-server',
      script: 'node',
      args: 'app.js',
      cwd: '../server',
      autorestart: true, // Tambahkan ini agar server juga restart jika crash
      env: {
        NODE_ENV: 'production',
        PORT: 2222 // Pastikan Express Anda mendengarkan port ini
      }
    },
    {
      name: 'mqtt-broker',
      script: 'node',
      args: 'mqtt.js',
      cwd: '../server',
      autorestart: true,
    },
    {
      name: 'node-red',
      script: 'node',
      args: 'C:\\Users\\User\\AppData\\Local\\nvm\\v20.18.3\\node_modules\\node-red\\red.js',
      watch: true,
      autorestart: true,
      windowsHide: true,
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'ngrok-tunnel', // Nama proses Ngrok di PM2
      script: 'ngrok', // Cukup panggil 'ngrok' karena sudah di PATH
      args: [
        'http',
        '--domain=purely-certain-spider.ngrok-free.app', // Ganti dengan static domain Anda
        '2222' // Port yang ingin Anda terowongan (port Express server)
      ],
      autorestart: true, // Sangat disarankan agar tunnel otomatis restart jika putus
      // Jika ngrok.exe tidak ada di PATH, Anda harus memberikan path absolut:
      // script: 'C:\\ngrok\\ngrok.exe', // Contoh jika ngrok.exe ada di C:\ngrok
      // windowsHide: true, // Opsi untuk menyembunyikan jendela konsol ngrok di Windows
      // Jika Anda ingin ngrok tidak restart saat ada perubahan file di direktori, nonaktifkan watch
      // watch: false,
      // log_file: 'ngrok_pm2.log', // Opsi untuk menyimpan log ngrok ke file
      // env: {
      //   NGROK_AUTHTOKEN: 'YOUR_AUTH_TOKEN_HERE' // Tidak disarankan jika sudah di config.yml, tapi bisa juga di sini
      // }
    }
  ]
};