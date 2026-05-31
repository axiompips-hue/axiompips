// File: src/app/admin/page.tsx
// Admin page — no auth middleware, protected by secret key in the panel itself

import type { Metadata } from 'next';
import AdminPremiumPanel from './AdminPremiumPanel';

export const metadata: Metadata = {
  title: 'Admin | AxiomPips',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminPremiumPanel />;
}
