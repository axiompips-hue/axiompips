// File: src/lib/premium/service.ts
// Premium subscription service with usage tracking

import { createClient } from '@/lib/supabase/client';
import { getCurrentUserId } from '@/lib/firebase/auth';

export interface PremiumStatus {
  isPremium: boolean;
  isOnTrial: boolean;
  trialEndsAt: Date | null;
  subscriptionEndsAt: Date | null;
  plan: 'free' | 'monthly' | 'yearly';
}

export interface UsageLimits {
  calculatorUses: number;
  maxCalculatorUses: number;
  journalEntries: number;
  maxJournalEntries: number;
  advancedToolUses: number;
  maxAdvancedToolUses: number;
  lastResetDate: string;
}

const FREE_LIMITS = {
  calculatorUses: 10,
  journalEntries: 50,
  advancedToolUses: 2,
};

/**
 * Get user's premium status from Supabase
 */
export async function getPremiumStatus(): Promise<PremiumStatus> {
  const supabase = createClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    return {
      isPremium: false,
      isOnTrial: false,
      trialEndsAt: null,
      subscriptionEndsAt: null,
      plan: 'free',
    };
  }

  try {
    const { data, error } = await supabase
      .from('user_premium')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      // No premium record found, check if trial should start
      const trialEndsAt = await initializeTrial(userId);
      return {
        isPremium: false,
        isOnTrial: trialEndsAt ? new Date() < trialEndsAt : false,
        trialEndsAt: trialEndsAt,
        subscriptionEndsAt: null,
        plan: 'free',
      };
    }

    const now = new Date();
    const trialEndsAt = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
    const subscriptionEndsAt = data.subscription_ends_at ? new Date(data.subscription_ends_at) : null;

    const isOnTrial = trialEndsAt ? now < trialEndsAt : false;
    const hasActiveSubscription = subscriptionEndsAt ? now < subscriptionEndsAt : false;

    return {
      isPremium: hasActiveSubscription,
      isOnTrial: isOnTrial && !hasActiveSubscription,
      trialEndsAt,
      subscriptionEndsAt,
      plan: data.subscription_plan || 'free',
    };
  } catch (error) {
    console.error('Error fetching premium status:', error);
    return {
      isPremium: false,
      isOnTrial: false,
      trialEndsAt: null,
      subscriptionEndsAt: null,
      plan: 'free',
    };
  }
}

/**
 * Initialize 7-day free trial for new users
 */
async function initializeTrial(userId: string): Promise<Date | null> {
  const supabase = createClient();
  
  try {
    // Check if user already has a record
    const { data: existing } = await supabase
      .from('user_premium')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      return null; // Already initialized
    }

    // Create trial period (7 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    const { error } = await supabase
      .from('user_premium')
      .insert({
        user_id: userId,
        trial_ends_at: trialEndsAt.toISOString(),
        subscription_plan: 'free',
      });

    if (error) {
      console.error('Error initializing trial:', error);
      return null;
    }

    return trialEndsAt;
  } catch (error) {
    console.error('Error initializing trial:', error);
    return null;
  }
}

/**
 * Get user's current usage statistics
 */
export async function getUsageLimits(): Promise<UsageLimits> {
  const supabase = createClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    return {
      calculatorUses: 0,
      maxCalculatorUses: FREE_LIMITS.calculatorUses,
      journalEntries: 0,
      maxJournalEntries: FREE_LIMITS.journalEntries,
      advancedToolUses: 0,
      maxAdvancedToolUses: FREE_LIMITS.advancedToolUses,
      lastResetDate: new Date().toISOString(),
    };
  }

  const status = await getPremiumStatus();
  const isPremiumOrTrial = status.isPremium || status.isOnTrial;

  try {
    const { data, error } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      // Initialize usage tracking
      await initializeUsageTracking(userId);
      return {
        calculatorUses: 0,
        maxCalculatorUses: isPremiumOrTrial ? -1 : FREE_LIMITS.calculatorUses,
        journalEntries: 0,
        maxJournalEntries: isPremiumOrTrial ? -1 : FREE_LIMITS.journalEntries,
        advancedToolUses: 0,
        maxAdvancedToolUses: isPremiumOrTrial ? -1 : FREE_LIMITS.advancedToolUses,
        lastResetDate: new Date().toISOString(),
      };
    }

    // Check if we need to reset daily/weekly limits
    const lastReset = new Date(data.last_reset_date);
    const now = new Date();
    const shouldResetDaily = now.toDateString() !== lastReset.toDateString();
    const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
    const shouldResetWeekly = daysSinceReset >= 7;

    if (shouldResetDaily || shouldResetWeekly) {
      await resetUsageLimits(userId, shouldResetWeekly);
      return await getUsageLimits(); // Recursive call to get fresh data
    }

    return {
      calculatorUses: data.calculator_uses || 0,
      maxCalculatorUses: isPremiumOrTrial ? -1 : FREE_LIMITS.calculatorUses,
      journalEntries: data.journal_entries || 0,
      maxJournalEntries: isPremiumOrTrial ? -1 : FREE_LIMITS.journalEntries,
      advancedToolUses: data.advanced_tool_uses || 0,
      maxAdvancedToolUses: isPremiumOrTrial ? -1 : FREE_LIMITS.advancedToolUses,
      lastResetDate: data.last_reset_date,
    };
  } catch (error) {
    console.error('Error fetching usage limits:', error);
    return {
      calculatorUses: 0,
      maxCalculatorUses: isPremiumOrTrial ? -1 : FREE_LIMITS.calculatorUses,
      journalEntries: 0,
      maxJournalEntries: isPremiumOrTrial ? -1 : FREE_LIMITS.journalEntries,
      advancedToolUses: 0,
      maxAdvancedToolUses: isPremiumOrTrial ? -1 : FREE_LIMITS.advancedToolUses,
      lastResetDate: new Date().toISOString(),
    };
  }
}

