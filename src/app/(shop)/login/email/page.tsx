import { Suspense } from 'react';
import { PasswordLogin } from '../PasswordLogin';

export const metadata = { title: 'Seller or admin login' };

export default function EmailLoginPage() {
  return (
    <Suspense>
      <PasswordLogin kind="staff" />
    </Suspense>
  );
}
