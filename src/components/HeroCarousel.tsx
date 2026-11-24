'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SparkleTrail } from '@/components/effects';
import { Icon } from '@/components/ui';
import { safeHref, titleParts, type HeroSlide } from '@/lib/hero';

/** The first slide stays for this long after the page opens, then the carousel starts. */
const FIRST_DELAY = 3000;
/** Time on each slide after that. */
const INTERVAL = 5000;

const SPARKS = [
  'left-[8%] top-6',
  'left-[46%] top-10 [animation-delay:.6s]',
  'right-[30%] bottom-8 [animation-delay:1.2s]',
  'left-[30%] bottom-5 [animation-delay:1.8s]',
  'right-[12%] top-1/2 [animation-delay:.9s]',
];

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const n = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const moved = useRef(false);
  const touchX = useRef<number | null>(null);

  const go = useCallback(
    (to: number) => {
      moved.current = true;
      setIndex(((to % n) + n) % n);
    },
    [n],
  );

  // Autoplay: 3 s on the first slide after opening, then INTERVAL per slide. Restarts after manual moves.
  useEffect(() => {
    if (n < 2 || paused) return;
    const t = window.setTimeout(() => go(index + 1), moved.current ? INTERVAL : FIRST_DELAY);
    return () => window.clearTimeout(t);
  }, [index, n, paused, go]);

  // Don't run in a background tab.
  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Offers"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(index + 1);
        if (e.key === 'ArrowLeft') go(index - 1);
      }}
    >
      <SparkleTrail className="relative overflow-hidden rounded-3xl bg-[radial-gradient(120%_140%_at_85%_0%,#C23A2A_0%,#9B1C1C_38%,#5E0E0E_100%)] px-6 py-12 text-white shadow-lift sm:px-12 sm:py-14">
        {/* Background images, cross-faded. Slides without an image show the maroon gradient. */}
        {slides.map((s, i) =>
          s.image_url ? (
            <div
              key={`bg-${s.id}`}
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${i === index ? 'opacity-100' : 'opacity-0'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.image_url}
                alt=""
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                className={`h-full w-full object-cover transition-transform duration-[6000ms] ease-out ${i === index ? 'scale-100' : 'scale-110'}`}
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(94,14,14,.94)_0%,rgba(155,28,28,.78)_45%,rgba(122,20,20,.35)_100%)]" />
            </div>
          ) : null,
        )}

        <svg width="420" height="420" viewBox="0 0 420 420" aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 animate-[spin_60s_linear_infinite] opacity-40">
          <g stroke="#F3D99A" strokeWidth="2.5" strokeLinecap="round">
            <path d="M210 210L210 80M210 210L302 118M210 210L340 210M210 210L302 302M210 210L210 340M210 210L118 302M210 210L80 210M210 210L118 118" />
          </g>
          <g fill="#F3D99A">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => (
              <circle key={d} cx={210 + 140 * Math.cos((d * Math.PI) / 180)} cy={210 + 140 * Math.sin((d * Math.PI) / 180)} r="5" />
            ))}
          </g>
        </svg>
        {SPARKS.map((pos) => (
          <span key={pos} aria-hidden="true" className={`absolute h-1.5 w-1.5 animate-twinkle rounded-full bg-[#F3D99A] shadow-[0_0_8px_2px_rgba(243,217,154,.7)] ${pos}`} />
        ))}

        {/* All slides share one grid cell, so the banner keeps the height of the tallest slide and never jumps. */}
        <div className="relative grid">
          {slides.map((s, i) => (
            <Slide key={s.id} s={s} active={i === index} label={`${i + 1} of ${n}`} first={i === 0} />
          ))}
        </div>

        {n > 1 && (
          <div className="relative mt-8 flex items-center gap-3 sm:absolute sm:bottom-6 sm:right-8 sm:mt-0">
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => go(index - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#F3D99A]/50 bg-white/10 text-[#F3D99A] backdrop-blur-sm transition hover:bg-white/20"
            >
              <span aria-hidden="true">‹</span>
            </button>
            <div className="flex items-center gap-1.5">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === index}
                  onClick={() => go(i)}
                  className="flex h-6 items-center"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all duration-300 ${
                      i === index ? 'w-6 bg-[#F3D99A] shadow-[0_0_8px_2px_rgba(243,217,154,.5)]' : 'w-1.5 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => go(index + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#F3D99A]/50 bg-white/10 text-[#F3D99A] backdrop-blur-sm transition hover:bg-white/20"
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        )}
      </SparkleTrail>
    </div>
  );
}

function Slide({ s, active, label, first }: { s: HeroSlide; active: boolean; label: string; first: boolean }) {
  // Animations are only applied to the visible slide, so they replay every time it comes in.
  const fade = active ? 'animate-fade-up' : '';
  const primary = safeHref(s.primary_href);
  const secondary = safeHref(s.secondary_href);
  const Heading = first ? 'h1' : 'h2';
  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={label}
      className={`col-start-1 row-start-1 flex max-w-xl flex-col gap-4 transition-[opacity,visibility] duration-500 ${
        active ? 'visible opacity-100' : 'invisible opacity-0'
      }`}
    >
      {s.badge && (
        <p className={`inline-flex w-fit items-center gap-2 rounded-full border border-[#F3D99A]/40 bg-white/10 px-3 py-1 text-xs font-medium text-[#F3D99A] backdrop-blur-sm ${fade}`}>
          <span aria-hidden="true">✦</span> {s.badge}
        </p>
      )}
      <Heading className={`text-4xl font-bold leading-[1.1] [animation-delay:80ms] sm:text-5xl ${fade}`}>
        {titleParts(s.title).map((p, k) =>
          p.hl ? (
            <span key={k} className="bg-gradient-to-r from-[#FCE7B0] to-gold bg-clip-text pr-1.5 italic text-transparent">
              {p.text}
            </span>
          ) : (
            <span key={k}>{p.text}</span>
          ),
        )}
      </Heading>
      {s.offer && (
        <p
          className={`w-fit rounded-xl bg-gradient-to-r from-[#FCE7B0] to-gold px-4 py-1.5 text-xl font-bold text-gold-text shadow-[0_0_18px_2px_rgba(243,217,154,.35)] [animation-delay:120ms] sm:text-2xl ${fade}`}
        >
          {s.offer}
        </p>
      )}
      {s.subtitle && <p className={`text-[#F6DADA] [animation-delay:160ms] ${fade}`}>{s.subtitle}</p>}
      {((s.primary_label && primary) || (s.secondary_label && secondary)) && (
        <div className={`mt-2 flex flex-wrap gap-3 [animation-delay:240ms] ${fade}`}>
          {s.primary_label && primary && (
            <Link href={primary} className="btn-gold px-5" {...external(primary)}>
              <Icon name="gift" size={18} />
              {s.primary_label}
            </Link>
          )}
          {s.secondary_label && secondary && (
            <Link
              href={secondary}
              className="btn border border-[#F3D99A]/70 bg-white/5 px-5 text-white backdrop-blur-sm hover:-translate-y-px hover:bg-white/15 hover:text-white"
              {...external(secondary)}
            >
              {s.secondary_label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function external(href: string) {
  return href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {};
}
