import Link from 'next/link';
import { LogoMark } from './Logo';

export interface NavItem {
  href: string;
  label: string;
  count?: number;
}

/** Side-menu layout for the seller and admin panels. The menu stacks on top on phones. */
export function PanelShell({
  title,
  sub,
  nav,
  children,
}: {
  title: string;
  sub?: string;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-wrap bg-[#F7F5F0]">
      <aside className="flex w-full flex-col gap-1 bg-navy p-4 text-sm text-[#C9D2E3] md:min-h-screen md:w-60">
        <Link href="/" className="mb-4 flex items-center gap-2.5 text-white hover:text-white">
          <LogoMark size={36} />
          <span>
            <span className="block font-semibold">{title}</span>
            {sub && <span className="block text-xs text-[#C9D2E3]">{sub}</span>}
          </span>
        </Link>
        <nav className="flex flex-wrap gap-1 md:flex-col">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-[#C9D2E3] transition-colors hover:bg-[#2C3B5C] hover:text-white"
            >
              {n.label}
              {!!n.count && <span className="rounded-full bg-gold px-2 text-xs text-gold-text">{n.count}</span>}
            </Link>
          ))}
        </nav>
        <form action="/auth/signout" method="post" className="mt-auto pt-4">
          <button className="w-full rounded-lg px-3 py-2.5 text-left text-[#C9D2E3] hover:bg-[#2C3B5C] hover:text-white">Sign out</button>
        </form>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
