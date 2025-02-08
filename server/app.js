const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const mqtt = require('mqtt');
const { PORT } = require("./config/config.env");
const { Machine, MachineLog } = require("./models");
const path = require('path');
const { createServer } = require('http')
const { getRunningTime, getRunningTimeMonth } = require("./utils/getRunningTime");
const handleWebsocket = require("./websocket/");


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

const router = require("./routes");
const MachineWebsocket = require("./websocket/machine");
app.use("/api", router);

server.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});

const mqttClient = mqtt.connect('mqtt://localhost:1883');
const mqttTopics = ['mc-1/data', 'mc-2/data', 'mc-3/data', 'mc-4/data', 'mc-5/data', 'mc-6/data', 'mc-7/data', 'mc-8/data', 'mc-9/data', 'mc-10/data', 'mc-11/data', 'mc-12/data', 'mc-13/data', 'mc-14/data', 'mc-15/data'];

mqttClient.on('connect', async () => {
  console.log('MQTT client connected');
  mqttTopics.forEach(topic => {
    mqttClient.subscribe(topic);
  })
});

mqttClient.on('message', async (topic, message) => {
  console.time('Proses');
  try {
    const parseMessage = JSON.parse(message.toString());
    const existMachine = await Machine.findOne({ where: { name: parseMessage.name } });
    // if (existMachine !== null) console.log({ existMachine, id: existMachine.Machine })
    // create machine & log first
    if (existMachine === null) {
      const createMachine = await Machine.create({
        name: parseMessage.name,
        status: parseMessage.status
      })

      return await MachineLog.create({
        machine_id: createMachine.id,
        current_status: createMachine.status,
        timestamp: new Date()
      })
    }

    if (existMachine.status !== parseMessage.status) {
      await MachineLog.create({
        machine_id: existMachine.id,
        previous_status: existMachine.status,
        current_status: parseMessage.status,
        timestamp: new Date()
      })
    }

    const runningHour = await getRunningTime(existMachine.id)
    existMachine.total_running_hours = runningHour
    existMachine.status = parseMessage.status

    await existMachine.save()


  } catch (error) {
    console.error({ error, message: error.message })
  }

  wss.clients.forEach(async (client) => {
    if (client.readyState === WebSocket.OPEN) {
      MachineWebsocket.timelines(client)
      MachineWebsocket.percentages(client)
    }
  });
  console.timeEnd('Proses');

});

