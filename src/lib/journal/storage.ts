// File: src/lib/journal/storage-premium.ts
// Modified journal storage with premium cloud sync restriction
// REPLACE THE EXISTING src/lib/journal/storage.ts WITH THIS FILE

import { JournalEntry } from "./types";
import { isFirebaseEnabled } from "../firebase/config";
import { getCurrentUserId } from "../firebase/auth";
import {
  getJournalEntries as getFirebaseEntries,
  addJournalEntry as addFirebaseEntry,
  updateJournalEntry as updateFirebaseEntry,
  deleteJournalEntry as deleteFirebaseEntry,
  clearJournal as clearFirebaseJournal,
} from "../firebase/firestore";
import { hasCloudSyncAccess } from "../premium/service";

const STORAGE_KEY = "axiompips_journal";

/**
 * Gets all journal entries from localStorage (fallback/legacy)
 */
function getLocalStorageEntries(): JournalEntry[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const entries = JSON.parse(stored) as JournalEntry[];
    // Sort by date descending (newest first)
    return entries.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error) {
    console.error("Error reading journal entries from localStorage:", error);
    return [];
  }
}

/**
 * Saves all journal entries to localStorage (fallback/backup)
 */
function saveLocalStorageEntries(entries: JournalEntry[]): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error("Error saving journal entries to localStorage:", error);
  }
}

/**
 * Check if user has access to cloud sync (premium only)
 */
async function canUseCloudSync(): Promise<boolean> {
  const userId = getCurrentUserId();
  if (!userId || !isFirebaseEnabled()) return false;
  
  const hasAccess = await hasCloudSyncAccess();
  return hasAccess;
}

/**
 * Gets all journal entries.
 * Uses Firebase cloud sync ONLY for premium users, otherwise uses localStorage.
 */
export async function getJournalEntries(): Promise<JournalEntry[]> {
  const userId = getCurrentUserId();
  const cloudSyncEnabled = await canUseCloudSync();
  
  if (cloudSyncEnabled && userId) {
    try {
      return await getFirebaseEntries();
    } catch (error) {
      console.warn("Failed to get entries from Firebase, falling back to localStorage:", error);
      return getLocalStorageEntries();
    }
  }
  
  return getLocalStorageEntries();
}

/**
 * Gets all journal entries synchronously (for initial load).
 * Only works with localStorage - use getJournalEntries() for cloud sync.
 */
export function getJournalEntriesSync(): JournalEntry[] {
  return getLocalStorageEntries();
}

/**
 * Saves all journal entries to localStorage (backup only).
 * Use add/update/delete functions for cloud sync.
 */
export function saveJournalEntries(entries: JournalEntry[]): void {
  saveLocalStorageEntries(entries);
}

/**
 * Adds a new journal entry.
 * Saves to Firebase cloud sync ONLY for premium users, otherwise saves to localStorage.
 */
export async function addJournalEntry(
  entry: Omit<JournalEntry, "id" | "createdAt" | "updatedAt">
): Promise<JournalEntry> {
  const userId = getCurrentUserId();
  const cloudSyncEnabled = await canUseCloudSync();
  
  if (cloudSyncEnabled && userId) {
    try {
      const newEntry = await addFirebaseEntry(entry);
      
      // Also save to localStorage as backup
      const localEntries = getLocalStorageEntries();
      localEntries.push(newEntry);
      saveLocalStorageEntries(localEntries);
      
      return newEntry;
    } catch (error) {
      console.warn("Failed to add entry to Firebase, saving to localStorage only:", error);
      // Fall through to localStorage implementation
    }
  }
  
  // localStorage-only implementation for free users
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

/**
 * Updates an existing journal entry.
 * Updates in Firebase cloud sync ONLY for premium users, otherwise updates in localStorage.
 */
export async function updateJournalEntry(
  id: string,
  updates: Partial<JournalEntry>
): Promise<JournalEntry | null> {
  const userId = getCurrentUserId();
  const cloudSyncEnabled = await canUseCloudSync();
  
  if (cloudSyncEnabled && userId) {
    try {
      const updatedEntry = await updateFirebaseEntry(id, updates);
      
      // Also update in localStorage as backup
      const localEntries = getLocalStorageEntries();
      const index = localEntries.findIndex((e) => e.id === id);
      
      if (index !== -1) {
        localEntries[index] = updatedEntry;
        saveLocalStorageEntries(localEntries);
      }
      
      return updatedEntry;
    } catch (error) {
      console.warn("Failed to update entry in Firebase, updating localStorage only:", error);
      // Fall through to localStorage implementation
    }
  }
  
  // localStorage fallback for free users
  const entries = getLocalStorageEntries();
  const index = entries.findIndex((e) => e.id === id);
  
  if (index === -1) return null;
  
  entries[index] = {
    ...entries[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  saveLocalStorageEntries(entries);
  return entries[index];
}

/**
 * Deletes a journal entry.
 * Deletes from Firebase cloud sync ONLY for premium users, otherwise deletes from localStorage.
 */
export async function deleteJournalEntry(id: string): Promise<boolean> {
  const userId = getCurrentUserId();
  const cloudSyncEnabled = await canUseCloudSync();
  
  if (cloudSyncEnabled && userId) {
    try {
      await deleteFirebaseEntry(id);
      
      // Also delete from localStorage as backup
      const localEntries = getLocalStorageEntries();
      const filtered = localEntries.filter((e) => e.id !== id);
      saveLocalStorageEntries(filtered);
      
      return true;
    } catch (error) {
      console.warn("Failed to delete entry from Firebase, deleting from localStorage only:", error);
      // Fall through to localStorage implementation
    }
  }
  
  // localStorage fallback for free users
  const entries = getLocalStorageEntries();
  const filtered = entries.filter((e) => e.id !== id);
  
  if (filtered.length === entries.length) return false;
  
  saveLocalStorageEntries(filtered);
  return true;
}

/**
 * Clears all journal entries.
 * Clears from Firebase cloud sync ONLY for premium users, otherwise clears from localStorage.
 */
export async function clearJournal(): Promise<void> {
  const userId = getCurrentUserId();
  const cloudSyncEnabled = await canUseCloudSync();
  
  if (cloudSyncEnabled && userId) {
    try {
      await clearFirebaseJournal();
      
      // Also clear localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }
      
      return;
    } catch (error) {
      console.warn("Failed to clear journal from Firebase, clearing localStorage only:", error);
      // Fall through to localStorage implementation
    }
  }
  
  // localStorage fallback for free users
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Check if cloud sync is available and active for the current user
 */
export async function isCloudSyncActive(): Promise<boolean> {
  return await canUseCloudSync();
}

/**
 * Get cloud sync status message for display
 */
export async function getCloudSyncStatus(): Promise<string> {
  const cloudSyncEnabled = await canUseCloudSync();
  
  if (cloudSyncEnabled) {
    return "Cloud sync enabled - Your data is backed up automatically";
  } else {
    return "Local storage only - Upgrade to premium for cloud sync";
  }
}
