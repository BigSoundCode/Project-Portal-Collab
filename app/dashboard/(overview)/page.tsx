'use client'

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import OneDrive from '@/app/ui/dashboard/onedrive';

export default function Page() {
  const { data: session, status } = useSession();
  const selectedNavItem = 'home';

  useEffect(() => {
    console.log('Session status:', status);
    console.log('Session data:', session);
  }, [session, status]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Access Denied</div>;
  }

  return (
    <main>
      <h1 className={`mb-4 text-xl md:text-2xl`}>
        {selectedNavItem.charAt(0).toUpperCase() + selectedNavItem.slice(1)}
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Your grid content here */}
      </div>

      <div>
        <OneDrive />
      </div>
    </main>
  );
}