'use client';

// File: src/app/admin/AdminPremiumPanel.tsx
// Admin panel for managing user premium subscriptions

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PremiumUser {
  id: string;
  user_id: string;
  email: string;
  subscription_plan: 'free' | 'monthly' | 'yearly';
  subscription_ends_at: string | null;
  trial_ends_at: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  activePremium: number;
  onTrial: number;
  expired: number;
}

type PlanType = 'monthly' | 'yearly' | 'custom';
type Toast = { type: 'success' | 'error'; message: string } | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getUserStatus(user: PremiumUser) {
  const now = new Date();
  const subEnd = user.subscription_ends_at ? new Date(user.subscription_ends_at) : null;
  const trialEnd = user.trial_ends_at ? new Date(user.trial_ends_at) : null;

  if (subEnd && subEnd > now) return 'premium';
  if (trialEnd && trialEnd > now) return 'trial';
  return 'free';
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function timeUntil(dateStr: string | null) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days === 1) return '1 day left';
  if (days < 30) return `${days} days left`;
  const months = Math.floor(days / 30);
  return `${months}mo left`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
}) {
  return (
    <div className="bg-neutral-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-4">
      <div className={`text-2xl w-10 h-10 flex items-center justify-center rounded-lg ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-zinc-100 font-mono">{value}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs = {
    premium: 'bg-accent-950 text-accent-400 border border-accent-800',
    trial: 'bg-amber-950 text-amber-400 border border-amber-800',
    free: 'bg-zinc-900 text-zinc-500 border border-zinc-700',
  } as Record<string, string>;

  const labels = {
    premium: '✦ Premium',
    trial: '◎ Trial',
    free: '○ Free',
  } as Record<string, string>;

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${configs[status] || configs.free}`}>
      {labels[status] || status}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminPremiumPanel() {
  const [secretKey, setSecretKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  const [users, setUsers] = useState<PremiumUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  // Grant form state
  const [grantEmail, setGrantEmail] = useState('');
  const [grantPlan, setGrantPlan] = useState<PlanType>('monthly');
  const [customDays, setCustomDays] = useState('30');
  const [isGranting, setIsGranting] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUsers = useCallback(
    async (searchTerm = '') => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/admin/premium${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`,
          { headers: { 'x-admin-secret': secretKey } }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setUsers(data.users ?? []);
        setStats(data.stats ?? null);
      } catch (err: any) {
        showToast('error', err.message || 'Failed to load users');
      } finally {
        setIsLoading(false);
      }
    },
    [secretKey]
  );

  const handleAuth = async () => {
    setAuthError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/premium', {
        headers: { 'x-admin-secret': secretKey },
      });
      if (res.status === 401) {
        setAuthError('Invalid secret key');
        return;
      }
      const data = await res.json();
      setUsers(data.users ?? []);
      setStats(data.stats ?? null);
      setIsAuthenticated(true);
    } catch {
      setAuthError('Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrant = async () => {
    if (!grantEmail.trim()) return showToast('error', 'Enter an email address');
    setIsGranting(true);
    try {
      const days =
        grantPlan === 'yearly'
          ? 365
          : grantPlan === 'monthly'
          ? 30
          : parseInt(customDays) || 30;

      const res = await fetch('/api/admin/premium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secretKey,
        },
        body: JSON.stringify({
          email: grantEmail.trim(),
          plan: grantPlan === 'custom' ? 'monthly' : grantPlan,
          durationDays: days,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('success', data.message);
      setGrantEmail('');
      fetchUsers(search);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to grant premium');
    } finally {
      setIsGranting(false);
    }
  };

  const handleRevoke = async (userId: string, email: string) => {
    if (!confirm(`Revoke premium for ${email}?`)) return;
    try {
      const res = await fetch('/api/admin/premium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secretKey,
        },
        body: JSON.stringify({ userId, action: 'revoke' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('success', data.message);
      fetchUsers(search);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to revoke premium');
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setTimeout(() => fetchUsers(search), 300);
    return () => clearTimeout(timer);
  }, [search, isAuthenticated, fetchUsers]);

  // ─── Auth gate ───────────────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-950 border border-accent-800 mb-4">
              <svg className="w-7 h-7 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 11.25c0 5.967 4.195 10.916 9.75 12.456 5.555-1.54 9.75-6.489 9.75-12.456 0-1.818-.372-3.547-1.037-5.131A12.01 12.01 0 0112 2.714z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-zinc-100">Admin Access</h1>
            <p className="text-sm text-zinc-500 mt-1">AxiomPips Premium Manager</p>
          </div>

          <div className="bg-neutral-900 border border-zinc-800 rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Secret Key
              </label>
              <input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                placeholder="Enter ADMIN_SECRET_KEY"
                className="w-full px-3 py-2.5 bg-neutral-950 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:border-accent-500 focus:ring-accent-500 font-mono text-sm"
              />
              {authError && (
                <p className="mt-2 text-xs text-red-400">{authError}</p>
              )}
            </div>
            <button
              onClick={handleAuth}
              disabled={isLoading || !secretKey}
              className="w-full bg-accent-600 hover:bg-accent-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors duration-150 text-sm"
            >
              {isLoading ? 'Authenticating...' : 'Access Admin Panel'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main panel ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-neutral-950 text-zinc-100">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium shadow-lg transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-950 border-emerald-800 text-emerald-300'
              : 'bg-red-950 border-red-800 text-red-300'
          }`}
        >
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          {toast.message}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-accent-400 text-xs font-mono font-medium uppercase tracking-widest">
                AxiomPips
              </span>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-500 text-xs font-mono">Admin</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-100">Premium Manager</h1>
          </div>
          <button
            onClick={() => fetchUsers(search)}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors duration-150"
          >
            <svg
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total tracked" value={stats.total} color="bg-zinc-800 text-zinc-300" icon="◈" />
            <StatCard label="Active premium" value={stats.activePremium} color="bg-accent-950 text-accent-400" icon="✦" />
            <StatCard label="On trial" value={stats.onTrial} color="bg-amber-950 text-amber-400" icon="◎" />
            <StatCard label="Expired / Free" value={stats.expired} color="bg-zinc-800 text-zinc-500" icon="○" />
          </div>
        )}

        {/* Grant premium */}
        <div className="bg-neutral-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-md bg-accent-950 border border-accent-800 flex items-center justify-center text-accent-400 text-sm">
              ✦
            </div>
            <h2 className="text-base font-semibold text-zinc-100">Grant Premium</h2>
          </div>

          <div className="grid sm:grid-cols-[1fr_auto_auto_auto] gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                User email
              </label>
              <input
                type="email"
                value={grantEmail}
                onChange={(e) => setGrantEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGrant()}
                placeholder="user@example.com"
                className="w-full px-3 py-2.5 bg-neutral-950 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:border-accent-500 focus:ring-accent-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Plan</label>
              <div className="flex rounded-lg overflow-hidden border border-zinc-700">
                {(['monthly', 'yearly', 'custom'] as PlanType[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setGrantPlan(p)}
                    className={`px-3 py-2.5 text-xs font-medium capitalize transition-colors duration-150 ${
                      grantPlan === p
                        ? 'bg-accent-600 text-white'
                        : 'bg-neutral-950 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {grantPlan === 'custom' && (
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Days</label>
                <input
                  type="number"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  min="1"
                  max="3650"
                  className="w-24 px-3 py-2.5 bg-neutral-950 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-1 focus:border-accent-500 focus:ring-accent-500 text-sm"
                />
              </div>
            )}

            <button
              onClick={handleGrant}
              disabled={isGranting || !grantEmail}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent-600 hover:bg-accent-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-150 text-sm whitespace-nowrap"
            >
              {isGranting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Granting…
                </>
              ) : (
                <>Grant Premium</>
              )}
            </button>
          </div>

          <p className="mt-3 text-xs text-zinc-600">
            {grantPlan === 'monthly' && 'Grants 30 days of premium access.'}
            {grantPlan === 'yearly' && 'Grants 365 days of premium access.'}
            {grantPlan === 'custom' && `Grants ${customDays} days of premium access.`}
            {' '}If the user already has premium, the new expiry date will replace the old one.
          </p>
        </div>

        {/* Users table */}
        <div className="bg-neutral-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-zinc-100">All Users</h2>
            <div className="relative flex-1 max-w-xs">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email…"
                className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:border-accent-500 focus:ring-accent-500"
              />
            </div>
          </div>

          {isLoading && users.length === 0 ? (
            <div className="py-16 text-center">
              <div className="inline-block w-6 h-6 border-2 border-accent-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-zinc-500">Loading users…</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-zinc-500">No users found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Expires
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Trial ends
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {users.map((user) => {
                    const status = getUserStatus(user);
                    return (
                      <tr
                        key={user.user_id}
                        className="hover:bg-neutral-850 transition-colors duration-100"
                      >
                        <td className="px-6 py-4">
                          <span className="text-zinc-200 font-medium">{user.email}</span>
                          <p className="text-xs text-zinc-600 font-mono mt-0.5">{user.user_id.slice(0, 8)}…</p>
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={status} />
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-zinc-300 capitalize">
                            {user.subscription_plan || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-zinc-300">{formatDate(user.subscription_ends_at)}</span>
                          {user.subscription_ends_at && (
                            <p className="text-xs text-zinc-600 mt-0.5">
                              {timeUntil(user.subscription_ends_at)}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-zinc-400">{formatDate(user.trial_ends_at)}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Quick extend */}
                            <button
                              onClick={() => {
                                setGrantEmail(user.email);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="px-2.5 py-1.5 text-xs text-accent-400 hover:text-accent-300 bg-accent-950 hover:bg-accent-900 border border-accent-800 rounded-md transition-colors duration-150"
                            >
                              Edit
                            </button>
                            {status === 'premium' && (
                              <button
                                onClick={() => handleRevoke(user.user_id, user.email)}
                                className="px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300 bg-red-950 hover:bg-red-900 border border-red-900 rounded-md transition-colors duration-150"
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-6 py-3 border-t border-zinc-800 flex items-center justify-between">
            <p className="text-xs text-zinc-600">
              Showing {users.length} user{users.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-zinc-700 font-mono">
              user_premium · Supabase
            </p>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-zinc-700">
          Changes take effect immediately. Users may need to refresh to see updated access.
        </p>
      </div>
    </div>
  );
}
