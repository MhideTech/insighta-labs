import { Pool } from "pg";
import fs from "fs";
import { v7 as uuidv7 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

// Create a new pool
const pool = new Pool({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PORT,
  connectionString: process.env.connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Create profile table query
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS profiles (
      id UUID PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
      gender_probability FLOAT8,
      age INT,
      age_group VARCHAR(20) CHECK (age_group IN ('child', 'teenager', 'adult', 'senior')),
      country_id CHAR(2),
      country_name VARCHAR(100),
      country_probability FLOAT8,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

// Initialize database
export const initDb = async () => {
  try {
    await pool.query(createTableQuery);
    console.log("Table 'profiles' is ready!");
  } catch (err) {
    console.error("Error creating table:", err.stack);
  } finally {
  }
};

// Seed json data into database
export async function seedDatabase() {
  try {
    const rawData = fs.readFileSync("seed_profiles.json", "utf8");
    let jsonData = JSON.parse(rawData);

    // 1. DATA VALIDATION: Find the array
    let profilesArray = Array.isArray(jsonData)
      ? jsonData
      : jsonData.profiles || [];

    console.log(`Attempting to seed ${profilesArray.length} profiles...`);

    // Add required UUID v7 to each object
    const profilesWithIds = profilesArray.map((profile) => ({
      id: uuidv7(),
      ...profile,
    }));

    // Convert the JSON string into a recordset that Postgres can read
    const seedQuery = `
            INSERT INTO profiles (
                id, name, gender, gender_probability, age, 
                age_group, country_id, country_name, country_probability
            )
            SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(
                id UUID, 
                name VARCHAR, 
                gender VARCHAR, 
                gender_probability FLOAT8, 
                age INT, 
                age_group VARCHAR, 
                country_id VARCHAR, 
                country_name VARCHAR, 
                country_probability FLOAT8
            )
            ON CONFLICT (name) DO NOTHING;
        `;

    // 3. Execute with the JSON data as a single parameter
    const res = await pool.query(seedQuery, [JSON.stringify(profilesWithIds)]);

    console.log(`Seeding complete. Rows affected: ${res.rowCount}`);
  } catch (err) {
    console.error("Seeding failed:", err.message);
  }
}

export default pool;
