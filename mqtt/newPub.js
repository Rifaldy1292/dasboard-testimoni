const express = require('express');
const mqtt = require('mqtt');

const app = express();
const port = 3000;

// Konfigurasi MQTT broker
const mqttBroker = 'mqtt://localhost:1883';
const mqttTopics = [
    'mc-1/data',
    'mc-2/data',
    'mc-3/data', 'mc-4/data', 'mc-5/data', 'mc-6/data', 'mc-7/data', 'mc-8/data', 'mc-9/data', 'mc-10/data', 'mc-11/data', 'mc-12/data', 'mc-13/data', 'mc-14/data', 'mc-15/data', 'mc-16/data'
];
// Inisialisasi klien MQTT
const client = mqtt.connect(mqttBroker);

// Fungsi untuk mendapatkan status acak
function getRandomStatus() {
    const statuses = ['Running', 'Stopped'];
    return statuses[Math.floor(Math.random() * statuses.length)];
    // return statuses[1];
}

const pubMessage = () => {
    mqttTopics.forEach((topic, index) => {
        const machineName = topic.replaceAll('/data', '').toUpperCase()
        const message = {
            name: machineName,
            status: getRandomStatus(),
            ipAddress: '38.0.101.76',
            // status: 'Running'
        }
        // delay 90 detik
        setTimeout(() => {
            client.publish(topic, JSON.stringify(message));
            // console.log({ message }, 222)
        }, 90 * index);

        // client.publish(topic, JSON.stringify(message));  
        console.log({ message })
    });
}
client.on('connect', () => {
    console.log('Connected to MQTT broker');
    // Publish message
    pubMessage();
});

setInterval(() => {
    pubMessage();
    // 17 menit
}, 1000 * 60 * 17);
// }, 1000 * 1);



app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});