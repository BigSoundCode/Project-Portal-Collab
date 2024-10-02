'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/app/ui/login-form';
import Image from 'next/image';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.replace('/dashboard');
    }
  }, [session, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (session) {
    return null;
  }

  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
        <div className="flex h-20 w-full items-end justify-center">
          <Image
            src="/TBH_Logo_White_Vertical.png"
            alt="Logo"
            width={240}
            height={44.856}
          />
        </div>
        <LoginForm />
      </div>
    </main>
  );
}