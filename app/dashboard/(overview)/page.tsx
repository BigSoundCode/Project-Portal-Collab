import { Card } from '@/app/ui/dashboard/cards';
import RevenueChart from '@/app/ui/dashboard/revenue-chart';
import LatestInvoices from '@/app/ui/dashboard/latest-invoices';
import CardWrapper from '@/app/ui/dashboard/cards';
import { Suspense } from 'react';
import { RevenueChartSkeleton, LatestInvoicesSkeleton, CardsSkeleton } from '@/app/ui/skeletons';
import OneDrive from '@/app/ui/dashboard/onedrive';

 
export default async function Page() {
  
  const selectedNavItem = 'home'; // Replace 'home' with the selected side-nav button name

  return (
    <main>
      <h1 className={`mb-4 text-xl md:text-2xl`}>
        {selectedNavItem.charAt(0).toUpperCase() + selectedNavItem.slice(1)}
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        
      </div>

      <div>
        <OneDrive />
      </div>


      
    </main>
  );
}