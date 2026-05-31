// File: src/lib/journal/sync.ts
// Description: Real-time sync logic with offline support and migration
// Updated for async Supabase authentication

import { JournalEntry } from './types';
import { isFirebaseEnabled } from '../firebase/config';
import { getCurrentUserId, subscribeToAuthState } from '../firebase/auth';
import {
  getJournalEntries as getFirebaseEntries,
  addJournalEntry as addFirebaseEntry,
  updateJournalEntry as updateFirebaseEntry,
  deleteJournalEntry as deleteFirebaseEntry,
  batchAddJournalEntries,
  subscribeToJournalEntries,
} from '../firebase/firestore';

const STORAGE_KEY = 'axiompips_journal';
const MIGRATION_KEY = 'axiompips_migration_completed';
const OFFLINE_QUEUE_KEY = 'axiompips_offline_queue';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

type OfflineOperation = {
  id: string;
  type: 'add' | 'update' | 'delete';
  timestamp: number;
  data?: Partial<JournalEntry>;
  entryId?: string;
};

/**
 * Get offline operation queue
 */
function getOfflineQueue(): OfflineOperation[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading offline queue:', error);
    return [];
  }
}

/**
 * Save offline operation queue
 */
function saveOfflineQueue(queue: OfflineOperation[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error saving offline queue:', error);
  }
}

/**
 * Add operation to offline queue
 */
function queueOfflineOperation(operation: Omit<OfflineOperation, 'id' | 'timestamp'>): void {
  const queue = getOfflineQueue();
  const newOperation: OfflineOperation = {
    ...operation,
    id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  };
  queue.push(newOperation);
  saveOfflineQueue(queue);
}

/**
 * Process offline queue when back online
 */
async function processOfflineQueue(): Promise<void> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  console.log(`Processing ${queue.length} offline operations...`);

  try {
    for (const operation of queue) {
      switch (operation.type) {
        case 'add':
          if (operation.data) {
            await addFirebaseEntry(operation.data as Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>);
          }
          break;
        case 'update':
          if (operation.entryId && operation.data) {
            await updateFirebaseEntry(operation.entryId, operation.data);
          }
          break;
        case 'delete':
          if (operation.entryId) {
            await deleteFirebaseEntry(operation.entryId);
          }
          break;
      }
    }

    saveOfflineQueue([]);
    console.log('Offline queue processed successfully');
  } catch (error) {
    console.error('Error processing offline queue:', error);
    throw error;
  }
}

/**
 * Get entries from localStorage
 */
function getLocalStorageEntries(): JournalEntry[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const entries = JSON.parse(stored) as JournalEntry[];
    return entries.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error) {
    console.error('Error reading localStorage entries:', error);
    return [];
  }
}

/**
 * Save entries to localStorage (backup/fallback)
 */
function saveLocalStorageEntries(entries: JournalEntry[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

/**
 * Check if migration has been completed
 */
function isMigrationCompleted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(MIGRATION_KEY) === 'true';
}

/**
 * Mark migration as completed
 */
function markMigrationCompleted(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MIGRATION_KEY, 'true');
}

/**
 * Migrate data from localStorage to Firebase
 */
