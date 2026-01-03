import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { query, hadiths } = await request.json();
    
    if (!query || !hadiths || !Array.isArray(hadiths)) {
      return NextResponse.json(
        { error: 'Query and hadiths array are required' },
        { status: 400 }
      );
    }

    // Limit the number of hadiths to avoid token limits
    const limitedHadiths = hadiths.slice(0, 5);

    // Generate insight about the results
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an Islamic scholar assistant. Provide a concise 2-3 sentence summary of what these hadiths say about the query.
          Focus on the key teachings and mention any important narrators or books.
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

    return NextResponse.json({ insight });
    
  } catch (error) {
    console.error('Error generating insight:', error);
    return NextResponse.json(
      { error: 'Failed to generate insight' },
      { status: 500 }
    );
  }
}
