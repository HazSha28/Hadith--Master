import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, limit } from "firebase/firestore";
import { db } from "./functions/src/firebase.js";

// Sample hadith data structure
const hadithData = [
  {
    id: 1,
    arabic: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
    english: {
      narrator: "Umar ibn Al-Khattab",
      text: "Verily actions are by intentions, and for every person is what he intended."
    },
    reference: {
      book: "Sahih al-Bukhari",
      bookNumber: 1,
      hadithNumber: 1
    },
    chapter: "The Book of Revelation",
    category: "faith",
    difficulty: "beginner",
    tags: ["intention", "faith", "actions"],
    createdAt: new Date(),
    isActive: true
  },
  {
    id: 2,
    arabic: "الْإِيمَانُ بِضْعٌ وَسَبْعُونَ شُعْبَةً",
    english: {
      narrator: "Abu Hurairah",
      text: "Faith has seventy-something branches, the highest of which is saying 'La ilaha illallah' and the lowest of which is removing something harmful from the road."
    },
    reference: {
      book: "Sahih Muslim",
      bookNumber: 1,
      hadithNumber: 35
    },
    chapter: "The Book of Faith",
    category: "faith",
    difficulty: "beginner",
    tags: ["faith", "branches", "charity"],
    createdAt: new Date(),
    isActive: true
  },
  {
    id: 3,
    arabic: "مَنْ حَسُنَ إِسْلَامُ الْمَرْءِ كَانَ تَرْكُهُ مَا لَا يَعْنِيهِ",
    english: {
      narrator: "Abu Hurairah",
      text: "Part of the perfection of a person's Islam is their leaving aside that which does not concern them."
    },
    reference: {
      book: "Jami' at-Tirmidhi",
      bookNumber: 37,
      hadithNumber: 2786
    },
    chapter: "The Book of Manners",
    category: "manners",
    difficulty: "beginner",
    tags: ["manners", "perfection", "islam"],
    createdAt: new Date(),
    isActive: true
  },
  {
    id: 4,
    arabic: "الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ",
    english: {
      narrator: "Abu Hurairah",
      text: "The Muslim is the one from whose tongue and hand the Muslims are safe."
    },
    reference: {
      book: "Sahih al-Bukhari",
      bookNumber: 2,
      hadithNumber: 9
    },
    chapter: "The Book of Faith",
    category: "manners",
    difficulty: "beginner",
    tags: ["muslim", "safety", "character"],
    createdAt: new Date(),
    isActive: true
  },
  {
    id: 5,
    arabic: "إِذَا قُمْتُمْ إِلَى الصَّلَاةِ فَاغْسِلُوا وُجُوهَكُمْ",
    english: {
      narrator: "Abu Hurairah",
      text: "When you stand for prayer, wash your faces and your forearms up to the elbows, wipe your heads, and wash your feet up to the ankles."
    },
    reference: {
      book: "Sahih al-Bukhari",
      bookNumber: 4,
      hadithNumber: 6
    },
    chapter: "The Book of Ablution",
    category: "worship",
    difficulty: "beginner",
    tags: ["wudu", "prayer", "purification"],
    createdAt: new Date(),
    isActive: true
  }
];

// Daily hadith schedule data
const dailyHadithSchedule = [
  {
    date: new Date().toISOString().split('T')[0], // Today's date
    hadithId: 1,
    featured: true,
    sent: false,
    createdAt: new Date()
  }
];

async function uploadHadithData() {
  try {
    console.log("🚀 Starting hadith data upload...");
    
    // Upload main hadith collection
    const hadithsRef = collection(db, "hadiths");
    
    for (const hadith of hadithData) {
      try {
        const docRef = await addDoc(hadithsRef, hadith);
        console.log(`✅ Hadith uploaded successfully: ${hadith.english.narrator} - ID: ${docRef.id}`);
      } catch (error) {
        console.error(`❌ Error uploading hadith ${hadith.id}:`, error);
      }
    }
    
    // Upload daily hadith schedule
    const scheduleRef = collection(db, "dailyHadithSchedule");
    
    for (const schedule of dailyHadithSchedule) {
      try {
        const docRef = await addDoc(scheduleRef, schedule);
        console.log(`✅ Daily schedule uploaded: ${schedule.date} - ID: ${docRef.id}`);
      } catch (error) {
        console.error(`❌ Error uploading schedule for ${schedule.date}:`, error);
      }
    }
    
    console.log("🎉 Hadith data upload completed!");
    
  } catch (error) {
    console.error("❌ Upload failed:", error);
  }
}

