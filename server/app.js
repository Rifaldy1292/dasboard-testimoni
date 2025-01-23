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
const perfectTime = 0.50
const totalMachine = 15


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);


const router = require("./routes");
const getRunningTime = require("./utils/getRunningTime");
app.use("/api", router);


let machineCount = 0

wss.on('connection', (ws) => {
  console.log('Client connected');

  // send default data
  wss.clients.forEach(async (client) => {
    if (client.readyState === WebSocket.OPEN && machineCount !== 0) {
      const machines = await Machine.findAll({
        attributes: ['name', 'status', 'total_running_hours']
      });

      const formattedMessage =
        machines.map(machine => {
          const runningTime = (machine.total_running_hours / perfectTime) * 100
          return {
            name: machine.name,
            status: machine.status,
            percentage: [runningTime, 100 - runningTime],
          }
        })

      client.send(JSON.stringify(formattedMessage));
    }
  });
});

let bulkCreateMachine = false

mqttClient.on('connect', async () => {
  console.log('MQTT client connected');
  mqttClient.subscribe('machines/status');
  try {
    machineCount = await Machine.count();
    if (machineCount === 0) {
      bulkCreateMachine = true
    }

  } catch (error) {
    console.error(error)
  }
});

mqttClient.on('message', async (topic, message) => {
  console.time('Proses');
  if (!message) {
    console.log('no message')
  }
  // Ketika ada pesan MQTT, siarkan ke semua klien WebSocket
  const parseMachine = JSON.parse(message.toString());
  if (parseMachine) {
    // console.log(parseMachine, 'message')
    try {
      // performance optimization
      // create machine first
      if (bulkCreateMachine) {
        await Machine.bulkCreate(parseMachine);
        bulkCreateMachine = false
      }



      const logCount = await MachineLog.count();
      await Promise.all(parseMachine.map(async (item) => {
        const { name, status } = item
        const machine = await Machine.findOne({ where: { name } });
        if (machine) {
          // create machine log
          if (machine.status !== status || logCount < totalMachine) {
            await MachineLog.create({
              machine_id: machine.id,
              previous_status: machine.status,
              current_status: status,
              timestamp: new Date()
            })
          }

          const runningHour = await getRunningTime(machine.id)
          machine.total_running_hours = runningHour
          // update machine status from previous to current status
          // await machine.update({ total_running_hours: runningHour })
          machine.status = status
          await machine.save()

        } else {
          console.log('machine not found')
        }

      }))
    } catch (error) {
      console.log(error)
    }
  }

  wss.clients.forEach(async (client) => {
    const machines = await Machine.findAll({
      attributes: ['name', 'status', 'total_running_hours']
    });

    const formattedMessage =
      machines.map(machine => {
        const runningTime = Math.round((machine.total_running_hours / perfectTime) * 100)
        // const running = Math.floor(Math.random() * 100);
        return {
          name: machine.name,
          status: machine.status,
          percentage: [runningTime, 100 - runningTime]
        }
      })

    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(formattedMessage));
    }
  });

  // const test = await Machine.count()
  // console.log(test, 'test')
  console.log({ machineCount })
  console.timeEnd('Proses');

});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
  console.log(`ws on port ${WSPORT}`);
});
