export interface HeroSlide {
  id: string;
  sort: number;
  active: boolean;
  badge: string | null;
  title: string;
  subtitle: string | null;
  offer: string | null;
  primary_label: string | null;
  primary_href: string | null;
  secondary_label: string | null;
  secondary_href: string | null;
  image_url: string | null;
}

/** Shown when the hero_slides table is empty or not created yet: the original hero. */
export const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: 'default',
    sort: 1,
    active: true,
    badge: 'Diwali early booking is open',
    title: 'Sivakasi crackers, *direct* from verified sellers',
    subtitle: 'Up to 80% off MRP. Licensed manufacturers only. Delivered by lorry parcel to your nearest transport office.',
    offer: null,
    primary_label: 'Shop gift boxes',
    primary_href: '/products?cat=gift-boxes',
    secondary_label: 'Browse all crackers',
    secondary_href: '/products',
    image_url: null,
  },
];

/** Only site paths and http(s) links are allowed, so a slide can never carry a javascript: link. */
export function safeHref(href: string | null | undefined): string | null {
  const h = (href ?? '').trim();
  if (!h) return null;
  if (h.startsWith('/') && !h.startsWith('//')) return h;
  if (/^https?:\/\/[^\s]+$/i.test(h)) return h;
  return null;
}

/** Splits "Sivakasi crackers, *direct* from" into plain and highlighted parts. */
export function titleParts(title: string): { text: string; hl: boolean }[] {
  return title
    .split(/(\*[^*]+\*)/g)
    .filter(Boolean)
    .map((s) => (s.length > 2 && s.startsWith('*') && s.endsWith('*') ? { text: s.slice(1, -1), hl: true } : { text: s, hl: false }));
}
