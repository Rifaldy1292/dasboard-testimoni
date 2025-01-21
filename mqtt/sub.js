const express = require('express')
const mqtt = require('mqtt');

const app = express();
const port = 4000;

const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', () => {
    console.log('Connected to MQTT broker');
    client.subscribe('machines/status');
});

client.on('message', (topic, message) => {
    console.log(`Received message on topic ${topic}: ${message.toString()}`);
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});