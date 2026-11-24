import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { EstimateCount } from './EstimateCount';
import { LogoMark, Wordmark } from './Logo';
import { HeaderShell, MobileTabs, NavLink } from './NavClient';
import { Icon } from './ui';
import { LangToggle } from './Lang';

export { MobileTabs };

const OFFERS = [
  'Diwali early booking is open',
  'Up to 80% off MRP',
  'Licensed Sivakasi manufacturers only',
  'Lorry parcel delivery across India',
  'Green crackers clearly marked',
];

function OfferStrip() {
  const items = [...OFFERS, ...OFFERS];
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-maroon-dark via-maroon to-maroon-dark text-[12px] font-medium text-[#F3D99A]">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap py-1.5 hover:[animation-play-state:paused]">
        {items.map((t, i) => (
          <span key={i} className="flex items-center gap-10">
            {t}
            <span aria-hidden="true" className="text-gold">✦</span>
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-maroon-dark to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-maroon-dark to-transparent" />
    </div>
  );
}

export async function Header() {
  const { profile } = await getSession();
  return (
    <>
      <OfferStrip />
      <HeaderShell>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
          <Link href="/" className="group flex items-center gap-2.5" aria-label="crackers.org.in home">
            <LogoMark className="transition-transform duration-500 group-hover:rotate-[20deg] group-hover:scale-105" />
            <Wordmark />
          </Link>

          <form
            action="/products"
            className="group order-last flex h-11 w-full flex-1 items-center gap-2 rounded-full border border-line bg-white/80 pl-4 pr-1 text-muted shadow-soft transition-all duration-200 focus-within:border-gold focus-within:bg-white focus-within:shadow-glow md:order-none md:w-auto"
          >
            <Icon name="search" className="transition-colors group-focus-within:text-maroon" />
            <label htmlFor="hq" className="sr-only">
              Search
            </label>
            <input
              id="hq"
              name="q"
              placeholder="Search crackers, gift boxes, shop ID"
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-navy outline-none placeholder:text-[#A39787]"
            />
            <button type="submit" className="btn-gold min-h-[36px] rounded-full px-4 text-xs">
              Search
            </button>
          </form>

          <nav className="ml-auto flex items-center gap-5 text-sm md:ml-0">
            <NavLink href="/products" className="hidden sm:inline">
              Shop
            </NavLink>
            {profile ? (
              <>
                {profile.role === 'admin' && <NavLink href="/admin">Admin</NavLink>}
                {profile.role === 'seller' && <NavLink href="/seller">Seller panel</NavLink>}
                <NavLink href="/orders" className="hidden sm:inline">
                  Orders
                </NavLink>
                <NavLink href="/account" className="hidden sm:inline">
                  Account
                </NavLink>
              </>
            ) : (
              <NavLink href="/login">Sign in</NavLink>
            )}
            <LangToggle />
            <Link href="/estimate" aria-label="Estimate" className="btn-primary min-h-[40px] rounded-full px-3 sm:px-4">
              <Icon name="file" size={17} />
              <span className="hidden sm:inline">Estimate</span>
              <EstimateCount />
            </Link>
          </nav>
        </div>
        <div className="toran" aria-hidden="true" />
      </HeaderShell>
    </>
  );
}

export function Footer() {
  return (
    <footer className="relative mt-16 bg-navy text-[#C9D2E3]">
      <div className="toran absolute inset-x-0 top-0" aria-hidden="true" />
      <div className="mx-auto flex max-w-6xl flex-wrap gap-x-12 gap-y-6 px-4 pb-10 pt-12 text-sm">
        <div className="max-w-xs flex-1">
          <div className="flex items-center gap-2.5">
            <LogoMark size={34} />
            <Wordmark light />
          </div>
          <p className="mt-3">Marketplace for licensed Sivakasi firecracker sellers.</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#F3D99A]">Sell & buy</p>
          <Link href="/sell" className="text-[#C9D2E3] hover:text-white">
            Sell on crackers.org.in
          </Link>
          <Link href="/bulk/apply" className="text-[#C9D2E3] hover:text-white">
            Bulk buyers (shop owners)
          </Link>
          <Link href="/safety" className="text-[#C9D2E3] hover:text-white">
            Safety guide
          </Link>
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#F3D99A]">Legal</p>
          <Link href="/terms" className="text-[#C9D2E3] hover:text-white">
            Terms
          </Link>
          <Link href="/privacy" className="text-[#C9D2E3] hover:text-white">
            Privacy
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-[#8D9AB5]">
        Celebrate safely. Burst crackers in open spaces, with a bucket of water nearby.
      </div>
    </footer>
  );
}
