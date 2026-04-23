
const COUNTRY_MAP = {
  nigeria: "NG",
  angola: "AO",
  kenya: "KE",
  benin: "BJ",
  tanzania: "TZ",
  // Add other ISO mappings as needed
};

export function parseNaturalLanguage(q) {
  const query = q.toLowerCase();
  const filters = {};

  // 1. Gender Parsing
  if (query.includes("male") && !query.includes("female"))
    filters.gender = "male";
  if (query.includes("female")) filters.gender = "female";
  if (query.includes("male") && query.includes("female")) delete filters.gender; // Both = all

  // 2. Age / "Young" Parsing
  if (query.includes("young")) {
    filters.min_age = 16;
    filters.max_age = 24;
  }

  // 3. Age Group Parsing
  if (query.includes("child")) filters.age_group = "child";
  if (query.includes("teenager")) filters.age_group = "teenager";
  if (query.includes("adult")) filters.age_group = "adult";
  if (query.includes("senior")) filters.age_group = "senior";

  // 4. Comparison Logic (above/below)
  const aboveMatch = query.match(/above\s+(\d+)/);
  if (aboveMatch) filters.min_age = parseInt(aboveMatch[1]) + 1;

  const belowMatch = query.match(/below\s+(\d+)/);
  if (belowMatch) filters.max_age = parseInt(belowMatch[1]) - 1;

  // 5. Country Parsing
  for (const [name, id] of Object.entries(COUNTRY_MAP)) {
    if (query.includes(name)) {
      filters.country_id = id;
      break;
    }
  }

  // Validation: If no filters were extracted at all
  if (Object.keys(filters).length === 0) return null;

  return filters;
}
