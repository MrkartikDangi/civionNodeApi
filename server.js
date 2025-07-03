const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const morgan = require("morgan");
const indexAppRouter = require("./routes/app/index");
const db = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(morgan("dev"));

app.use(cors());

app.use((req, res, next) => {
  const allowedHost = [process.env.HOST];
  if (!allowedHost.includes(req.hostname)) {
    return res.status(403).send('Forbidden :: Invalid Host');
  }
  next();
});

app.use("/api", indexAppRouter);

app.get("/", (req, res) => {
  res.send("Api is working");
});

app.use((err, req, res, next) => {
  if (err.status !== 403) return next();
  res.send("403 error :: Invalid Token");
});

module.exports = app;
