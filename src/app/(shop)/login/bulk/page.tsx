import { Suspense } from 'react';
import { PasswordLogin } from '../PasswordLogin';

export const metadata = { title: 'Bulk buyer login' };

export default function BulkLoginPage() {
  return (
    <Suspense>
      <PasswordLogin kind="bulk" />
    </Suspense>
  );
}
