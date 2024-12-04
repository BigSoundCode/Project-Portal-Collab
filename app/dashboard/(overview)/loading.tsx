'use client';

import React from 'react';
import Image from 'next/image';

export default function Loading() {
  return (
    <main className="flex-1 flex flex-col min-w-0 w-full bg-white">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-32 h-32 relative mx-auto">
            {/* Main spinner */}
            <div className="absolute inset-0 border-4 border-yellow-100 rounded-full border-t-transparent animate-spin"></div>
            {/* Secondary spinner (opposite direction) */}
            <div className="absolute inset-2 border-4 border-blue-600 rounded-full border-t-transparent animate-spin-slow-reverse"></div>
            {/* Inner spinner */}
            <div className="absolute inset-4 border-4 border-yellow-100 rounded-full border-t-transparent animate-spin-slow"></div>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-gray-700 animate-pulse">Loading...</h2>
          <p className="text-gray-500 mt-2 animate-fade-in">Please wait while we load your files.</p>

          {/* Skeleton Content with staggered animation */}
          <div className="mt-8 w-96">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto animate-slide-in delay-75"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto animate-slide-in delay-150"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 mx-auto animate-slide-in delay-300"></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}