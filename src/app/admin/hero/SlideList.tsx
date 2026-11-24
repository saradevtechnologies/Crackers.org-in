'use client';

import { useState } from 'react';
import { ActionButton } from '@/components/ActionButton';
import { Badge } from '@/components/ui';
import { titleParts, type HeroSlide } from '@/lib/hero';
import { deleteHeroSlide, moveHeroSlide, setHeroSlideActive } from '../actions';
import { HeroSlideEditor } from './HeroSlideEditor';

export function SlideList({ slides }: { slides: HeroSlide[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {slides.map((s, i) => (
        <div key={s.id} className="rounded-2xl border border-line bg-white p-4 shadow-soft">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-maroon-light text-sm font-semibold text-maroon">{i + 1}</span>
            <div
              className="h-12 w-20 shrink-0 rounded-lg bg-[radial-gradient(120%_140%_at_85%_0%,#C23A2A_0%,#9B1C1C_38%,#5E0E0E_100%)] bg-cover bg-center"
              style={s.image_url ? { backgroundImage: `linear-gradient(90deg,rgba(94,14,14,.7),rgba(122,20,20,.2)),url("${s.image_url}")` } : undefined}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{titleParts(s.title).map((p) => p.text).join('')}</p>
              <p className="truncate text-xs text-muted">
                {[s.badge, s.offer, s.primary_label, s.secondary_label].filter(Boolean).join(' · ') || '—'}
              </p>
            </div>
            {s.active ? <Badge tone="green">Live</Badge> : <Badge>Hidden</Badge>}
            <div className="flex flex-wrap items-center gap-1">
              <ActionButton action={() => moveHeroSlide(s.id, -1)} label="↑" className="btn-ghost min-h-[36px] px-3" />
              <ActionButton action={() => moveHeroSlide(s.id, 1)} label="↓" className="btn-ghost min-h-[36px] px-3" />
              <ActionButton
                action={() => setHeroSlideActive(s.id, !s.active)}
                label={s.active ? 'Hide' : 'Show'}
                className="btn-ghost min-h-[36px]"
              />
              <button className="btn-ghost min-h-[36px]" onClick={() => setOpen(open === s.id ? null : s.id)}>
                {open === s.id ? 'Close' : 'Edit'}
              </button>
              <ActionButton action={() => deleteHeroSlide(s.id)} label="Delete" className="btn-ghost min-h-[36px] text-maroon" confirm="Delete this slide?" />
            </div>
          </div>
          {open === s.id && (
            <div className="mt-4 border-t border-line pt-4">
              <HeroSlideEditor slide={s} />
            </div>
          )}
        </div>
      ))}

      {adding ? (
        <div className="rounded-2xl border border-line bg-white p-4 shadow-soft">
          <p className="mb-3 font-semibold">New slide</p>
          <HeroSlideEditor slide={null} onDone={() => setAdding(false)} />
        </div>
      ) : (
        <button className="btn-primary w-fit" onClick={() => setAdding(true)}>
          + Add slide
        </button>
      )}
    </div>
  );
}
