'use client'

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ErrorContent() {
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

export default function AuthError() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}