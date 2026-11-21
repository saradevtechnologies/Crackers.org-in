export default function Loading() {
  return (
    <div className="grid animate-fade-in gap-6 md:grid-cols-2" aria-busy="true">
      <div className="skeleton aspect-square w-full rounded-2xl" />
      <div className="flex flex-col gap-3">
        <div className="skeleton h-5 w-24" />
        <div className="skeleton h-9 w-4/5" />
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton mt-2 h-10 w-40" />
        <div className="skeleton h-20 w-full" />
        <div className="skeleton mt-2 h-12 w-full" />
      </div>
    </div>
  );
}
