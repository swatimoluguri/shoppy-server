const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { connectToDb, startServer } = require("./db");
const Routes = require("./routes");
require("dotenv").config();
const { PORT } = process.env;

const app = express();

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

//connections
(async () => {
  try {
    await connectToDb();
    await startServer(app, PORT);
  } catch (err) {
    process.exit(1);
  }
})();

//routes
app.use("/", Routes);
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

module.exports = app;
