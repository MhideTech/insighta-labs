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

const startServer = async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Successfully connected to external Postgres");
    client.release();

    await initDb();
    await seedDatabase();

    app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
      console.log(`🚀 Server spinning on port ${process.env.PORT || 3000}`);
    });
  } catch (err) {
    console.error("❌ CRITICAL: Could not connect to DB", err.message);
    process.exit(1);
  }
};

startServer();