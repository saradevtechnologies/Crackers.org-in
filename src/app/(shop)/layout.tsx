import { Footer, Header, MobileTabs } from '@/components/Header';
import { BulkPausedBanner } from '@/components/BulkPausedBanner';
import { Toast } from '@/components/Toast';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <Header />
      <BulkPausedBanner />
      <Suspense fallback={null}>
        <Toast />
      </Suspense>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      <Footer />
      <MobileTabs />
    </div>
  );
}
