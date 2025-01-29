const express = require("express");
const app = express();
const cors = require("cors");
const WebSocket = require("ws");
const mqtt = require('mqtt');
const { PORT } = require("./config/config.env");
const { Machine, MachineLog } = require("./models");

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

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
  console.log(`ws on port ${WSPORT}`);
});

const WSPORT = 3333;
const mqttClient = mqtt.connect('mqtt://localhost:1883');
const wss = new WebSocket.Server({ port: WSPORT });
const mqttTopics = ['mc-1/data', 'mc-2/data', 'mc-3/data', 'mc-4/data', 'mc-5/data', 'mc-6/data', 'mc-7/data', 'mc-8/data', 'mc-9/data', 'mc-10/data', 'mc-11/data', 'mc-12/data', 'mc-13/data', 'mc-14/data', 'mc-15/data'];
const perfectTime = 24 //hour
const totalMachine = 15

const { percentage, totalHour } = require("./utils/countHour")
const { getRunningTime, getRunningTimeMonth } = require("./utils/getRunningTime");

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


wss.on('connection', async (ws) => {
  console.log('Client connected');

  // send default data(day)
  const machineCount = await Machine.count();
  wss.clients.forEach(async (client) => {
    // console.log(client.readyState === WebSocket.OPEN && machineCount !== 0)
    if (client.readyState === WebSocket.OPEN && machineCount !== 0) {
      const machines = await Machine.findAll({
        attributes: ['name', 'status', 'total_running_hours']
      });

      const formattedMessage =
        machines.map(machine => {
          const runningTime = getRunningHours(machine.total_running_hours)
          return {
            name: machine.name,
            status: machine.status,
            percentage: [runningTime, 100 - runningTime],
            description: countDescription(machine.total_running_hours),
          }
        })

      client.send(JSON.stringify(formattedMessage));
    }
  });

  ws.on('message', async (message) => {
    const parse = JSON.parse(message)
    type = parse.type
    // console.log({ parse })
    if (type === 'month') {
      const { data, error } = await getRunningTimeMonth()
      if (!error) {
        console.log(data, 'data from month')
      }
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
    // await Machine.update({
    //   status: parseMessage.status,
    //   total_running_hours: runningHour
    // }, {
    //   where: {
    //     id: existMachine.id
    //   }
    // })

    // console.log({ existMachine }, 22)


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
        })
      client.send(JSON.stringify(formattedMessage));
    }
  });
  console.timeEnd('Proses');

});

