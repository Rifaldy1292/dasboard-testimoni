const express = require('express');
const mqtt = require('mqtt');

const app = express();
const port = 3000;

// Konfigurasi MQTT broker
const mqttBroker = 'mqtt://localhost:1883';
const mqttTopic = 'machines/status';


// Data awal mesin
let machines = Array.from({ length: 15 }, (_, i) => ({
    machineName: `mc-${i + 1}`,
    status: getRandomStatus()
}));

// Inisialisasi klien MQTT
const client = mqtt.connect(mqttBroker);
client.on('connect', () => {
    console.log('Connected to MQTT broker');
    client.publish(mqttTopic, JSON.stringify(machines));
    console.log('Data published to MQTT 22:', machines);
});


// Fungsi untuk mendapatkan status acak
function getRandomStatus() {
    const statuses = ['Running', 'Stopped'];
    return statuses[Math.floor(Math.random() * statuses.length)];
}


// Update status setiap 30 detik
setInterval(() => {
    machines = machines.map(machine => ({
        ...machine,
        status: getRandomStatus(),
    }));

    // Publikasikan data ke broker MQTT
    console.log('Data published to MQTT:', machines);
    client.publish(mqttTopic, JSON.stringify(machines));
}, 10 * 1000);


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
