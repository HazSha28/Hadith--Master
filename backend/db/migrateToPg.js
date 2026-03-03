import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, readdirSync } from 'fs';

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

const DATA_DIR = join(__dirname, '..', '..', 'data', 'json');

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('🚀 Starting migration from local JSON files...');

        const files = readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
        console.log(`📂 Found ${files.length} JSON files: ${files.join(', ')}`);

        for (const file of files) {
            const filePath = join(DATA_DIR, file);
            console.log(`\n� Processing ${file}...`);

            const raw = readFileSync(filePath, 'utf-8');
            const data = JSON.parse(raw);

            const bookName = data.book || file.replace('.json', '').replace(/_/g, ' ');
            const bookId = file.replace('.json', '');

            // Insert book
            await client.query(
                `INSERT INTO books (book_id, name, total_hadiths)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (book_id) DO UPDATE SET total_hadiths = $3`,
                [bookId, bookName, data.hadiths?.length || 0]
            );
            console.log(`  ✅ Book "${bookName}" registered.`);

            // Insert hadiths in batches
            const hadiths = data.hadiths || [];
            let inserted = 0;

            for (const h of hadiths) {
                const hadithNumber = h.id || h.reference?.hadithNumber || 0;
                const arabicText = h.arabic || '';
                const englishText = h.english?.text || '';
                const narrator = h.english?.narrator || '';
                const grade = h.grade || '';
                const chapter = h.chapter || h.kitab || '';
                const category = h.category || h.bab || '';

                try {
                    await client.query(
                        `INSERT INTO hadiths (book_id, hadith_number, arabic_text, english_translation, narrator, grade, kitab, bab)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                         ON CONFLICT DO NOTHING`,
                        [bookId, hadithNumber, arabicText, englishText, narrator, grade, chapter, category]
                    );
                    inserted++;
                } catch (err) {
                    // Skip duplicates or bad data silently
                }

                if (inserted % 500 === 0 && inserted > 0) {
                    process.stdout.write(`  📝 Inserted ${inserted}/${hadiths.length} hadiths...\r`);
                }
            }
            console.log(`  ✅ Migrated ${inserted} hadiths for "${bookName}".`);
        }

        console.log('\n🎉 Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
