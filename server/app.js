const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const mqtt = require('mqtt');
const { PORT } = require("./config/config.env");
const { Machine, MachineLog } = require("./models");
const path = require('path');
const { createServer } = require('http')
const { percentage, totalHour } = require("./utils/countHour")
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
app.use("/api", router);

server.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});

const mqttClient = mqtt.connect('mqtt://localhost:1883');
const mqttTopics = ['mc-1/data', 'mc-2/data', 'mc-3/data', 'mc-4/data', 'mc-5/data', 'mc-6/data', 'mc-7/data', 'mc-8/data', 'mc-9/data', 'mc-10/data', 'mc-11/data', 'mc-12/data', 'mc-13/data', 'mc-14/data', 'mc-15/data'];
const perfectTime = 24 //hour

// runningHour = miliseconds
function getRunningHours(runningHour) {
  return percentage(runningHour, perfectTime)
}

function countDescription(totalRunningHours) {
  const count = totalHour(totalRunningHours)
  const hour = count.split('.')[0]
  const minute = count.split('.')[1]
  return `${hour} hour ${minute} minute / ${perfectTime} hour`
}

// day or month, default day
let type = 'day'


wss.on('connection', (ws) => {
  // console.log('Client connected');

  ws.on('message', (message) => {
    console.log({ message: JSON.parse(message) })
    const { type } = JSON.parse(message)
    if (type === 'month') {
      ws.send(JSON.stringify({ message: 'aakkmkmk' }))
    }
  })
});


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
    console.error(error)
  }

  wss.clients.forEach(async (client) => {
    if (client.readyState === WebSocket.OPEN) {
      const machines = await Machine.findAll({
        attributes: ['name', 'status', 'total_running_hours']
      });
      const formattedMessage =
        machines.map(machine => {
          const runningTime = getRunningHours(machine.total_running_hours)
          // const running = Math.floor(Math.random() * 100);
          return {
            name: machine.name,
            status: machine.status,
            // percentage: [runningTime, 100 - runningTime],/
            percentage: [runningTime, 100 - runningTime],
            description: countDescription(machine.total_running_hours),
          }
        }).sort((a, b) => {
          const numberA = parseInt(a.name.slice(3))
          const numberB = parseInt(b.name.slice(3))
          return numberA - numberB
        })

      client.send(JSON.stringify({ type: 'percentage', data: formattedMessage }));
    }
  });
  console.timeEnd('Proses');

});

