
# Profile Management & Natural Language Search API

A robust Express.js and PostgreSQL backend service designed to manage user profiles and provide advanced search capabilities using rule-based Natural Language Processing (NLP).

## Features
- **Strict Data Schema**: Built with UUID v7 primary keys and specific data constraints.
- **Idempotent Seeding**: Automatically seeds 2026 profiles from a JSON source on startup without creating duplicates.
- **Advanced Filtering**: Support for gender, age ranges, confidence scores, and location.
- **Natural Language Search**: Convert plain English queries like "young males from Nigeria" into structured database filters.
- **Scalable Pagination**: Performance-optimized pagination with a hard limit on result sizes.

---

## Technical Stack
- **Runtime**: Node.js (Express)
- **Database**: PostgreSQL
- **Driver**: `pg` (node-postgres)
- **Utilities**: `uuid` (for UUID v7 generation), `cors`, `body-parser`

---

## API Endpoints

### 1. Get All Profiles
`GET /api/profiles`

**Query Parameters:**
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `gender` | string | "male" or "female" |
| `age_group` | string | child, teenager, adult, senior |
| `country_id` | string | ISO 2-letter code |
| `min_age` | number | Minimum exact age |
| `max_age` | number | Maximum exact age |
| `min_gender_probability` | float | Confidence threshold |
| `sort_by` | string | age, created_at, gender_probability |
| `order` | string | asc, desc (default: desc) |
| `page` / `limit` | number | Pagination (limit max: 50) |

---

### 2. Natural Language Search
`GET /api/profiles/search?q=<query>`

**Supported Keywords & Mappings:**
- **Gender**: `male`, `female`
- **Age Ranges**: `young` (automatically maps to 16–24)
- **Age Groups**: `child`, `teenager`, `adult`, `senior`
- **Comparison**: `above [number]`, `below [number]`
- **Geography**: Recognizes full country names (e.g., "Nigeria", "Kenya") and maps them to ISO codes.

---

## Natural Language Parsing Approach

The search engine utilizes a **Rule-Based Tokenization** strategy rather than AI or LLMs to ensure high performance and deterministic results.

1.  **Normalization**: The input query is converted to lowercase to ensure case-insensitivity.
2.  **Keyword Extraction**: The parser scans the string for predefined tokens (e.g., "young", "female").
3.  **Regex Matching**: Specific patterns are used to extract numerical values following operators like "above" or "below".
4.  **ISO Mapping**: A static dictionary maps common country names to their respective `country_id` (ISO 3166-1 alpha-2).
5.  **Filter Aggregation**: Extracted tokens are converted into a structured filter object, which is then dynamically injected into a PostgreSQL `WHERE` clause using parameterized queries to prevent SQL injection.

### Limitations
- **Negation**: The parser does not currently support negative filters (e.g., "not from Nigeria").
- **Spelling**: Requires exact matches for keywords (no fuzzy matching).
- **Ambiguity**: If multiple contradictory age groups are mentioned, the last one detected typically takes precedence.
- **Complex Ranges**: Does not support "between X and Y" syntax unless explicitly defined.

---

## Setup & Installation

1. **Database Setup**: Ensure PostgreSQL is running and create a database.
2. **Environment Variables**: Configure your credentials in your connection pool.
3. **Install Dependencies**:

   ```bash
   npm install
4. **Run Application**:

   ```bash
   node index.js
The server will automatically create the profiles table and seed the data on the first run.