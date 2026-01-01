/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest, onCall} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Search hadiths endpoint
export const searchHadiths = onCall(async (data, context) => {
  try {
    const { query, bookId, limit = 20 } = data;
    
    if (!query && !bookId) {
      throw new Error("Query or bookId is required");
    }

    // For now, we'll use the external API as a proxy
    // In the future, you can replace this with your own database
    const API_BASE_URL = 'https://api.sunnah.com/v1';
    let url = `${API_BASE_URL}/hadiths/search?query=${encodeURIComponent(query)}&limit=${limit}`;
    
    if (bookId) {
      url = `${API_BASE_URL}/books/${bookId}/hadiths?query=${encodeURIComponent(query)}&limit=${limit}`;
    }
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const apiData = await response.json();
    
    // Transform the data to match our frontend interface
    const results = apiData.data?.hadiths || apiData.hadiths || [];
    
    return {
      success: true,
      data: results.map((hadith: any) => ({
        id: hadith.id,
        arabic: hadith.arabic,
        english: {
          narrator: hadith.english.narrator,
          text: hadith.english.text
        },
        reference: hadith.reference,
        bookName: hadith.bookName,
        chapter: typeof hadith.chapter === 'object' ? hadith.chapter.english : hadith.chapter
      }))
    };
    
  } catch (error) {
    logger.error("Search error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
});

// Get random hadith endpoint
export const getRandomHadith = onCall(async (data, context) => {
  try {
    const API_BASE_URL = 'https://api.sunnah.com/v1';
    
    // First, get a random book
    const booksResponse = await fetch(`${API_BASE_URL}/books`, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!booksResponse.ok) {
      throw new Error('Failed to fetch books');
    }
    
    const { data: books } = await booksResponse.json();
    const randomBook = books[Math.floor(Math.random() * books.length)];
    
    // Then get a random hadith from that book
    const hadithResponse = await fetch(
      `${API_BASE_URL}/books/${randomBook.id}/hadiths?limit=1&offset=${Math.floor(Math.random() * 100)}`,
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (!hadithResponse.ok) {
      throw new Error('Failed to fetch hadith');
    }
    
    const { data } = await hadithResponse.json();
    const hadith = data[0];
    
    return {
      success: true,
      data: {
        id: hadith.id,
        arabic: hadith.arabic,
        english: {
          narrator: hadith.english.narrator,
          text: hadith.english.text
        },
        reference: {
          book: hadith.reference.book,
          hadith: hadith.hadithNumber
        },
        bookName: randomBook.name,
        chapter: hadith.chapter?.english
      }
    };
    
  } catch (error) {
    logger.error("Random hadith error:", error);
    
    // Return fallback hadith
    return {
      success: true,
      data: {
        id: 1,
        arabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ',
        english: {
          narrator: 'Umar ibn Al-Khattab',
          text: 'Verily actions are by intentions, and for every person is what he intended.'
        },
        reference: {
          book: 1,
          hadith: 1
        },
        bookName: 'Sahih al-Bukhari',
        chapter: 'The Book of Revelation'
      }
    };
  }
});
