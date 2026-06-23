// Hadith API - PostgreSQL implementation
// Provides RESTful endpoints for hadith data access

import express from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { aiSearchHandler } from './aiSearch.js';

dotenv.config();

const router = express.Router();

// PostgreSQL Pool Initialization
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432'),
});

// Helper function to format hadith data for frontend
const formatHadith = (row) => {
  return {
    id: row.id.toString(),
    arabic: row.arabic_text,
    english: {
      narrator: row.narrator || 'Unknown',
      text: row.english_translation
    },
    reference: {
      book: row.book_id,
      hadith: row.hadith_number
    },
    book: row.book_name,
    chapter: row.kitab || '',
    category: row.bab || '',
    difficulty: row.grade || 'Medium',
    tags: row.themes || [],
    isnad: row.isnad || '',
    matn: row.matn || '',
    grade: row.grade || '',
    createdAt: row.created_at
  };
};

// AI Search endpoint (Agentic AI)
router.post('/search/ai', aiSearchHandler);

// POST /api/hadith/explain — AI explanation for a single hadith
router.post('/explain', async (req, res) => {
  try {
    const { arabic, english, narrator, book, hadithNumber } = req.body;

    if (!english) {
      return res.status(400).json({ success: false, error: 'Hadith text is required' });
    }

    const genAI = process.env.GOOGLE_API_KEY
      ? new (await import('@google/generative-ai')).GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
      : null;
    const geminiModel = genAI ? genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }) : null;

    const prompt = `You are a knowledgeable and respectful Islamic scholar explaining a hadith to a learner.

Hadith Details:
- Book: ${book || 'Unknown'}
- Number: ${hadithNumber || 'Unknown'}
- Narrator: ${narrator || 'Unknown'}
- Arabic Text: ${arabic || ''}
- English Translation: ${english}

Please provide a clear, concise explanation covering:
1. The main lesson or message of this hadith
2. The context or occasion (if known)
3. How a Muslim can apply this in daily life

Keep the explanation under 250 words. Use plain text only — no markdown, no asterisks, no bold. Be respectful and encouraging in tone.`;

    let explanation = '';

    if (geminiModel) {
      const result = await geminiModel.generateContent(prompt);
      explanation = result.response.text()
        .replace(/\*\*|__/g, '')
        .replace(/^\s*[*]\s+/gm, '- ')
        .trim();
    } else {
      // Fallback to Groq/Llama
      const { default: OpenAI } = await import('openai');
      const groq = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
      });
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 400,
        temperature: 0.6,
      });
      explanation = response.choices[0].message.content
        .replace(/\*\*|__/g, '')
        .replace(/^\s*[*]\s+/gm, '- ')
        .trim();
    }

    res.json({ success: true, explanation });
  } catch (error) {
    console.error('Explain endpoint error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate explanation' });
  }
});

// GET /api/hadith - Get all hadiths with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      book,
      category,
      difficulty,
      search,
      tags
    } = req.query;

    const limitNum = parseInt(limit);
    const offset = (parseInt(page) - 1) * limitNum;

    let queryArgs = [];
    let whereClauses = [];
    let argIndex = 1;

    if (book) {
      whereClauses.push(`h.book_id = $${argIndex}`);
      queryArgs.push(book);
      argIndex++;
    }
    if (category) {
      whereClauses.push(`h.bab = $${argIndex}`);
      queryArgs.push(category);
      argIndex++;
    }
    if (search) {
      whereClauses.push(`(to_tsvector('english', h.english_translation) @@ plainto_tsquery('english', $${argIndex}) OR h.english_translation ILIKE $${argIndex + 1})`);
      queryArgs.push(search, `%${search}%`);
      argIndex += 2;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Get total count for pagination
    const countSql = `SELECT COUNT(*) FROM hadiths h ${whereSql}`;
    const countRes = await pool.query(countSql, queryArgs);
    const totalHadiths = parseInt(countRes.rows[0].count);

    // Get actual data
    const dataSql = `
      SELECT h.*, b.name as book_name 
      FROM hadiths h 
      JOIN books b ON h.book_id = b.book_id 
      ${whereSql} 
      ORDER BY h.id ASC 
      LIMIT $${argIndex} OFFSET $${argIndex + 1}
    `;
    queryArgs.push(limitNum, offset);

    const snapshot = await pool.query(dataSql, queryArgs);
    const hadiths = snapshot.rows.map(formatHadith);

    const totalPages = Math.ceil(totalHadiths / limitNum);

    res.json({
      success: true,
      data: {
        hadiths,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalHadiths,
          limit: limitNum,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        },
        filters: { book, category, difficulty, search, tags }
      },
      message: `Retrieved ${hadiths.length} hadiths`
    });

  } catch (error) {
    console.error('Error fetching hadiths:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hadiths',
      message: error.message
    });
  }
});

