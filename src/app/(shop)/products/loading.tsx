import { ProductGridSkeleton } from '@/components/Loading';

export default function Loading() {
  return (
    <div className="flex animate-fade-in flex-col gap-5" aria-busy="true">
      <div className="flex flex-col gap-2">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-4 w-64" />
      </div>
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="skeleton h-9 w-24 flex-none rounded-full" />
        ))}
      </div>
      <ProductGridSkeleton count={8} />
    </div>
  );
}
