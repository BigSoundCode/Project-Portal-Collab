'use client'

import React from 'react';
import OneDrive from '@/app/ui/dashboard/onedrive';

export default function Page() {
  const selectedNavItem = 'home'; // Replace 'home' with the selected side-nav button name

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