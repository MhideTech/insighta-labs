import pool from "../database/db.js";

const getProfiles = async (req, res) => {
  try {
    const {
      gender,
      age_group,
      country_id,
      min_age,
      max_age,
      min_gender_probability,
      min_country_probability,
      sort_by = "created_at",
      order = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    // 1. Setup Pagination
    const pageSize = Math.min(parseInt(limit), 50); // Hard cap at 50
    const offset = (parseInt(page) - 1) * pageSize;

    // 2. Build Dynamic Filters
    let conditions = [];
    let values = [];

    const addFilter = (column, value, operator = "=") => {
      if (value !== undefined && value !== null) {
        values.push(value);
        conditions.push(`${column} ${operator} $${values.length}`);
      }
    };

    addFilter("gender", gender);
    addFilter("age_group", age_group);
    addFilter("country_id", country_id);
    addFilter("age", min_age, ">=");
    addFilter("age", max_age, "<=");
    addFilter("gender_probability", min_gender_probability, ">=");
    addFilter("country_probability", min_country_probability, ">=");

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // 3. Validate Sorting (Prevent SQL Injection on column names)
    const allowedSortCols = ["age", "created_at", "gender_probability"];
    const validSortBy = allowedSortCols.includes(sort_by)
      ? sort_by
      : "created_at";
    const validOrder = order.toLowerCase() === "asc" ? "ASC" : "DESC";

    // 4. Execute Queries
    // We run the count and the data query to get the "total" for pagination
    const countQuery = `SELECT COUNT(*) FROM profiles ${whereClause}`;
    const dataQuery = `
            SELECT * FROM profiles 
            ${whereClause} 
            ORDER BY ${validSortBy} ${validOrder} 
            LIMIT ${pageSize} OFFSET ${offset}
        `;

    const [countRes, dataRes] = await Promise.all([
      pool.query(countQuery, values),
      pool.query(dataQuery, values),
    ]);

    const total = parseInt(countRes.rows[0].count);

    // 5. Success Response
    return res.status(200).json({
      status: "success",
      page: parseInt(page),
      limit: pageSize,
      total,
      data: dataRes.rows,
    });
  } catch (err) {
    console.error("Error fetching profiles:", err.message);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
};

export default getProfiles;
