const express = require('express');
const mqtt = require('mqtt');

const app = express();
const port = 3000;

// Konfigurasi MQTT broker
const mqttBroker = 'mqtt://localhost:1883'; // Ganti dengan broker MQTT yang Anda gunakan
const mqttTopic = 'machines/status';

// Inisialisasi klien MQTT
const client = mqtt.connect(mqttBroker);

client.on('connect', () => {
    console.log('Connected to MQTT broker');
});

// Data awal mesin
let machines = Array.from({ length: 15 }, (_, i) => ({
    machineName: `mc-${i + 1}`,
    status: getRandomStatus()
}));

// Fungsi untuk mendapatkan status acak
function getRandomStatus() {
    const statuses = ['Running', 'Stopped'];
    return statuses[Math.floor(Math.random() * statuses.length)];
}

// Update status setiap 30 detik
setInterval(() => {
    machines = machines.map(machine => ({
        ...machine,
        status: getRandomStatus()
    }));

    // Publikasikan data ke broker MQTT
    client.publish(mqttTopic, JSON.stringify(machines));
    console.log('Data published to MQTT:', machines);
}, 30000);

// Endpoint HTTP untuk mendapatkan data mesin
app.get('/machines', (req, res) => {
    res.json(machines);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
