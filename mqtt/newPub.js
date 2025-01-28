const express = require('express');
const mqtt = require('mqtt');

const app = express();
const port = 3000;

// Konfigurasi MQTT broker
const mqttBroker = 'mqtt://localhost:1883';
const mqttTopics = ['mc-1/data', 'mc-2/data', 'mc-3/data', 'mc-4/data', 'mc-5/data', 'mc-6/data', 'mc-7/data', 'mc-8/data', 'mc-9/data', 'mc-10/data', 'mc-11/data', 'mc-12/data', 'mc-13/data', 'mc-14/data', 'mc-15/data'];
// Inisialisasi klien MQTT
const client = mqtt.connect(mqttBroker);

// Fungsi untuk mendapatkan status acak
function getRandomStatus() {
    const statuses = ['Running', 'Stopped'];
    return statuses[Math.floor(Math.random() * statuses.length)];
}
client.on('connect', () => {
    console.log('Connected to MQTT broker');

    mqttTopics.forEach(topic => {
        const machineName = topic.replaceAll('/data', '')
        const message = {
            name: machineName,
            status: getRandomStatus()
            // status: 'Running'
        }
        client.publish(topic, JSON.stringify(message));
        console.log({ message })
    });
});

// Update status setiap 30 detik
setInterval(() => {
    mqttTopics.forEach(topic => {
        const machineName = topic.replaceAll('/data', '')
        const message = {
            name: machineName,
            status: getRandomStatus()
            // status: 'Running'
        }
        client.publish(topic, JSON.stringify(message));
        console.log({ message })
    });
}, 1000 * 3);
// }, 1000 * 5);



app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});