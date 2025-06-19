const mqtt = require('mqtt')
const broker = process.env.MQTT_BROKER || "mqtt://localhost:1883";
const mqttClient = mqtt.connect(broker);

const MQTT_TOPICS = [
    "mc-1/data",
    "mc-2/data",
    "mc-3/data",
    "mc-4/data",
    "mc-5/data",
    "mc-6/data",
    "mc-7/data",
    "mc-8/data",
    "mc-9/data",
    "mc-10/data",
    "mc-11/data",
    "mc-12/data",
    "mc-13/data",
    "mc-14/data",
    "mc-15/data",
    "mc-16/data",
];

module.exports = {
    MQTT_TOPICS,
    mqttClient
};