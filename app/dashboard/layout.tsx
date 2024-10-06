import React from 'react';
import Header from '@/app/ui/dashboard/header';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-grow flex">
        {children}
      </div>
    </div>
  );
}