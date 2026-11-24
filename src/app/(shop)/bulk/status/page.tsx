import { Suspense } from 'react';
import { StatusForm } from './StatusForm';

export const metadata = { title: 'Application status' };

export default function BulkStatusPage() {
  return (
    <Suspense>
      <StatusForm />
    </Suspense>
  );
}
