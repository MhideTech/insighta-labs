import express from "express";
import cors from "cors";
import { Pool } from "pg";
import bodyParser from "body-parser";
import pool, { initDb, seedDatabase } from "./database/db.js";
import getProfiles from "./controllers/getProfileController.js";
import { searchProfiles } from "./controllers/searchController.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );
  next();
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.route("/api/profiles").get(getProfiles);
app.get("/api/profiles/search", searchProfiles);

pool
  .connect()
  .then(async () => {
    console.log("Connected to Postgres");
    await initDb();
    // Run migrations and seeds
    await seedDatabase();

    app.listen(3000, () => {
      console.log("Server running on port 3000");
    });
  })
  .catch((err) => console.error("Connection error", err.stack));
