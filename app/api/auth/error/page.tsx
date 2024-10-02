'use client';

import { useSearchParams } from 'next/navigation';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const message = searchParams.get('message');

  return (
    <div>
      <h1>Authentication Error</h1>
      <p>Error: {error || 'No error code provided'}</p>
      <p>Message: {message || 'No error message provided'}</p>
      <p>If you believe this is a mistake, please contact the administrator.</p>
    </div>
  );
}