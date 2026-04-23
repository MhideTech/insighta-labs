import { parseNaturalLanguage } from "../utils/nlp.js";
import pool from "../database/db.js";

export const searchProfiles = async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;

  // Basic validation
  if (!q || q.trim() === "") {
    return res
      .status(400)
      .json({ status: "error", message: "Missing or empty parameter" });
  }

  // NLP Parsing
  const filters = parseNaturalLanguage(q);
  if (!filters) {
    return res
      .status(400)
      .json({ status: "error", message: "Unable to interpret query" });
  }

  try {
    const pageSize = Math.min(parseInt(limit), 50);
    const offset = (parseInt(page) - 1) * pageSize;

    // 1. Build the dynamic WHERE clause
    let conditions = [];
    let values = [];

    // Helper to add filters from the NLP object
    const addFilter = (col, val, op = "=") => {
      if (val !== undefined) {
        values.push(val);
        conditions.push(`${col} ${op} $${values.length}`);
      }
    };

    addFilter("gender", filters.gender);
    addFilter("age_group", filters.age_group);
    addFilter("country_id", filters.country_id);
    addFilter("age", filters.min_age, ">=");
    addFilter("age", filters.max_age, "<=");

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // 2. The Queries
    const countQuery = `SELECT COUNT(*) FROM profiles ${whereClause}`;
    const dataQuery = `
      SELECT * FROM profiles 
      ${whereClause} 
      ORDER BY created_at DESC 
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    // 3. Execute
    const [countRes, dataRes] = await Promise.all([
      pool.query(countQuery, values),
      pool.query(dataQuery, values),
    ]);

    const total = parseInt(countRes.rows[0].count);
    const rows = dataRes.rows;

    // 4. Success Response
    return res.status(200).json({
      status: "success",
      page: parseInt(page),
      limit: pageSize,
      total: total,
      data: rows,
    });
  } catch (err) {
    // Log the actual error to your terminal so you can see what went wrong!
    console.error("Database Error:", err);
    return res.status(500).json({ status: "error", message: "Server failure" });
  }
};
