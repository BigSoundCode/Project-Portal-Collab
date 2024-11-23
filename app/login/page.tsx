'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/app/ui/login-form';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

// Debug Panel Component
const DebugPanel = () => {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-black bg-opacity-75 p-4 text-white rounded z-50">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <pre className="text-xs">
        {JSON.stringify({
          status,
          session: {
            user: session?.user,
            hasAccessToken: !!session?.accessToken,
            onedriveFolderId: session?.onedriveFolderId
          },
          params: {
            callbackUrl: searchParams.get('callbackUrl'),
            error: searchParams.get('error')
          }
        }, null, 2)}
      </pre>
    </div>
  );
};

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (session) {
      router.replace('/dashboard');
    }
  }, [session, router]);

  if (status === 'loading') {
    return (
      <>
        <div>Loading...</div>
        {process.env.NODE_ENV !== 'production' && <DebugPanel />}
      </>
    );
  }

  if (session) {
    return null;
  }

  return (
    <main className="flex items-center justify-center min-h-screen">
      <div className="w-4/5 max-w-3xl flex flex-col items-center space-y-6 p-4">
        <div className="flex items-center justify-center">
          <Image
            src="/Picture1.png"
            alt="Logo"
            width={549.5}
            height={224}
          />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-yellow-100 text-center">
          Welcome to our customer portal!
        </h1>
        <LoginForm />
      </div>
      {process.env.NODE_ENV !== 'production' && <DebugPanel />}
    </main>
  );
}