const express = require("express");
const app = express();
const cors = require("cors");
const { PORT } = require("./config/config.env");

app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
}));

const router = require("./routes");
app.use("/api", router);

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});