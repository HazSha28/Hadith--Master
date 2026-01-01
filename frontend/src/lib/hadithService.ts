const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.sunnah.com/v1';
const API_KEY = import.meta.env.VITE_HADITH_API_KEY;

interface Hadith {
  id: number;
  arabic: string;
  english: {
    narrator: string;
    text: string;
  };
  reference: {
    book: number;
    hadith: number;
  };
  bookName?: string;
  chapter?: string;
}

interface SunnahApiResponse {
  hadiths: {
    id: number;
    arabic: string;
    english: {
      narrator: string;
      text: string;
    };
    hadithNumber: number;
    reference: {
      book: number;
      hadith: number;
    };
    bookName?: string;
    chapter?: {
      english: string;
      arabic: string;
    };
  }[];
}

const headers = {
  'Content-Type': 'application/json',
  ...(API_KEY && { 'X-API-Key': API_KEY })
};

export async function fetchRandomHadith(): Promise<Hadith> {
  try {
    // First, get a random book
    const booksResponse = await fetch(`${API_BASE_URL}/books`, { headers });
    if (!booksResponse.ok) throw new Error('Failed to fetch books');
    
    const { data: books } = await booksResponse.json();
    const randomBook = books[Math.floor(Math.random() * books.length)];
    
    // Then get a random hadith from that book
    const hadithResponse = await fetch(
      `${API_BASE_URL}/books/${randomBook.id}/hadiths?limit=1&offset=${Math.floor(Math.random() * 100)}`,
      { headers }
    );
    
    if (!hadithResponse.ok) throw new Error('Failed to fetch hadith');
    
    const { data } = await hadithResponse.json();
    const hadith = data[0];
    
    return {
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
    };
  } catch (error) {
    console.error('Error fetching random hadith:', error);
    
    // Fallback to sample hadiths when API fails
    const sampleHadiths: Hadith[] = [
      {
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
      },
      {
        id: 2,
        arabic: 'الْإِيمَانُ بِضْعٌ وَسَبْعُونَ شُعْبَةً',
        english: {
          narrator: 'Abu Hurairah',
          text: 'Faith has seventy-something branches, the highest of which is saying "La ilaha illallah" and the lowest of which is removing something harmful from the road.'
        },
        reference: {
          book: 1,
          hadith: 35
        },
        bookName: 'Sahih Muslim',
        chapter: 'The Book of Faith'
      },
      {
        id: 3,
        arabic: 'مَنْ حَسُنَ إِسْلَامُ الْمَرْءِ كَانَ تَرْكُهُ مَا لَا يَعْنِيهِ',
        english: {
          narrator: 'Abu Hurairah',
          text: 'Part of the perfection of a person\'s Islam is their leaving aside that which does not concern them.'
        },
        reference: {
          book: 37,
          hadith: 2786
        },
        bookName: 'Jami\' at-Tirmidhi',
        chapter: 'The Book of Manners'
      },
      {
        id: 4,
        arabic: 'الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ',
        english: {
          narrator: 'Abu Hurairah',
          text: 'The Muslim is the one from whose tongue and hand the Muslims are safe.'
        },
        reference: {
          book: 2,
          hadith: 9
        },
        bookName: 'Sahih al-Bukhari',
        chapter: 'The Book of Faith'
      },
      {
        id: 5,
        arabic: 'إِذَا قُمْتُمْ إِلَى الصَّلَاةِ فَاغْسِلُوا وُجُوهَكُمْ',
        english: {
          narrator: 'Abu Hurairah',
          text: 'When you stand for prayer, wash your faces and your forearms up to the elbows, wipe your heads, and wash your feet up to the ankles.'
        },
        reference: {
          book: 4,
          hadith: 6
        },
        bookName: 'Sahih al-Bukhari',
        chapter: 'The Book of Ablution'
      }
    ];
    
    // Return a random sample hadith
    return sampleHadiths[Math.floor(Math.random() * sampleHadiths.length)];
  }
}

export async function searchHadiths(query: string, bookId?: string): Promise<Hadith[]> {
  try {
    let url = `${API_BASE_URL}/hadiths/search?query=${encodeURIComponent(query)}`;
    if (bookId) {
      url = `${API_BASE_URL}/books/${bookId}/hadiths?query=${encodeURIComponent(query)}`;
    }
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data: SunnahApiResponse = await response.json();
    
    return data.hadiths.map(hadith => ({
      id: hadith.id,
      arabic: hadith.arabic,
      english: {
        narrator: hadith.english.narrator,
        text: hadith.english.text
      },
      reference: hadith.reference,
      bookName: hadith.bookName,
      chapter: typeof hadith.chapter === 'object' ? hadith.chapter.english : hadith.chapter
    }));
  } catch (error) {
    console.error('Error searching hadiths:', error);
    // Return empty array or rethrow the error based on your error handling strategy
    return [];
  }
}

// Test function to verify API connection
export async function testApiConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/books`, { 
      headers: {
        'Content-Type': 'application/json',
        ...(API_KEY && { 'X-API-Key': API_KEY })
      }
    });
    
    if (!response.ok) {
      console.error('API Connection Test Failed:', await response.text());
      return false;
    }
    
    console.log('API Connection Test: Success!');
    return true;
  } catch (error) {
    console.error('API Connection Test Error:', error);
    return false;
  }
}
