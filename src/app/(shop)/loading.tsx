import { FestiveSpinner } from '@/components/Loading';

export default function Loading() {
  return (
    <div className="flex min-h-[55vh] animate-fade-in items-center justify-center">
      <FestiveSpinner label="Lighting things up…" />
    </div>
  );
}
