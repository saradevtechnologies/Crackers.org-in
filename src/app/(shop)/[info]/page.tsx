import { notFound } from 'next/navigation';

const PAGES: Record<string, { title: string; body: string[] }> = {
  safety: {
    title: 'Safety guide',
    body: [
      'Read the instructions printed on every box before lighting.',
      'Light crackers outdoors, on open ground, away from buildings, vehicles and dry grass.',
      'Keep a bucket of water or sand close by.',
      'Children should burst crackers only with an adult watching.',
      'Use a long incense stick or sparkler to light; never hold a cracker in your hand.',
      'Never try to relight a cracker that did not go off. Wait, then soak it in water.',
      'Follow the timings and green-cracker rules set by your local authorities.',
    ],
  },
  terms: {
    title: 'Terms',
    body: [
      '[YOUR TERMS OF USE] — to be prepared with your lawyer, covering the marketplace model, payments, cancellations, refunds and delivery by lorry parcel.',
    ],
  },
  privacy: {
    title: 'Privacy',
    body: [
      'Sellers only see your name, town, PIN code and the last 4 digits of your mobile number.',
      'Your full number is used only to send you order updates on WhatsApp.',
      '[YOUR PRIVACY POLICY] — to be completed with your lawyer.',
    ],
  },
};

export default function InfoPage({ params }: { params: { info: string } }) {
  const page = PAGES[params.info];
  if (!page) notFound();
  return (
    <article className="mx-auto max-w-2xl rounded-2xl border border-line bg-white p-6">
      <h1 className="mb-4 text-2xl font-semibold">{page.title}</h1>
      <ul className="flex list-disc flex-col gap-2 pl-5 text-[#4A4238]">
        {page.body.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
    </article>
  );
}
