import { requireAdmin } from '@/lib/auth';
import { PageTitle } from '@/components/ui';
import type { HeroSlide } from '@/lib/hero';
import { SlideList } from './SlideList';

export default async function AdminHero() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from('hero_slides').select('*').order('sort').order('created_at');
  return (
    <div className="max-w-4xl">
      <PageTitle
        title="Home page hero slides"
        sub="The banner at the top of the home page. The first slide shows for 3 seconds, then the slides rotate every 5 seconds."
      />
      {error ? (
        <p className="rounded-2xl border border-dashed border-line bg-white p-6 text-sm">
          The slides table is not set up yet. Run <code className="rounded bg-cream px-1">supabase/migrations/0002_hero_slides.sql</code> in the
          Supabase SQL editor, then reload this page. Until then the home page shows the original banner.
        </p>
      ) : (
        <>
          {!data?.length && (
            <p className="mb-3 rounded-xl bg-gold-light px-3 py-2 text-sm text-gold-text">
              No slides yet, so the home page shows the original banner. Add a slide to take over.
            </p>
          )}
          <SlideList slides={(data ?? []) as HeroSlide[]} />
        </>
      )}
    </div>
  );
}
