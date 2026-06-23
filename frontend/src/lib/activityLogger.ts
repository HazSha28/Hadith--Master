/**
 * activityLogger.ts
 * Logs user actions to Firestore userActivity collection.
 * Used by the profile page real-time listeners to show live stats.
 * All operations are fire-and-forget — errors never block the UI.
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';

export type ActivityType = 'read' | 'liked' | 'unliked' | 'shared' | 'commented' | 'saved' | 'unsaved';

export interface ActivityPayload {
  hadithId: string;
  text?: string;   // first 120 chars of english translation
  book?: string;
  chapter?: string;
}

/**
 * Log a user activity to Firestore.
 * Silent fail — never throws, never blocks UI.
 */
export async function logActivity(
  uid: string,
  type: ActivityType,
  payload: ActivityPayload
): Promise<void> {
  if (!uid) return;
  try {
    await addDoc(collection(db, 'userActivity', uid, 'activities'), {
      type,
      hadithId:   payload.hadithId,
      hadithText: payload.text?.slice(0, 120) || '',
      book:       payload.book || '',
      chapter:    payload.chapter || '',
      timestamp:  serverTimestamp(),
    });
  } catch (err) {
    // Non-blocking — activity logging should never crash the app
    console.warn('[activityLogger] Failed to log activity:', err);
  }
}
