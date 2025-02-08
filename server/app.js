const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const mqtt = require('mqtt');
const { PORT } = require("./config/config.env");
const path = require('path');
const { createServer } = require('http')
const handleWebsocket = require("./websocket/");
const handleMqtt = require("./mqtt/handleMqtt");
const router = require("./routes");


const app = express();
const server = createServer(app)

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);

const wss = new WebSocket.Server({ server });
handleWebsocket(wss)

const mqttClient = mqtt.connect('mqtt://localhost:1883');
handleMqtt(mqttClient, wss)


app.use("/api", router);

server.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});

