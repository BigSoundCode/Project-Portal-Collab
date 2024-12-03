'use client';

import React from 'react';
import { useSession } from 'next-auth/react';

const UserName = React.memo(() => {
  const { data: session } = useSession();
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">
        Welcome, {session?.user?.name || 'User'}!
      </h2>
    </div>
  );
});

UserName.displayName = 'UserName';

export default UserName;