// GET /api/hadith/books - Get all available books
router.get('/books', async (req, res) => {
  try {
    const dataSql = `SELECT * FROM books ORDER BY name ASC`;
    const snapshot = await pool.query(dataSql);

    const books = snapshot.rows.map(row => ({
      id: row.book_id,
      name: row.name,
      fullName: row.name,
      author: 'Various',
      totalHadiths: row.total_hadiths,
      description: `Collection of hadiths from ${row.name}`
    }));

    res.json({
      success: true,
      data: books,
      message: `Retrieved ${books.length} books`
    });

  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch books',
      message: error.message
    });
  }
});

// GET /api/hadith/categories - Get all categories (babs)
router.get('/categories', async (req, res) => {
  try {
    // Unique babs as categories
    const dataSql = `SELECT DISTINCT bab FROM hadiths WHERE bab IS NOT NULL AND bab != '' ORDER BY bab LIMIT 50`;
    const snapshot = await pool.query(dataSql);

    const categories = snapshot.rows.map((row, index) => ({
      id: `cat_${index}`,
      name: row.bab,
      description: `Hadiths related to ${row.bab}`,
      hadithCount: 0 // Placeholder
    }));

    res.json({
      success: true,
      data: categories,
      message: `Retrieved ${categories.length} categories`
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      message: error.message
    });
  }
});

// GET /api/hadith/random - Get random hadith
router.get('/random', async (req, res) => {
  try {
    const { count = 1 } = req.query;
    const countNum = Math.min(parseInt(count), 10);

    const dataSql = `
      SELECT h.*, b.name as book_name 
      FROM hadiths h 
      JOIN books b ON h.book_id = b.book_id 
      ORDER BY random() 
      LIMIT $1
    `;
    const snapshot = await pool.query(dataSql, [countNum]);
    const randomHadiths = snapshot.rows.map(formatHadith);

    res.json({
      success: true,
      data: randomHadiths,
      message: `Retrieved ${randomHadiths.length} random hadiths`
    });

  } catch (error) {
    console.error('Error fetching random hadiths:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch random hadiths',
      message: error.message
    });
  }
});

