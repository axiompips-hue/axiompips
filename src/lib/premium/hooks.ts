// File: src/lib/premium/hooks.ts
// React hooks for premium features

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getPremiumStatus,
  getUsageLimits,
  canUseCalculator,
  canAddJournalEntry,
  canUseAdvancedTool,
  canExportData,
  hasCloudSyncAccess,
  incrementCalculatorUse,
  incrementJournalEntry,
  incrementAdvancedToolUse,
  type PremiumStatus,
  type UsageLimits,
} from './service';

/**
 * Hook to get and manage premium status
 */
export function usePremiumStatus() {
  const [status, setStatus] = useState<PremiumStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshStatus = useCallback(async () => {
    try {
      const premiumStatus = await getPremiumStatus();
      setStatus(premiumStatus);
    } catch (error) {
      console.error('Error fetching premium status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return {
    status,
    loading,
    isPremium: status?.isPremium || false,
    isOnTrial: status?.isOnTrial || false,
    refresh: refreshStatus,
  };
}

/**
 * Hook to get and manage usage limits
 */
export function useUsageLimits() {
  const [limits, setLimits] = useState<UsageLimits | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshLimits = useCallback(async () => {
    try {
      const usageLimits = await getUsageLimits();
      setLimits(usageLimits);
    } catch (error) {
      console.error('Error fetching usage limits:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshLimits();
  }, [refreshLimits]);

  return {
    limits,
    loading,
    refresh: refreshLimits,
  };
}

/**
 * Hook to check calculator usage permission
 */
export function useCalculatorPermission() {
  const [canUse, setCanUse] = useState(true);
  const [loading, setLoading] = useState(true);
  const { limits, refresh } = useUsageLimits();

  useEffect(() => {
    const checkPermission = async () => {
      const permitted = await canUseCalculator();
      setCanUse(permitted);
      setLoading(false);
    };

    checkPermission();
  }, [limits]);

  const trackUsage = useCallback(async () => {
    const success = await incrementCalculatorUse();
    if (success) {
      await refresh();
    }
    return success;
  }, [refresh]);

  return {
    canUse,
    loading,
    trackUsage,
    remainingUses: limits?.maxCalculatorUses === -1 
      ? 'Unlimited' 
      : Math.max(0, (limits?.maxCalculatorUses || 0) - (limits?.calculatorUses || 0)),
  };
}

/**
 * Hook to check journal entry permission
 */
export function useJournalPermission() {
  const [canAdd, setCanAdd] = useState(true);
  const [loading, setLoading] = useState(true);
  const { limits, refresh } = useUsageLimits();

  useEffect(() => {
    const checkPermission = async () => {
      const permitted = await canAddJournalEntry();
      setCanAdd(permitted);
      setLoading(false);
    };

    checkPermission();
  }, [limits]);

  const trackEntry = useCallback(async () => {
    const success = await incrementJournalEntry();
    if (success) {
      await refresh();
    }
    return success;
  }, [refresh]);

  return {
    canAdd,
    loading,
    trackEntry,
    remainingEntries: limits?.maxJournalEntries === -1 
      ? 'Unlimited' 
      : Math.max(0, (limits?.maxJournalEntries || 0) - (limits?.journalEntries || 0)),
  };
}

/**
 * Hook to check advanced tool permission
 */
export function useAdvancedToolPermission() {
  const [canUse, setCanUse] = useState(true);
  const [loading, setLoading] = useState(true);
  const { limits, refresh } = useUsageLimits();

  useEffect(() => {
    const checkPermission = async () => {
      const permitted = await canUseAdvancedTool();
      setCanUse(permitted);
      setLoading(false);
    };

    checkPermission();
  }, [limits]);

  const trackUsage = useCallback(async () => {
    const success = await incrementAdvancedToolUse();
    if (success) {
      await refresh();
    }
    return success;
  }, [refresh]);

  return {
    canUse,
    loading,
    trackUsage,
    remainingUses: limits?.maxAdvancedToolUses === -1 
      ? 'Unlimited' 
      : Math.max(0, (limits?.maxAdvancedToolUses || 0) - (limits?.advancedToolUses || 0)),
  };
}

/**
 * Hook to check export permission
 */
export function useExportPermission() {
  const [canExport, setCanExport] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      const permitted = await canExportData();
      setCanExport(permitted);
      setLoading(false);
    };

    checkPermission();
  }, []);

  return {
    canExport,
    loading,
  };
}

/**
 * Hook to check cloud sync access
 */
export function useCloudSyncAccess() {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      const access = await hasCloudSyncAccess();
      setHasAccess(access);
      setLoading(false);
    };

    checkAccess();
  }, []);

  return {
    hasAccess,
    loading,
  };
}
