'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ErrorNote, OkNote } from '@/components/ui';
import { HeroCarousel } from '@/components/HeroCarousel';
import type { HeroSlide } from '@/lib/hero';
import { saveHeroSlide, type HeroSlideInput } from '../actions';

const EMPTY: HeroSlideInput = {
  badge: '',
  title: '',
  subtitle: '',
  offer: '',
  primary_label: '',
  primary_href: '',
  secondary_label: '',
  secondary_href: '',
  image_url: '',
  active: true,
};

function toInput(s: HeroSlide | null): HeroSlideInput {
  if (!s) return EMPTY;
  return {
    badge: s.badge ?? '',
    title: s.title,
    subtitle: s.subtitle ?? '',
    offer: s.offer ?? '',
    primary_label: s.primary_label ?? '',
    primary_href: s.primary_href ?? '',
    secondary_label: s.secondary_label ?? '',
    secondary_href: s.secondary_href ?? '',
    image_url: s.image_url ?? '',
    active: s.active,
  };
}

/** Form for one hero slide, with a live preview using the real home page banner. */
export function HeroSlideEditor({ slide, onDone }: { slide: HeroSlide | null; onDone?: () => void }) {
  const [v, setV] = useState<HeroSlideInput>(() => toInput(slide));
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();

  const set = (k: keyof HeroSlideInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setOk(null);
    setV((p) => ({ ...p, [k]: e.target.value }));
  };

  const upload = async (file: File) => {
    if (!file.type.startsWith('image/')) return setError('Choose an image file.');
    if (file.size > 4 * 1024 * 1024) return setError('Image must be under 4 MB.');
    setUploading(true);
    setError(null);
    const supabase = createClient();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `hero/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('site-images').upload(path, file);
    setUploading(false);
    if (upErr) return setError('Image upload failed. Check that the site-images bucket exists (run migration 0002), then try again.');
    setV((p) => ({ ...p, image_url: supabase.storage.from('site-images').getPublicUrl(path).data.publicUrl }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      setError(null);
      setOk(null);
      const r = await saveHeroSlide(slide?.id ?? null, v);
      if (r.error) return setError(r.error);
      if (slide) setOk('Saved. The home page is updated.');
      else setV(EMPTY);
      onDone?.();
    });
  };

  const preview: HeroSlide = {
    id: 'preview',
    sort: 0,
    active: true,
    badge: v.badge || null,
    title: v.title || 'Your heading here',
    subtitle: v.subtitle || null,
    offer: v.offer || null,
    primary_label: v.primary_label || null,
    primary_href: v.primary_href || null,
    secondary_label: v.secondary_label || null,
    secondary_href: v.secondary_href || null,
    image_url: v.image_url || null,
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="pointer-events-none select-none">
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">Preview</p>
        <HeroCarousel key={v.image_url} slides={[preview]} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Text label="Offer tag (small pill at the top)" value={v.badge} onChange={set('badge')} placeholder="Diwali early booking is open" />
        <Text label="Offer highlight (big gold label)" value={v.offer} onChange={set('offer')} placeholder="Flat 70% OFF" hint="Leave empty to hide." />
        <div className="sm:col-span-2">
          <Text
            label="Heading"
            value={v.title}
            onChange={set('title')}
            required
            placeholder="Sivakasi crackers, *direct* from verified sellers"
            hint="Put *stars* around words to show them in gold italic."
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-sm font-medium" htmlFor={`sub-${slide?.id ?? 'new'}`}>
            Description
          </label>
          <textarea id={`sub-${slide?.id ?? 'new'}`} className="input min-h-[80px] py-2" value={v.subtitle} onChange={set('subtitle')} />
        </div>

        <fieldset className="flex flex-col gap-3 rounded-xl border border-line p-3">
          <legend className="px-1 text-sm font-semibold">Button 1 (gold)</legend>
          <Text label="Button name" value={v.primary_label} onChange={set('primary_label')} placeholder="Shop gift boxes" />
          <Text label="Link" value={v.primary_href} onChange={set('primary_href')} placeholder="/products?cat=gift-boxes" />
        </fieldset>
        <fieldset className="flex flex-col gap-3 rounded-xl border border-line p-3">
          <legend className="px-1 text-sm font-semibold">Button 2 (outline)</legend>
          <Text label="Button name" value={v.secondary_label} onChange={set('secondary_label')} placeholder="Browse all crackers" />
          <Text label="Link" value={v.secondary_href} onChange={set('secondary_href')} placeholder="/products" />
        </fieldset>
        <p className="-mt-2 text-xs text-muted sm:col-span-2">
          Links: a page on this site (starts with /, e.g. /products?cat=rockets) or a full https:// address. Leave a button name empty to hide that button.
        </p>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium">Background image</span>
          <div className="flex flex-wrap items-center gap-2">
            <label className="btn-ghost min-h-[40px] cursor-pointer border border-line">
              {uploading ? 'Uploading…' : v.image_url ? 'Change image' : 'Upload image'}
              <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            </label>
            {v.image_url && (
              <button type="button" className="btn-ghost min-h-[40px]" onClick={() => setV((p) => ({ ...p, image_url: '' }))}>
                Remove image
              </button>
            )}
          </div>
          <input className="input" value={v.image_url} onChange={set('image_url')} placeholder="or paste an image link: /img/categories/fancy.jpg" aria-label="Background image link" />
          <p className="text-xs text-muted">Wide images work best (at least 1600 × 600). Without an image the slide uses the maroon gradient.</p>
        </div>

        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={v.active} onChange={(e) => setV((p) => ({ ...p, active: e.target.checked }))} className="h-4 w-4 accent-maroon" />
          Show on the home page
        </label>
      </div>

      <ErrorNote msg={error} />
      <OkNote msg={ok} />
      <div className="flex gap-2">
        <button className="btn-primary" disabled={pending || uploading}>
          {pending ? 'Saving…' : slide ? 'Save slide' : 'Add slide'}
        </button>
        {onDone && (
          <button type="button" className="btn-ghost" onClick={onDone}>
            Close
          </button>
        )}
      </div>
    </form>
  );
}

function Text({
  label,
  hint,
  ...rest
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <input className="input" {...rest} />
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}