async function getDailyHadith(date = new Date().toISOString().split('T')[0]) {
  try {
    const scheduleRef = collection(db, "dailyHadithSchedule");
    const q = query(scheduleRef, orderBy("createdAt", "desc"), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const scheduleDoc = querySnapshot.docs[0];
      const scheduleData = scheduleDoc.data();
      
      // Get the hadith details
      const hadithsRef = collection(db, "hadiths");
      const hadithQuery = query(hadithsRef, orderBy("id"));
      const hadithSnapshot = await getDocs(hadithQuery);
      
      const hadith = hadithSnapshot.docs.find(doc => doc.data().id === scheduleData.hadithId);
      
      if (hadith) {
        return {
          id: hadith.id,
          ...hadith.data(),
          scheduleId: scheduleDoc.id,
          scheduleDate: scheduleData.date
        };
      }
    }
    
    // Fallback to random hadith if no schedule found
    const hadithsRef = collection(db, "hadiths");
    const hadithSnapshot = await getDocs(hadithsRef);
    
    if (!hadithSnapshot.empty) {
      const randomDoc = hadithSnapshot.docs[Math.floor(Math.random() * hadithSnapshot.docs.length)];
      return {
        id: randomDoc.id,
        ...randomDoc.data(),
        scheduleId: null,
        scheduleDate: date
      };
    }
    
    return null;
  } catch (error) {
    console.error("❌ Error getting daily hadith:", error);
    return null;
  }
}

async function scheduleNextDailyHadith() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Get all active hadiths
    const hadithsRef = collection(db, "hadiths");
    const hadithSnapshot = await getDocs(hadithsRef);
    const activeHadiths = hadithSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(hadith => hadith.isActive);
    
    if (activeHadiths.length === 0) {
      console.log("❌ No active hadiths found");
      return;
    }
    
    // Select a random hadith
    const randomHadith = activeHadiths[Math.floor(Math.random() * activeHadiths.length)];
    
    // Create schedule for tomorrow
    const scheduleRef = collection(db, "dailyHadithSchedule");
    await addDoc(scheduleRef, {
      date: tomorrowStr,
      hadithId: randomHadith.id,
      featured: true,
      sent: false,
      createdAt: new Date()
    });
    
    console.log(`✅ Daily hadith scheduled for ${tomorrowStr}: Hadith ID ${randomHadith.id}`);
  } catch (error) {
    console.error("❌ Error scheduling daily hadith:", error);
  }
}

async function getAllHadiths() {
  try {
    const hadithsRef = collection(db, "hadiths");
    const querySnapshot = await getDocs(hadithsRef);
    
    const hadiths = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`📚 Found ${hadiths.length} hadiths in database`);
    return hadiths;
  } catch (error) {
    console.error("❌ Error fetching hadiths:", error);
    return [];
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'upload':
    uploadHadithData();
    break;
  case 'daily':
    getDailyHadith().then(hadith => {
      if (hadith) {
        console.log("📖 Today's Hadith:");
        console.log(`Arabic: ${hadith.arabic}`);
        console.log(`English: ${hadith.english.text}`);
        console.log(`Narrator: ${hadith.english.narrator}`);
        console.log(`Reference: ${hadith.reference.book} ${hadith.reference.hadithNumber}`);
      } else {
        console.log("❌ No daily hadith found");
      }
    });
    break;
  case 'schedule':
    scheduleNextDailyHadith();
    break;
  case 'list':
    getAllHadiths().then(hadiths => {
      hadiths.forEach(hadith => {
        console.log(`${hadith.id}: ${hadith.english.narrator} - ${hadith.reference.book}`);
      });
    });
    break;
  default:
    console.log("Available commands:");
    console.log("  upload    - Upload sample hadith data");
    console.log("  daily     - Get today's hadith");
    console.log("  schedule  - Schedule tomorrow's hadith");
    console.log("  list      - List all hadiths");
    break;
}
