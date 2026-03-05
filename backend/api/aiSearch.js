import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
});

// Google Gemini Initialization
const genAI = process.env.GOOGLE_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY) : null;
const geminiModel = genAI ? genAI.getGenerativeModel({ model: "gemini-2.0-flash" }) : null;

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
async function searchHadithsInDb({ query, book_id, grade, narrator, author, characters, limit = 10 }) {
    console.log(`🔍 DB Search params: q="${query}", book="${book_id}", grade="${grade}", narr="${narrator}", auth="${author}", char="${characters}"`);

    let sql = `
    SELECT 
      h.hadith_number, 
      b.name as book_name, 
      h.kitab, 
      h.bab, 
      h.arabic_text, 
      h.english_translation, 
      h.narrator, 
      h.grade,
      h.is_sahih, 
      h.is_hasan, 
      h.is_daif,
      h.isnad,
      h.matn,
      h.themes
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
        sql += ` AND (h.book_id = $${paramIndex} OR b.name ILIKE $${paramIndex + 1})`;
        params.push(book_id, `%${book_id}%`);
        paramIndex += 2;
    }

    if (grade) {
        sql += ` AND (h.grade ILIKE $${paramIndex} OR h.authenticity_level ILIKE $${paramIndex})`;
        params.push(`%${grade}%`);
        paramIndex++;
    }

    if (narrator) {
        sql += ` AND h.narrator ILIKE $${paramIndex}`;
        params.push(`%${narrator}%`);
        paramIndex++;
    }

    if (author) {
        sql += ` AND (b.name ILIKE $${paramIndex} OR h.english_translation ILIKE $${paramIndex})`;
        params.push(`%${author}%`);
        paramIndex++;
    }

    if (characters) {
        sql += ` AND h.english_translation ILIKE $${paramIndex}`;
        params.push(`%${characters}%`);
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
        const query = q?.trim();
        console.log(`🤖 AI Search Request: "${query}"`);

        if (!query) {
            return res.status(400).json({ success: false, error: 'Query is required' });
        }

        // --- STEP 1: Intent-Aware Search Query Extraction ---
        let searchTerms = query;
        let extractionError = null;

        if (geminiModel) {
            try {
                const prompt = `You are an expert Hadith researcher.
Convert the user's conversational sentence into an optimized set of search keywords.
- Capture the core intent (e.g., "importance of honesty" -> honesty importance truth).
- Ignore "filler" conversational phrases (e.g., "can you tell me", "I want to know").
- Output ONLY the keywords separated by spaces.
Sentence: "${q}"`;
                const result = await geminiModel.generateContent(prompt);
                searchTerms = result.response.text().replace(/[^\w\s]/gi, '').trim();
                console.log(`🔍 Gemini Keywords: "${searchTerms}"`);
            } catch (kwError) {
                console.error('⚠️ Gemini Keyword Extraction Failed:', kwError.message);
                extractionError = kwError;
            }
        }

        // Fallback to OpenAI/Groq if Gemini is unavailable or failed
        if (!geminiModel || (extractionError && !searchTerms)) {
            try {
                const keywordResponse = await openai.chat.completions.create({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        {
                            role: 'system',
                            content: 'Identify the core search terms from the users question. Output ONLY space-separated keywords.'
                        },
                        { role: 'user', content: q }
                    ],
                    max_tokens: 50,
                    temperature: 0.1
                });
                searchTerms = keywordResponse.choices[0].message.content.replace(/[^\w\s]/gi, '').trim();
                console.log(`🔍 Groq Keywords: "${searchTerms}"`);
            } catch (groqKwError) {
                console.error('⚠️ Groq Keyword Extraction Failed:', groqKwError.message);
                // If both fail, searchTerms remains as 'q'
            }
        }

        // --- STEP 2: Database Retrieval ---
        let dbResults = [];
        try {
            dbResults = await searchHadithsInDb({
                query: searchTerms,
                book_id: filters?.book,
                grade: filters?.grade,
                narrator: filters?.narrator,
                author: filters?.author,
                characters: filters?.characters,
                limit: 20
            });

            if (dbResults.length === 0 && searchTerms !== q) {
                dbResults = await searchHadithsInDb({
                    query: q,
                    book_id: filters?.book,
                    grade: filters?.grade,
                    narrator: filters?.narrator,
                    author: filters?.author,
                    characters: filters?.characters,
                    limit: 20
                });
            }
        } catch (dbError) {
            console.error('❌ DB Search Error:', dbError.message);
        }

        // --- OPTIONAL STEP: Skip Summary if requested ---
        if (req.body.skipSummary || true) { // Forced true based on user request to NEVER summarize
            console.log('⏩ Skipping AI Summary as requested (FORCED)');
            return res.status(200).json({
                success: true,
                answer: null, // Return null so the frontend doesn't render the AI box
                sources: dbResults
            });
        }

        // --- STEP 3: Conversational Answer Generation ---
        try {
            const hasMatches = dbResults.length > 0;
            const contextText = hasMatches ? JSON.stringify(dbResults.slice(0, 5).map(h => ({
                book: h.book_name,
                number: h.hadith_number,
                text: h.english_translation,
                narrator: h.narrator
            }))) : "No specific matches found in the local database.";

            const systemPrompt = `You are Hadith Master AI, a wise, helpful, and clear Islamic scholar.
Goal: Provide a conversational and direct response to the user's sentence.

Instructions:
1. Be Conversational: Acknowledge the user's question naturally (e.g., "Regarding your question about...", "In Islam, patience is...").
2. Use Context First: If specific hadiths are provided in the context, prioritize quoting and explaining them. Reference the book name/number clearly.
3. General Knowledge Fallback: If no hadiths are provided in the context, use your own extensive training data to provide a scholarly and accurate answer.
4. Format: Use plain text only. Do NOT use any Markdown formatting. No asterisks, no bolding, no italics. Use simple dashes (-) for bullet points.
5. Structure: Keep it under 350 words.
6. Tone: Respectful, encouraging, and authoritative.`;

            if (geminiModel) {
                try {
                    const prompt = `${systemPrompt}\n\nUser Question: "${q}"\nContext from Local Database: ${contextText}`;
                    const result = await geminiModel.generateContent(prompt);
                    let answer = result.response.text();

                    // Post-process: Strip bold/italic markers and convert asterisk bullets to dashes
                    answer = answer.replace(/\*\*|__/g, '')
                        .replace(/^\s*[\*]\s+/gm, '- ');

                    console.log('✅ Gemini Summary Generated');
                    return res.status(200).json({ success: true, answer, sources: dbResults });
                } catch (geminiError) {
                    console.error('⚠️ Gemini Summary Generation Failed, falling back to Groq:', geminiError.message);
                }
            }

            // Fallback to Groq/Llama
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `User Question: "${q}"\n\nContext: ${contextText}` }
            ];

            const response = await openai.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages,
                max_tokens: 800,
                temperature: 0.5
            });

            console.log('✅ Groq Summary Generated');
            let answer = response.choices[0].message.content;

            // Post-process: Strip bold/italic markers and convert asterisk bullets to dashes
            answer = answer.replace(/\*\*|__/g, '')
                .replace(/^\s*[\*]\s+/gm, '- ');

            return res.status(200).json({ success: true, answer, sources: dbResults });

        } catch (error) {
            console.error('❌ AI Final Fallback Error:', error);
            if (error.response) {
                console.error('Error Response Data:', JSON.stringify(error.response.data, null, 2));
                console.error('Error Response Status:', error.response.status);
            }
            return res.status(200).json({
                success: true,
                answer: `I found ${dbResults.length} hadiths, but could not generate a summary. Error: ${error.message}`,
                sources: dbResults
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
