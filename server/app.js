const express = require("express");
const app = express();
const cors = require("cors");
const WebSocket = require("ws");
const mqtt = require('mqtt');
const { PORT } = require("./config/config.env");
const { Machine, MachineLog } = require("./models");


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

let bulkCreateMachine = false

mqttClient.on('connect', async () => {
  console.log('MQTT client connected');
  mqttClient.subscribe('machines/status');
  try {
    const machineCount = await Machine.count();
    if (machineCount === 0) {
      bulkCreateMachine = true
    }
  } catch (error) {

  }
});

mqttClient.on('message', async (topic, message) => {
  // Ketika ada pesan MQTT, siarkan ke semua klien WebSocket
  const parseMachine = JSON.parse(message.toString());
  if (parseMachine) {
    // console.log(parseMachine, 'message')
    console.time('Proses');
    try {
      // performance optimization


      if (bulkCreateMachine) {
        await Machine.bulkCreate(parseMachine);
        bulkCreateMachine = false
      }

      await Promise.all(parseMachine.map(async (item) => {
        const { name, status } = item
        const machine = await Machine.findOne({ where: { name } });

        if (machine) {

          if (machine.status !== status) {
            await MachineLog.create({
              machine_id: machine.id,
              previous_status: machine.status,
              current_status: status,
              timestamp: new Date()
            })
          }
          machine.status = status
          await machine.save()

        }

      }))
    } catch (error) {
      console.log(error)
    }
    console.timeEnd('Proses');



  }
  wss.clients.forEach((client) => {

    const formattedMessage = parseMachine.map((item) => {
      const running = Math.floor(Math.random() * 100);
      return {
        ...item,
        percentage: [running, 100 - running],
      };
    });


    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(formattedMessage));
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
  console.log(`ws on port ${WSPORT}`);
});
