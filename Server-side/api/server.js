const express = require("express");
const mongoose = require("mongoose");
var history = require("connect-history-api-fallback");

const https = require("httpolyglot");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const options = {
  key: fs.readFileSync(path.join(__dirname, "../ssl/key.pem"), "utf-8"),
  cert: fs.readFileSync(path.join(__dirname, "../ssl/cert.pem"), "utf-8"),
};

//const http = require('http')
const app = express(history());
//const server = http.createServer(app)

const httpsServer = https.createServer(options, app);
app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST"],
    })
  );

const port = 5000;
const url = "mongodb://localhost:27017/mydb";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("uploads"));
mongoose.set("strictQuery", true);

let localIp = "127.0.0.1";

mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to the database"))
  .catch((err) => console.log(err));

app.use("/api/user", require("./routes/routes.js"));

httpsServer.listen(port, () => {
  console.log("Listening on https://" + localIp + ":" + port);
});
