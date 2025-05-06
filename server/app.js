const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const path = require("path");
const { createServer } = require("http");
const { PORT } = require("./config/config.env");
const handleMqtt = require("./mqtt/handleMqtt");
const router = require("./routes");
const { handleWebsocket } = require("./websocket/handleWebsocket");
const handleCronJob = require("./helpers/cronjob");

const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);

app.use("/api", router);
(async () => {
  await handleCronJob();
})();
handleWebsocket(wss);
handleMqtt(wss);

server.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
