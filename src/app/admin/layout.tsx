import { requireAdmin } from '@/lib/auth';
import { PanelShell } from '@/components/PanelShell';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase } = await requireAdmin();
  const [pay, sellers, bulk, outbox] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'payment_submitted'),
    supabase.from('sellers').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('bulk_applications')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'renewal_pending'])
      .neq('document_paths', '{}'),
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('status', 'queued'),
  ]);
  const nav = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/payments', label: 'Payments', count: pay.count ?? 0 },
    { href: '/admin/orders', label: 'Orders' },
    { href: '/admin/sellers', label: 'Seller approvals', count: sellers.count ?? 0 },
    { href: '/admin/bulk', label: 'Bulk buyers', count: bulk.count ?? 0 },
    { href: '/admin/products', label: 'Catalogue review' },
    { href: '/admin/hero', label: 'Home page slides' },
    { href: '/admin/settings', label: 'Settings' },
    { href: '/admin/areas', label: 'PIN code / state blocks' },
    { href: '/admin/outbox', label: 'WhatsApp outbox', count: outbox.count ?? 0 },
  ];
  return (
    <PanelShell title="Admin" nav={nav}>
      {children}
    </PanelShell>
  );
}