export async function migrateLocalStorageToFirebase(): Promise<{
  success: boolean;
  migratedCount: number;
  error?: string;
}> {
  if (isMigrationCompleted()) {
    console.log('Migration already completed');
    return { success: true, migratedCount: 0 };
  }

  // Get user ID from Supabase (async call)
  const userId = await getCurrentUserId();
  if (!userId) {
    return { 
      success: false, 
      migratedCount: 0, 
      error: 'User not authenticated' 
    };
  }

  try {
    const localEntries = getLocalStorageEntries();
    
    if (localEntries.length === 0) {
      console.log('No entries to migrate');
      markMigrationCompleted();
      return { success: true, migratedCount: 0 };
    }

    console.log(`Migrating ${localEntries.length} entries to Firebase...`);

    const firebaseEntries = await getFirebaseEntries();
    const existingIds = new Set(firebaseEntries.map(e => e.id));

    const entriesToMigrate = localEntries.filter(e => !existingIds.has(e.id));

    if (entriesToMigrate.length === 0) {
      console.log('All entries already in Firebase');
      markMigrationCompleted();
      return { success: true, migratedCount: 0 };
    }

    await batchAddJournalEntries(entriesToMigrate);

    markMigrationCompleted();

    console.log(`Successfully migrated ${entriesToMigrate.length} entries`);
    
    return { 
      success: true, 
      migratedCount: entriesToMigrate.length 
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return { 
      success: false, 
      migratedCount: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Initialize sync system
 * Migrates data if needed
 * Sets up real-time listeners
 * Processes offline queue
 */
export async function initializeSync(
  onEntriesUpdate: (entries: JournalEntry[]) => void,
  onStatusChange: (status: SyncStatus) => void
): Promise<() => void> {
  if (!isFirebaseEnabled()) {
    console.log('Firebase not enabled, using localStorage only');
    const entries = getLocalStorageEntries();
    onEntriesUpdate(entries);
    onStatusChange('offline');
    return () => {};
  }

  let unsubscribeAuth = () => {};
  let unsubscribeFirestore = () => {};

  // Subscribe to auth state changes
  // Callback is async because it calls async functions
  unsubscribeAuth = subscribeToAuthState(async (userId) => {
    if (userId) {
      // userId is the Supabase user ID string
      try {
        onStatusChange('syncing');

        // Try to process any offline operations first
        try {
          await processOfflineQueue();
        } catch (error) {
          console.warn('Failed to process offline queue:', error);
        }

        // Migrate data if needed
        const migrationResult = await migrateLocalStorageToFirebase();
        if (migrationResult.success && migrationResult.migratedCount > 0) {
          console.log(`Migrated ${migrationResult.migratedCount} entries`);
        }

        // Subscribe to real-time updates
        unsubscribeFirestore = subscribeToJournalEntries(
          (entries) => {
            onEntriesUpdate(entries);
            // Keep localStorage as backup
            saveLocalStorageEntries(entries);
            onStatusChange('synced');
          },
          (error) => {
            console.error('Firestore subscription error:', error);
            onStatusChange('error');
            // Fallback to localStorage
            const localEntries = getLocalStorageEntries();
            onEntriesUpdate(localEntries);
          }
        );
      } catch (error) {
        console.error('Sync initialization error:', error);
        onStatusChange('error');
        // Fallback to localStorage
        const localEntries = getLocalStorageEntries();
        onEntriesUpdate(localEntries);
      }
    } else {
      // User not authenticated, use localStorage
      const entries = getLocalStorageEntries();
      onEntriesUpdate(entries);
      onStatusChange('offline');
    }
  });

  // Return cleanup function
  return () => {
    unsubscribeAuth();
    unsubscribeFirestore();
  };
}

/**
 * Sync-aware add entry
 * Adds to Firebase if online, queues if offline
 */
export async function syncAddEntry(
  entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>
): Promise<JournalEntry> {
  // Get user ID from Supabase (async)
  const userId = await getCurrentUserId();

  if (isFirebaseEnabled() && userId) {
    try {
      return await addFirebaseEntry(entry);
    } catch (error) {
      console.warn('Failed to add to Firebase, queuing for offline sync:', error);
      queueOfflineOperation({ type: 'add', data: entry });
      
      // Add to localStorage as fallback
      const entries = getLocalStorageEntries();
      const newEntry: JournalEntry = {
        ...entry,
        id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      entries.push(newEntry);
      saveLocalStorageEntries(entries);
      
      return newEntry;
    }
  } else {
    // Fallback to localStorage
    const entries = getLocalStorageEntries();
    const newEntry: JournalEntry = {
      ...entry,
      id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    entries.push(newEntry);
    saveLocalStorageEntries(entries);
    
    return newEntry;
  }
}

/**
 * Sync-aware update entry
 */
export async function syncUpdateEntry(
  entryId: string,
  updates: Partial<JournalEntry>
): Promise<JournalEntry | null> {
  // Get user ID from Supabase (async)
  const userId = await getCurrentUserId();

  if (isFirebaseEnabled() && userId) {
    try {
      return await updateFirebaseEntry(entryId, updates);
    } catch (error) {
      console.warn('Failed to update in Firebase, queuing for offline sync:', error);
      queueOfflineOperation({ type: 'update', entryId, data: updates });
      
      // Update in localStorage as fallback
      const entries = getLocalStorageEntries();
      const index = entries.findIndex(e => e.id === entryId);
      if (index !== -1) {
        entries[index] = {
          ...entries[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        saveLocalStorageEntries(entries);
        return entries[index];
      }
      return null;
    }
  } else {
    // Fallback to localStorage
    const entries = getLocalStorageEntries();
    const index = entries.findIndex(e => e.id === entryId);
    if (index !== -1) {
      entries[index] = {
        ...entries[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      saveLocalStorageEntries(entries);
      return entries[index];
    }
    return null;
  }
}

/**
 * Sync-aware delete entry
 */
export async function syncDeleteEntry(entryId: string): Promise<boolean> {
  // Get user ID from Supabase (async)
  const userId = await getCurrentUserId();

  if (isFirebaseEnabled() && userId) {
    try {
      await deleteFirebaseEntry(entryId);
      return true;
    } catch (error) {
      console.warn('Failed to delete from Firebase, queuing for offline sync:', error);
      queueOfflineOperation({ type: 'delete', entryId });
      
      // Delete from localStorage as fallback
      const entries = getLocalStorageEntries();
      const filtered = entries.filter(e => e.id !== entryId);
      saveLocalStorageEntries(filtered);
      return filtered.length < entries.length;
    }
  } else {
    // Fallback to localStorage
    const entries = getLocalStorageEntries();
    const filtered = entries.filter(e => e.id !== entryId);
    saveLocalStorageEntries(filtered);
    return filtered.length < entries.length;
  }
}

/**
 * Get sync status
 */
export async function getSyncStatus(): Promise<SyncStatus> {
  if (!isFirebaseEnabled()) {
    return 'offline';
  }

  // Get user ID from Supabase (async)
  const userId = await getCurrentUserId();
  if (!userId) {
    return 'offline';
  }

  const queue = getOfflineQueue();
  if (queue.length > 0) {
    return 'syncing';
  }

  return 'synced';
}