/**
 * Initialize usage tracking for a new user
 */
async function initializeUsageTracking(userId: string): Promise<void> {
  const supabase = createClient();

  try {
    await supabase.from('user_usage').insert({
      user_id: userId,
      calculator_uses: 0,
      journal_entries: 0,
      advanced_tool_uses: 0,
      last_reset_date: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error initializing usage tracking:', error);
  }
}

/**
 * Reset usage limits (daily for calculators, weekly for advanced tools)
 */
async function resetUsageLimits(userId: string, resetWeekly: boolean): Promise<void> {
  const supabase = createClient();

  try {
    const updates: any = {
      calculator_uses: 0,
      last_reset_date: new Date().toISOString(),
    };

    if (resetWeekly) {
      updates.advanced_tool_uses = 0;
    }

    await supabase
      .from('user_usage')
      .update(updates)
      .eq('user_id', userId);
  } catch (error) {
    console.error('Error resetting usage limits:', error);
  }
}

/**
 * Increment calculator usage count
 */
export async function incrementCalculatorUse(): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const limits = await getUsageLimits();
  
  // Premium users have unlimited access (-1 means unlimited)
  if (limits.maxCalculatorUses === -1) return true;

  // Check if user has reached the limit
  if (limits.calculatorUses >= limits.maxCalculatorUses) {
    return false;
  }

  const supabase = createClient();

  try {
    const { error } = await supabase.rpc('increment_calculator_use', {
      p_user_id: userId,
    });

    return !error;
  } catch (error) {
    console.error('Error incrementing calculator use:', error);
    return false;
  }
}

/**
 * Increment journal entry count
 */
export async function incrementJournalEntry(): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const limits = await getUsageLimits();

  // Premium users have unlimited access
  if (limits.maxJournalEntries === -1) return true;

  // Check if user has reached the limit
  if (limits.journalEntries >= limits.maxJournalEntries) {
    return false;
  }

  const supabase = createClient();

  try {
    const { error } = await supabase.rpc('increment_journal_entry', {
      p_user_id: userId,
    });

    return !error;
  } catch (error) {
    console.error('Error incrementing journal entry:', error);
    return false;
  }
}

/**
 * Increment advanced tool usage count
 */
export async function incrementAdvancedToolUse(): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const limits = await getUsageLimits();

  // Premium users have unlimited access
  if (limits.maxAdvancedToolUses === -1) return true;

  // Check if user has reached the limit
  if (limits.advancedToolUses >= limits.maxAdvancedToolUses) {
    return false;
  }

  const supabase = createClient();

  try {
    const { error } = await supabase.rpc('increment_advanced_tool_use', {
      p_user_id: userId,
    });

    return !error;
  } catch (error) {
    console.error('Error incrementing advanced tool use:', error);
    return false;
  }
}

/**
 * Check if user can use calculators
 */
export async function canUseCalculator(): Promise<boolean> {
  const limits = await getUsageLimits();
  return limits.maxCalculatorUses === -1 || limits.calculatorUses < limits.maxCalculatorUses;
}

/**
 * Check if user can add journal entries
 */
export async function canAddJournalEntry(): Promise<boolean> {
  const limits = await getUsageLimits();
  return limits.maxJournalEntries === -1 || limits.journalEntries < limits.maxJournalEntries;
}

/**
 * Check if user can use advanced tools
 */
export async function canUseAdvancedTool(): Promise<boolean> {
  const limits = await getUsageLimits();
  return limits.maxAdvancedToolUses === -1 || limits.advancedToolUses < limits.maxAdvancedToolUses;
}

/**
 * Check if user can export data (premium only feature)
 */
export async function canExportData(): Promise<boolean> {
  const status = await getPremiumStatus();
  return status.isPremium || status.isOnTrial;
}

/**
 * Check if user has cloud sync access (premium only feature)
 */
export async function hasCloudSyncAccess(): Promise<boolean> {
  const status = await getPremiumStatus();
  return status.isPremium;
}
