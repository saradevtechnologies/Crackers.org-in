'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from './ui';
import { EstimateCount } from './EstimateCount';

const isActive = (path: string, href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(href + '/'));

/** Sticky header that turns into frosted glass with a shadow once the page scrolls. */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-300 ${
        scrolled ? 'bg-white/85 shadow-[0_8px_24px_-12px_rgba(58,42,5,.25)] backdrop-blur-md' : 'bg-white/70 backdrop-blur-sm'
      }`}
    >
      {children}
    </header>
  );
}

/** Desktop nav link with an animated gold underline and active state. */
export function NavLink({ href, children, className = '' }: { href: string; children: React.ReactNode; className?: string }) {
  const active = isActive(usePathname(), href);
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`group relative py-1.5 font-medium transition-colors ${active ? 'text-maroon' : 'text-navy hover:text-maroon'} ${className}`}
    >
      {children}
      <span
        className={`absolute inset-x-0 -bottom-0.5 h-[2px] origin-left rounded-full bg-gradient-to-r from-maroon to-gold transition-transform duration-300 ${
          active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
        }`}
      />
    </Link>
  );
}

/** Bottom tab bar on phones, so the PWA feels like an app. */
export function MobileTabs() {
  const path = usePathname();
  const tabs = [
    { href: '/', label: 'Home', icon: 'home' as const },
    { href: '/products', label: 'Shop', icon: 'grid' as const },
    { href: '/estimate', label: 'Estimate', icon: 'file' as const },
    { href: '/orders', label: 'Orders', icon: 'box' as const },
    { href: '/account', label: 'Account', icon: 'user' as const },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-white/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-14px_rgba(58,42,5,.3)] backdrop-blur-md md:hidden">
      {tabs.map((t) => {
        const active = isActive(path, t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? 'page' : undefined}
            className={`relative flex min-h-[58px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
              active ? 'text-maroon hover:text-maroon' : 'text-[#6B5E4E] hover:text-navy'
            }`}
          >
            <span
              className={`absolute top-0 h-[3px] w-8 rounded-b-full bg-gradient-to-r from-maroon to-gold transition-all duration-300 ${
                active ? 'opacity-100' : 'scale-x-0 opacity-0'
              }`}
            />
            <span
              className={`relative flex h-8 w-12 items-center justify-center rounded-full transition-all duration-300 ${
                active ? 'bg-maroon-light' : ''
              }`}
            >
              <Icon name={t.icon} size={21} />
              {t.href === '/estimate' && (
                <span className="absolute -right-0.5 -top-1">
                  <EstimateCount />
                </span>
              )}
            </span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
