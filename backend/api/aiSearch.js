import OpenAI from 'openai';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
});

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT || 5432,
});

/**
 * Search Hadiths directly in PostgreSQL using full-text search
 */
async function searchHadithsInDb({ query, book_id, grade, limit = 10 }) {
    console.log(`🔍 DB Search params: query="${query}", book="${book_id}", grade="${grade}"`);

    let sql = `
    SELECT 
      h.hadith_number, 
      b.name as book_name, 
      h.kitab, 
      h.bab, 
      h.arabic_text, 
      h.english_translation, 
      h.narrator, 
      h.grade
    FROM hadiths h
    JOIN books b ON h.book_id = b.book_id
    WHERE 1=1
  `;
    const params = [];
    let paramIndex = 1;

    if (query) {
        sql += ` AND (to_tsvector('english', h.english_translation) @@ plainto_tsquery('english', $${paramIndex}) 
             OR h.english_translation ILIKE $${paramIndex + 1})`;
        params.push(query, `%${query}%`);
        paramIndex += 2;
    }

    if (book_id) {
        sql += ` AND h.book_id = $${paramIndex}`;
        params.push(book_id);
        paramIndex++;
    }

    if (grade) {
        sql += ` AND h.grade = $${paramIndex}`;
        params.push(grade);
        paramIndex++;
    }

    sql += ` LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(sql, params);
    return result.rows;
}

/**
 * Try AI-powered search with Groq, with automatic fallback to direct DB search
 */
export const aiSearchHandler = async (req, res) => {
    try {
        const { q, filters } = req.body;
        console.log(`🤖 AI Search Request: "${q}"`);

        if (!q) {
            return res.status(400).json({ success: false, error: 'Query is required' });
        }

        // First, always get results from the database
        let dbResults = [];
        try {
            dbResults = await searchHadithsInDb({
                query: q,
                book_id: filters?.book,
                grade: filters?.grade,
                limit: 10
            });
            console.log(`📊 Found ${dbResults.length} hadiths in database`);
        } catch (dbError) {
            console.error('❌ DB Search Error within AI handler:', dbError.message);
            // Continue with empty results rather than failing
        }

        // Try to get AI summary using Groq
        try {
            if (dbResults.length === 0) {
                return res.json({
                    success: true,
                    answer: `No hadiths found matching "${q}". Please try different keywords (e.g., "prayer", "patience", "parents").`,
                    sources: []
                });
            }

            const messages = [
                {
                    role: 'system',
                    content: `You are Hadith Master AI, an expert in Islamic Hadith scholarship.
You will be given a user query and hadith search results from a database.
Your job is to:
1. Provide a clear, knowledgeable answer
2. Reference specific hadiths (book name and number)
3. Be concise and informative (under 300 words).`
                },
                {
                    role: 'user',
                    content: `User query: "${q}"

Relevant hadiths (summarized):
${JSON.stringify(dbResults.slice(0, 3).map(h => ({
                        book: h.book_name,
                        number: h.hadith_number,
                        text: h.english_translation?.substring(0, 300) + '...'
                    })), null, 2)}`
                }
            ];

            const response = await openai.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages,
                max_tokens: 500,
                temperature: 0.3
            });

            const answer = response.choices[0].message.content;
            console.log('✅ AI Answer generated');

            return res.status(200).json({
                success: true,
                answer,
                sources: dbResults
            });

        } catch (error) {
            console.error('⚠️ Groq AI Error:', error.message);

            // Fallback: Return DB results without AI summary
            const fallbackAnswer = `Found ${dbResults?.length || 0} relevant hadiths. (AI summary currently unavailable). Reference the search results below for your answer.`;

            return res.status(200).json({
                success: true,
                answer: fallbackAnswer,
                sources: dbResults || []
            });
        }
    } catch (globalError) {
        console.error('❌ Global AI Handler Error:', globalError);
        res.status(500).json({
            success: false,
            error: 'AI Search completely failed',
            details: globalError.message
        });
    }
};
