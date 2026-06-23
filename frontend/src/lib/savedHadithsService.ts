/**
 * savedHadithsService.ts
 * Writes saved hadiths to BOTH localStorage (for offline) AND
 * Firestore userCollections (for real-time profile stats).
 */

import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';

export interface SaveableHadith {
  id: string;
  arabic?: string;
  english?: string | { text: string; narrator: string };
  book?: string;
  chapter?: string;
  reference?: { book: any; hadith: any };
  [key: string]: any;
}

/**
 * Save a hadith to Firestore + localStorage.
 * Silent fail on Firestore — localStorage always succeeds.
 */
export async function saveHadithToFirestore(
  uid: string,
  hadith: SaveableHadith
): Promise<void> {
  if (!uid) return;
  try {
    const englishText = typeof hadith.english === 'string'
      ? hadith.english
      : hadith.english?.text || '';

    await setDoc(
      doc(db, 'userCollections', uid, 'savedHadiths', hadith.id),
      {
        ...hadith,
        english: typeof hadith.english === 'string'
          ? { text: hadith.english, narrator: 'Unknown' }
          : hadith.english,
        savedAt:   serverTimestamp(),
        liked:     false,
        shared:    false,
      }
    );
  } catch (err) {
    console.warn('[savedHadithsService] Firestore save failed:', err);
  }
}

/**
 * Remove a hadith from Firestore.
 * Silent fail — localStorage removal is handled by the caller.
 */
export async function removeHadithFromFirestore(
  uid: string,
  hadithId: string
): Promise<void> {
  if (!uid) return;
  try {
    await deleteDoc(doc(db, 'userCollections', uid, 'savedHadiths', hadithId));
  } catch (err) {
    console.warn('[savedHadithsService] Firestore remove failed:', err);
  }
}

/**
 * Mark a hadith as liked in Firestore.
 */
export async function likeHadithInFirestore(
  uid: string,
  hadithId: string,
  liked: boolean
): Promise<void> {
  if (!uid) return;
  try {
    await setDoc(
      doc(db, 'userCollections', uid, 'savedHadiths', hadithId),
      { liked, likedAt: liked ? serverTimestamp() : null },
      { merge: true }
    );
  } catch (err) {
    console.warn('[savedHadithsService] Firestore like failed:', err);
  }
}

/**
 * Mark a hadith as shared in Firestore.
 */
export async function shareHadithInFirestore(
  uid: string,
  hadithId: string
): Promise<void> {
  if (!uid) return;
  try {
    await setDoc(
      doc(db, 'userCollections', uid, 'savedHadiths', hadithId),
      { shared: true, sharedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (err) {
    console.warn('[savedHadithsService] Firestore share failed:', err);
  }
}
