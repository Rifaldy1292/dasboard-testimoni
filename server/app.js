const express = require("express");
const app = express();
const cors = require("cors");
const Webscoket = require("ws");
const { PORT } = require("./config/config.env");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);

const router = require("./routes");
const handleWebsocket = require("./helpers/handleWebsocket");
app.use("/api", router);

// buat webscoket yang return {machineName: string, status: number}
const WSPORT = 3333;



const wss = new Webscoket.Server({ port: WSPORT });
wss.on("connection", (ws) => {
  console.log("Client connected");
  // Kirim response setiap 3 detik
  setInterval(() => {
    const result = handleWebsocket();
    ws.send(JSON.stringify(result));
  }, 3000); // 3000 milidetik = 3 detik
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
  console.log(`ws on port ${WSPORT}`);
});
