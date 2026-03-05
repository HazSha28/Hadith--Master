
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT || 5432,
});

async function check() {
    try {
        const queries = [
            "tell me about honesty",
            "what is the importance of prayer",
            "honesty"
        ];

        for (const q of queries) {
            const res = await pool.query("SELECT plainto_tsquery('english', $1) as q", [q]);
            console.log(`plainto_tsquery('${q}') ->`, res.rows[0].q);

            const matchCount = await pool.query("SELECT count(*) FROM hadiths WHERE to_tsvector('english', english_translation) @@ plainto_tsquery('english', $1)", [q]);
            console.log(`Matches for '${q}':`, matchCount.rows[0].count);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
