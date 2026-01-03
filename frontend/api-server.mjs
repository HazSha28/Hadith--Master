import express from 'express';
import Groq from 'groq-sdk';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

// Middleware
app.use(cors());
app.use(express.json());

// AI Process Query Route
app.post('/api/ai/process-query', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant for a Hadith search application. 
          Analyze user's query and extract search terms and filters.
          Respond in JSON format with:
          - searchTerm: The main search keywords
          - filters: Any filters (book, narrator, theme, etc.)
          - intent: The user's intent (search, question, explanation)
          
          Example responses:
          For "hadiths about prayer by Abu Huraira":
          {"searchTerm": "prayer", "filters": {"narrator": "Abu Huraira"}, "intent": "search"}
          
          For "What did Prophet say about patience?":
          {"searchTerm": "patience", "filters": {}, "intent": "question"}`
        },
        {
          role: "user",
          content: query
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from AI service');
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response);
    } catch (parseError) {
      parsedResponse = {
        searchTerm: query,
        filters: {},
        intent: 'search'
      };
    }

    res.json(parsedResponse);
    
  } catch (error) {
    console.error('AI processing error:', error);
    res.json({
      searchTerm: req.body.query || '',
      filters: {},
      intent: 'search'
    });
  }
});

// AI Insight Route
app.post('/api/ai/insight', async (req, res) => {
  try {
    const { query, hadiths } = req.body;
    
    if (!query || !hadiths || !Array.isArray(hadiths)) {
      return res.status(400).json({ error: 'Query and hadiths array are required' });
    }

    const limitedHadiths = hadiths.slice(0, 5);

    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "system",
          content: `You are an Islamic scholar assistant. Provide a concise 2-3 sentence summary of what these hadiths say about the query.
          Focus on key teachings and mention any important narrators or books.
          Keep it educational and respectful.`
        },
        {
          role: "user",
          content: `Query: "${query}"
          
          Hadiths:
          ${limitedHadiths.map((h, i) => `
          ${i + 1}. Book: ${h.book_name || 'Unknown'}
             Narrator: ${h.narrator || 'Unknown'}
             Text: ${h.english_translation || h.english?.text || 'No translation'}
             Themes: ${h.themes ? h.themes.join(', ') : 'No themes'}
          `).join('\n')}`
        }
      ],
      temperature: 0.5,
      max_tokens: 300,
    });

    const insight = completion.choices[0]?.message?.content || 'No insight available.';
    res.json({ insight });
    
  } catch (error) {
    console.error('Error generating insight:', error);
    res.status(500).json({ error: 'Failed to generate insight' });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
