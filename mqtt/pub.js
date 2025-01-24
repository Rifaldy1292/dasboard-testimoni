const express = require('express');
const mqtt = require('mqtt');

const app = express();
const port = 3000;

// Konfigurasi MQTT broker
const mqttBroker = 'mqtt://localhost:1883';
const mqttTopic = 'machines/status';
// Inisialisasi klien MQTT
const client = mqtt.connect(mqttBroker);

// Data awal mesin
let machines = Array.from({ length: 15 }, (_, i) => ({
    name: `mc-${i + 1}`,
    // status: getRandomStatus()
    status: 'Running'
}));

// Fungsi untuk mendapatkan status acak
function getRandomStatus() {
    const statuses = ['Running', 'Stopped'];
    return statuses[Math.floor(Math.random() * statuses.length)];
}


client.on('connect', () => {
    console.log('Connected to MQTT broker');
    client.publish(mqttTopic, JSON.stringify(machines));
    console.log('Data published to MQTT 22:', machines);
});

// Update status setiap 30 detik
setInterval(() => {
    machines = machines.map(machine => ({
        ...machine,
        status: getRandomStatus(),
        // status: "Running"
    }));

    // Publikasikan data ke broker MQTT
    console.log('Data published to MQTT:', machines);
    client.publish(mqttTopic, JSON.stringify(machines));
    // per 30 menit
}, 1000 * 60 * 30);


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
