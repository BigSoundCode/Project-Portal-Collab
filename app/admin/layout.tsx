import Header from '@/app/ui/dashboard/header';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin',
  description: 'Admin page for managing the application',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-grow p-6 md:p-12">
        {children}
      </div>
    </div>
  );
}
