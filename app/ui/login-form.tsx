'use client';

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  AtSymbolIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { Button } from '@/app/ui/button';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsPending(true);

    try {
      // First, check if the user exists in your database
      const checkResponse = await fetch('/api/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!checkResponse.ok) {
        setErrorMessage('User not found. Please contact your administrator.');
        setIsPending(false);
        return;
      }

      // If user exists, proceed with Microsoft authentication
      const result = await signIn('azure-ad', {
        redirect: false,
        callbackUrl: '/dashboard'
      });

      if (result?.error) {
        setErrorMessage(result.error);
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      setErrorMessage('An unexpected error occurred');
    } finally {
      setIsPending(false);
    }
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (session) {
    return <div>Redirecting to dashboard...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="mb-8">
        <Image
          src="/Picture1.png"
          alt="Company Logo"
          width={400}
          height={89.6}
          priority
        />
      </div>
      <form onSubmit={handleSubmit} className="space-y-3 w-full max-w-md">
        <div className="flex-1 rounded-lg bg-blue-100 px-6 pb-4 pt-8">
          <p className="text-white">
            On this platform, you will be able to be up-to-date with your custom home building
            or home renovation project. You can access all your documentation, contracts,
            budget, permit info, progress photos, schedules and more.
          </p>
          <h1 className={`mb-3 text-2xl text-white`}>
            Please provide your email address to continue.
          </h1>
          <div className="w-full">
            <div>
              <label
                className="mb-3 mt-5 block text-xs font-medium text-white"
                htmlFor="email"
              >
                Email
              </label>
              <div className="relative">
                <input
                  className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
              </div>
            </div>
          </div>
          <Button className="mt-4 w-full" disabled={isPending} type="submit">
            {isPending ? 'Checking...' : 'Continue'} <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
          </Button>
          <div
            className="flex h-8 items-end space-x-1"
            aria-live="polite"
            aria-atomic="true"
          >
            {errorMessage && (
              <>
                <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-500">{errorMessage}</p>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}