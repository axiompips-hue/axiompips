// File: src/app/api/admin/premium/route.ts
// Admin API for managing user premium status
// Requires ADMIN_SECRET_KEY env var for authorization

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function isAuthorized(req: NextRequest): boolean {
  const secret = req.headers.get('x-admin-secret')?.trim();
  const envKey = process.env.ADMIN_SECRET_KEY?.trim();

  // TEMP DEBUG — remove after fixing
  console.log('--- ADMIN AUTH DEBUG ---');
  console.log('Received secret length:', secret?.length);
  console.log('Env key length:        ', envKey?.length);
  console.log('Received secret:', JSON.stringify(secret));
  console.log('Env key:        ', JSON.stringify(envKey));
  console.log('Match:', secret === envKey);
  console.log('------------------------');

  if (!secret || !envKey) return false;
  return secret === envKey;
}

// GET /api/admin/premium - list all premium users + stats
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getAdminClient();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';

  try {
    // Get all premium records
    const { data: premiumData, error: premiumError } = await supabase
      .from('user_premium')
      .select('*')
      .order('created_at', { ascending: false });

    if (premiumError) throw premiumError;

    // Get user emails from auth.users
    const userIds = premiumData?.map((p) => p.user_id) || [];
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;

    const usersMap = new Map(usersData.users.map((u) => [u.id, u]));

    const enriched = (premiumData || [])
      .map((p) => {
        const user = usersMap.get(p.user_id);
        return {
          ...p,
          email: user?.email || 'Unknown',
          created_at_user: user?.created_at,
        };
      })
      .filter((p) =>
        search ? p.email.toLowerCase().includes(search.toLowerCase()) : true
      );

    const now = new Date();
    const stats = {
      total: enriched.length,
      activePremium: enriched.filter(
        (p) => p.subscription_ends_at && new Date(p.subscription_ends_at) > now
      ).length,
      onTrial: enriched.filter(
        (p) =>
          p.trial_ends_at &&
          new Date(p.trial_ends_at) > now &&
          (!p.subscription_ends_at || new Date(p.subscription_ends_at) <= now)
      ).length,
      expired: enriched.filter(
        (p) =>
          (!p.subscription_ends_at || new Date(p.subscription_ends_at) <= now) &&
          (!p.trial_ends_at || new Date(p.trial_ends_at) <= now)
      ).length,
    };

    return NextResponse.json({ users: enriched, stats });
  } catch (err: any) {
    console.error('Admin GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/premium - grant/update premium by email or userId
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getAdminClient();

  try {
    const body = await req.json();
    const { email, userId, plan, durationDays, action } = body;

    // Resolve user
    let resolvedUserId = userId;
    let resolvedEmail = email;

    if (!resolvedUserId && email) {
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const found = usersData?.users.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );
      if (!found) {
        return NextResponse.json({ error: `No user found with email: ${email}` }, { status: 404 });
      }
      resolvedUserId = found.id;
      resolvedEmail = found.email;
    }

    if (!resolvedUserId) {
      return NextResponse.json({ error: 'Must provide email or userId' }, { status: 400 });
    }

    if (action === 'revoke') {
      // Set subscription_ends_at to now (expire immediately)
      const { error } = await supabase
        .from('user_premium')
        .update({
          subscription_ends_at: new Date().toISOString(),
          subscription_plan: 'free',
        })
        .eq('user_id', resolvedUserId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: `Premium revoked for ${resolvedEmail}` });
    }

    // Grant premium
    const days = durationDays || (plan === 'yearly' ? 365 : 30);
    const subscriptionEndsAt = new Date();
    subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + days);

    // Upsert premium record
    const { error } = await supabase.from('user_premium').upsert(
      {
        user_id: resolvedUserId,
        subscription_plan: plan || 'monthly',
        subscription_ends_at: subscriptionEndsAt.toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Premium granted to ${resolvedEmail} until ${subscriptionEndsAt.toLocaleDateString()}`,
      subscriptionEndsAt: subscriptionEndsAt.toISOString(),
    });
  } catch (err: any) {
    console.error('Admin POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
