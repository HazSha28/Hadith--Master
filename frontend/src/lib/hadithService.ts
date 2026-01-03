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
    
    // Fallback to comprehensive sample hadiths when API fails
    const sampleHadiths: Hadith[] = [
      // SAHIH AL-BUKHARI
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
        id: 3,
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
      },
      {
        id: 4,
        arabic: 'الصِّيَامُ جُنَّةٌ',
        english: {
          narrator: 'Abu Hurairah',
          text: 'Fasting is a shield.'
        },
        reference: {
          book: 30,
          hadith: 11
        },
        bookName: 'Sahih al-Bukhari',
        chapter: 'The Book of Fasting'
      },
      
      // SAHIH MUSLIM
      {
        id: 5,
        arabic: 'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ',
        english: {
          narrator: 'Abu Dharr',
          text: 'Your smiling in the face of your brother is charity.'
        },
        reference: {
          book: 5,
          hadith: 2664
        },
        bookName: 'Sahih Muslim',
        chapter: 'The Book of Charity'
      },
      {
        id: 6,
        arabic: 'الطُّهُورُ شَطْرُ الْإِيمَانِ',
        english: {
          narrator: 'Abu Malik al-Ash\'ari',
          text: 'Purity is half of faith.'
        },
        reference: {
          book: 1,
          hadith: 223
        },
        bookName: 'Sahih Muslim',
        chapter: 'The Book of Faith'
      },
      {
        id: 7,
        arabic: 'إِذَا قَالَ أَحَدُكُمْ آمِينَ وَقَالَتِ الْمَلَائِكَةُ فِي السَّمَاءِ آمِينَ',
        english: {
          narrator: 'Abu Hurairah',
          text: 'When one of you says Amin and the angels in the heavens say Amin, and they coincide, his past sins will be forgiven.'
        },
        reference: {
          book: 1,
          hadith: 410
        },
        bookName: 'Sahih Muslim',
        chapter: 'The Book of Prayer'
      },
      
      // SUNAN ABU DAWUD
      {
        id: 8,
        arabic: 'سَيِّدُ الْقَوْمِ خَادِمُهُمْ',
        english: {
          narrator: 'Abu Qatadah',
          text: 'The leader of a people is their servant.'
        },
        reference: {
          book: 42,
          hadith: 5143
        },
        bookName: 'Sunan Abu Dawud',
        chapter: 'The Book of Manners'
      },
      {
        id: 9,
        arabic: 'الْبِرُّ حُسْنُ الْخُلُقِ',
        english: {
          narrator: 'Abu al-Darda',
          text: 'Righteousness is good character.'
        },
        reference: {
          book: 42,
          hadith: 4781
        },
        bookName: 'Sunan Abu Dawud',
        chapter: 'The Book of Manners'
      },
      
      // JAMI' AT-TIRMIDHI
      {
        id: 10,
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
        id: 11,
        arabic: 'الدُّنْيَا سِجْنُ الْمُؤْمِنِ وَجَنَّةُ الْكَافِرِ',
        english: {
          narrator: 'Abu Hurairah',
          text: 'The world is a prison for the believer and a paradise for the disbeliever.'
        },
        reference: {
          book: 39,
          hadith: 2324
        },
        bookName: 'Jami\' at-Tirmidhi',
        chapter: 'The Book of Zuhd'
      },
      {
        id: 12,
        arabic: 'لَيْسَ الْغِنَى عَنْ كَثْرَةِ الْعَرَضِ',
        english: {
          narrator: 'Abu Hurairah',
          text: 'Wealth is not in abundance of goods, but wealth is in contentment of the soul.'
        },
        reference: {
          book: 35,
          hadith: 2373
        },
        bookName: 'Jami\' at-Tirmidhi',
        chapter: 'The Book of Zuhd'
      },
      
      // SUNAN AN-NASA'I
      {
        id: 13,
        arabic: 'الْمُؤْمِنُ الَّذِي يُخَالِطُ النَّاسَ وَيَصْبِرُ عَلَى أَذَاهُمْ',
        english: {
          narrator: 'Ibn Umar',
          text: 'The believer who mixes with people and patiently endures their harm is better than the believer who does not mix with people and does not patiently endure their harm.'
        },
        reference: {
          book: 8,
          hadith: 103
        },
        bookName: 'Sunan an-Nasa\'i',
        chapter: 'The Book of Manners'
      },
      {
        id: 14,
        arabic: 'مَنْ صَلَّى عَلَيَّ صَلَاةً وَاحِدَةً',
        english: {
          narrator: 'Abu Hurairah',
          text: 'Whoever sends blessings upon me once, Allah will send blessings upon him ten times.'
        },
        reference: {
          book: 43,
          hadith: 24
        },
        bookName: 'Sunan an-Nasa\'i',
        chapter: 'The Book of Prayer'
      },
      {
        id: 15,
        arabic: 'إِذَا مَاتَ الْإِنْسَانُ انْقَطَعَ عَمَلُهُ',
        english: {
          narrator: 'Abu Hurairah',
          text: 'When a person dies, his deeds come to an end except for three: ongoing charity, beneficial knowledge, or a righteous child who prays for him.'
        },
        reference: {
          book: 36,
          hadith: 3651
        },
        bookName: 'Sunan an-Nasa\'i',
        chapter: 'The Book of Charity'
      },
      
      // SUNAN IBN MAJAH
      {
        id: 16,
        arabic: 'الْمُسْلِمُ أَخُو الْمُسْلِمِ',
        english: {
          narrator: 'Anas ibn Malik',
          text: 'The Muslim is the brother of the Muslim. He does not betray him, lie to him, or forsake him.'
        },
        reference: {
          book: 36,
          hadith: 3932
        },
        bookName: 'Sunan Ibn Majah',
        chapter: 'The Book of Manners'
      },
      {
        id: 17,
        arabic: 'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا',
        english: {
          narrator: 'Abu Hurairah',
          text: 'Whoever takes a path seeking knowledge, Allah will make easy for him a path to Paradise.'
        },
        reference: {
          book: 1,
          hadith: 225
        },
        bookName: 'Sunan Ibn Majah',
        chapter: 'The Book of Knowledge'
      },
      {
        id: 18,
        arabic: 'الدُّعَاءُ هُوَ الْعِبَادَةُ',
        english: {
          narrator: 'An-Nu\'man ibn Bashir',
          text: 'Supplication is worship.'
        },
        reference: {
          book: 38,
          hadith: 3828
        },
        bookName: 'Sunan Ibn Majah',
        chapter: 'The Book of Supplication'
      },
      {
        id: 19,
        arabic: 'إِنَّ لِلَّهِ تِسْعَةً وَتِسْعِينَ اسْمًا',
        english: {
          narrator: 'Abu Hurairah',
          text: 'Indeed, Allah has ninety-nine names. Whoever enumerates them will enter Paradise.'
        },
        reference: {
          book: 38,
          hadith: 3866
        },
        bookName: 'Sunan Ibn Majah',
        chapter: 'The Book of Supplication'
      },
      {
        id: 20,
        arabic: 'اتَّقُوا اللَّهَ وَاصْلِحُوا ذَاتَ بَيْنِكُمْ',
        english: {
          narrator: 'Abu Ayyub al-Ansari',
          text: 'Fear Allah and reconcile among yourselves, for indeed I make my will among you that you should fear Allah and reconcile among yourselves.'
        },
        reference: {
          book: 36,
          hadith: 3937
        },
        bookName: 'Sunan Ibn Majah',
        chapter: 'The Book of Manners'
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
