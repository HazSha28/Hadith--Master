import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Initialize Groq (Free alternative to OpenAI)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Process the query with AI
    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192", // Groq's free model
      messages: [
        {
          role: "system",
          content: `You are an AI assistant for a Hadith search application. 
          Analyze the user's query and extract search terms and filters.
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

    // Parse the JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      parsedResponse = {
        searchTerm: query,
        filters: {},
        intent: 'search'
      };
    }

    return NextResponse.json(parsedResponse);
    
  } catch (error) {
    console.error('AI processing error:', error);
    
    // Get the query from the request again for fallback
    const body = await request.json().catch(() => ({}));
    
    // Fallback response
    return NextResponse.json({
      searchTerm: body.query || '',
      filters: {},
      intent: 'search'
    });
  }
}
