'use client';

import React from 'react';
import Image from 'next/image';

export default function Loading() {
  return (
    <main className="flex-1 flex flex-col min-w-0 w-full bg-white">  {/* Match FolderContent's main container classes */}
      <div className="flex flex-col items-center justify-center h-full space-y-4 p-8">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-32 h-32 relative">
            <div className="absolute inset-0 border-4 border-yellow-100 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-gray-700">Loading...</h2>
          <p className="text-gray-500 mt-2">Please wait while we load your files.</p>
        </div>

        {/* Skeleton Content */}
        <div className="w-full">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </main>
  );
}