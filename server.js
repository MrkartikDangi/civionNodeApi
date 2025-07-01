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

// Serve static files from the 'uploads' folder
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(cors());

app.use("/api", indexAppRouter);

app.get("/", (req, res) => {
  res.send("Api is working");
});

app.use((err, req, res, next) => {
  if (err.status !== 403) return next();
  res.send("403 error :: Invalid Token");
});

module.exports = app;
