// File: src/lib/firebase/firestore.ts
// Updated for async user ID from Supabase

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  writeBatch,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from './config';
import { getCurrentUserId } from './auth';
import { JournalEntry } from '../journal/types';

// Collection path helper
function getUserJournalCollection(userId: string) {
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  return collection(db, 'users', userId, 'journal');
}

// Document path helper
function getUserJournalDoc(userId: string, entryId: string) {
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  return doc(db, 'users', userId, 'journal', entryId);
}

/**
 * Convert Firestore timestamp to ISO string
 */
function convertTimestamps(data: DocumentData): JournalEntry {
  const entry = { ...data } as JournalEntry;
  
  if (entry.createdAt && typeof entry.createdAt !== 'string') {
    entry.createdAt = (entry.createdAt as unknown as Timestamp).toDate().toISOString();
  }
  if (entry.updatedAt && typeof entry.updatedAt !== 'string') {
    entry.updatedAt = (entry.updatedAt as unknown as Timestamp).toDate().toISOString();
  }
  
  return entry;
}

/**
 * Get all journal entries for current user
 */
export async function getJournalEntries(): Promise<JournalEntry[]> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    const journalCollection = getUserJournalCollection(userId);
    const q = query(journalCollection, orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);

    const entries: JournalEntry[] = [];
    querySnapshot.forEach((doc) => {
      entries.push(convertTimestamps({ ...doc.data(), id: doc.id }));
    });

    return entries;
  } catch (error) {
    console.error('Error getting journal entries:', error);
    throw error;
  }
}

/**
 * Add a new journal entry
 */
export async function addJournalEntry(
  entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>
): Promise<JournalEntry> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    const entryId = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const newEntry: JournalEntry = {
      ...entry,
      id: entryId,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = getUserJournalDoc(userId, entryId);
    await setDoc(docRef, newEntry);

    return newEntry;
  } catch (error) {
    console.error('Error adding journal entry:', error);
    throw error;
  }
}

/**
 * Update an existing journal entry
 */
export async function updateJournalEntry(
  entryId: string,
  updates: Partial<JournalEntry>
): Promise<JournalEntry> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    const docRef = getUserJournalDoc(userId, entryId);
    
    const { id, createdAt, ...allowedUpdates } = updates;
    
    const updateData = {
      ...allowedUpdates,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(docRef, updateData);

    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return convertTimestamps({ ...docSnap.data(), id: docSnap.id });
    }

    throw new Error('Entry not found after update');
  } catch (error) {
    console.error('Error updating journal entry:', error);
    throw error;
  }
}

/**
 * Delete a journal entry
 */
export async function deleteJournalEntry(entryId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    const docRef = getUserJournalDoc(userId, entryId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    throw error;
  }
}

/**
 * Batch add multiple journal entries
 */
export async function batchAddJournalEntries(
  entries: JournalEntry[]
): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const batch = writeBatch(db);

    entries.forEach((entry) => {
      const docRef = getUserJournalDoc(userId, entry.id);
      batch.set(docRef, entry);
    });

    await batch.commit();
  } catch (error) {
    console.error('Error batch adding journal entries:', error);
    throw error;
  }
}

/**
 * Clear all journal entries for current user
 */
export async function clearJournal(): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const journalCollection = getUserJournalCollection(userId);
    const querySnapshot = await getDocs(journalCollection);

    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error('Error clearing journal:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time journal updates
 */
export function subscribeToJournalEntries(
  callback: (entries: JournalEntry[]) => void,
  onError?: (error: Error) => void
): () => void {
  // Get userId immediately for this session
  let unsubscribeSnapshot: (() => void) | null = null;

  getCurrentUserId().then((userId) => {
    if (!userId) {
      if (onError) {
        onError(new Error('User not authenticated'));
      }
      return;
    }

    try {
      const journalCollection = getUserJournalCollection(userId);
      const q = query(journalCollection, orderBy('date', 'desc'));

      unsubscribeSnapshot = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const entries: JournalEntry[] = [];
          snapshot.forEach((doc) => {
            entries.push(convertTimestamps({ ...doc.data(), id: doc.id }));
          });
          callback(entries);
        },
        (error) => {
          console.error('Error in journal subscription:', error);
          if (onError) {
            onError(error as Error);
          }
        }
      );
    } catch (error) {
      console.error('Error subscribing to journal:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  });

  return () => {
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
    }
  };
}

/**
 * Check if Firebase sync is available
 */
export async function isFirestoreAvailable(): Promise<boolean> {
  const userId = await getCurrentUserId();
  return db !== undefined && userId !== null;
}