// GET /api/hadith/search - Advanced search endpoint
router.get('/search', async (req, res) => {
  try {
    const {
      q: query,
      book,
      category,
      difficulty,
      narrator,
      tags,
      page = 1,
      limit = 20
    } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const limitNum = parseInt(limit);
    const offset = (parseInt(page) - 1) * limitNum;

    // Sanitize query — strip quotes and punctuation that break plainto_tsquery
    const sanitizedQuery = query
      .replace(/["""'']/g, '')
      .replace(/[^\w\s\-\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Detect Arabic content in query
    const hasArabic = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(sanitizedQuery);
    const arabicPart = sanitizedQuery.match(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF\s]+/g)?.join(' ').trim() || '';
    const englishPart = sanitizedQuery.replace(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g, '').trim();

    let whereClauses = [];
    let queryArgs = [];
    let argIndex = 1;

    // Build search clause based on language content
    if (hasArabic && arabicPart && englishPart) {
      // Strip diacritics from DB arabic_text before ILIKE comparison
      whereClauses.push(`(regexp_replace(h.arabic_text, '[\\u064B-\\u065F\\u0610-\\u061A\\u06D6-\\u06DC\\u06DF-\\u06E8\\u06EA-\\u06ED\\u200F\\u200E\\u202A-\\u202E]', '', 'g') ILIKE $${argIndex} OR to_tsvector('english', h.english_translation) @@ plainto_tsquery('english', $${argIndex + 1}) OR h.english_translation ILIKE $${argIndex + 2})`);
      queryArgs.push(`%${arabicPart}%`, englishPart, `%${englishPart}%`);
      argIndex += 3;
    } else if (hasArabic && arabicPart) {
      // Arabic only — strip diacritics before matching
      whereClauses.push(`regexp_replace(h.arabic_text, '[\\u064B-\\u065F\\u0610-\\u061A\\u06D6-\\u06DC\\u06DF-\\u06E8\\u06EA-\\u06ED\\u200F\\u200E\\u202A-\\u202E]', '', 'g') ILIKE $${argIndex}`);
      queryArgs.push(`%${arabicPart}%`);
      argIndex += 1;
    } else {
      // English full-text + ILIKE fallback
      whereClauses.push(`(to_tsvector('english', h.english_translation) @@ plainto_tsquery('english', $${argIndex}) OR h.english_translation ILIKE $${argIndex + 1})`);
      queryArgs.push(sanitizedQuery, `%${sanitizedQuery}%`);
      argIndex += 2;
    }

    if (book) {
      whereClauses.push(`(h.book_id = $${argIndex} OR b.name = $${argIndex})`);
      queryArgs.push(book);
      argIndex++;
    }

    if (category) {
      whereClauses.push(`h.bab ILIKE $${argIndex}`);
      queryArgs.push(`%${category}%`);
      argIndex++;
    }

    if (narrator) {
      whereClauses.push(`h.narrator ILIKE $${argIndex}`);
      queryArgs.push(`%${narrator}%`);
      argIndex++;
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    // Total count for search — always JOIN books so b.name is available in WHERE
    const countSql = `SELECT COUNT(*) FROM hadiths h JOIN books b ON h.book_id = b.book_id ${whereSql}`;
    const countRes = await pool.query(countSql, queryArgs);
    const totalHadiths = parseInt(countRes.rows[0].count);

    // Actual search results
    const dataSql = `
      SELECT h.*, b.name as book_name 
      FROM hadiths h 
      JOIN books b ON h.book_id = b.book_id 
      ${whereSql} 
      LIMIT $${argIndex} OFFSET $${argIndex + 1}
    `;
    queryArgs.push(limitNum, offset);

    const snapshot = await pool.query(dataSql, queryArgs);
    const hadiths = snapshot.rows.map(formatHadith);

    const totalPages = Math.ceil(totalHadiths / limitNum);

    res.json({
      success: true,
      data: {
        hadiths,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalHadiths,
          limit: limitNum
        },
        search: {
          query,
          filters: { book, category, difficulty, narrator, tags }
        }
      },
      message: `Found ${totalHadiths} hadiths matching "${query}"`
    });

  } catch (error) {
    console.error('Error searching hadiths:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search hadiths',
      message: error.message
    });
  }
});

// GET /api/hadith/:id - Get specific hadith by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      // Also try firestore_id if it's not a number
      const dataSql = `SELECT h.*, b.name as book_name FROM hadiths h JOIN books b ON h.book_id = b.book_id WHERE h.firestore_id = $1`;
      const snapshot = await pool.query(dataSql, [id]);
      if (snapshot.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Hadith not found' });
      }
      return res.json({ success: true, data: formatHadith(snapshot.rows[0]) });
    }

    const dataSql = `SELECT h.*, b.name as book_name FROM hadiths h JOIN books b ON h.book_id = b.book_id WHERE h.id = $1`;
    const snapshot = await pool.query(dataSql, [parseInt(id)]);

    if (snapshot.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Hadith not found'
      });
    }

    res.json({
      success: true,
      data: formatHadith(snapshot.rows[0]),
      message: 'Hadith retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching hadith:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hadith',
      message: error.message
    });
  }
});

export default router;
