import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: parseInt(process.env.PGPORT || '5432'),
});

async function check() {
    try {
        const resCount = await pool.query('SELECT COUNT(*) FROM hadiths');
        console.log(`📊 Hadiths Count: ${resCount.rows[0].count}`);

        const resBooks = await pool.query('SELECT book_id, name FROM books');
        console.log('📚 Books:');
        resBooks.rows.forEach(b => console.log(`  - ${b.book_id}: ${b.name}`));

        const resSample = await pool.query('SELECT english_translation FROM hadiths LIMIT 5');
        console.log('📝 Sample Translations:');
        resSample.rows.forEach(s => console.log(`  - ${s.english_translation.substring(0, 50)}...`));

        // Test a "patience" query manually
        const query = 'patience';
        const resTest = await pool.query(
            "SELECT COUNT(*) FROM hadiths WHERE to_tsvector('english', english_translation) @@ plainto_tsquery('english', $1) OR english_translation ILIKE $2",
            [query, `%${query}%`]
        );
        console.log(`🔍 Test Search for "patience": ${resTest.rows[0].count} matches`);

    } catch (err) {
        console.error('❌ Check Failed:', err.message);
    } finally {
        await pool.end();
    }
}

check();
