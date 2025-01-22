const express = require("express");
const app = express();
const cors = require("cors");
const WebSocket = require("ws");
const mqtt = require('mqtt');
const { PORT } = require("./config/config.env");

const WSPORT = 3333;
const mqttClient = mqtt.connect('mqtt://localhost:1883');
const wss = new WebSocket.Server({ port: WSPORT });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);

const router = require("./routes");
app.use("/api", router);

// buat WebSocket yang return {machineName: string, status: number}

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Ketika ada pesan dari WebSocket, kirim ke semua klien
  ws.on('message', (message) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});

mqttClient.on('connect', () => {
  console.log('MQTT client connected');
  mqttClient.subscribe('machines/status');
});

mqttClient.on('message', (topic, message) => {
  // Ketika ada pesan MQTT, siarkan ke semua klien WebSocket
  console.log('Client connected', message.toString());
  wss.clients.forEach((client) => {
    const parseMessage = JSON.parse(message.toString());
    const running = Math.floor(Math.random() * 100);
    const formattedMessage = parseMessage.map((item) => ({
      ...item,
      percentage: [running, 100 - running],
    }))
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(formattedMessage));
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
  console.log(`ws on port ${WSPORT}`);
});
