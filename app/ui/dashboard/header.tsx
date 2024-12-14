'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import NotificationPanel from 'app/ui/dashboard/NotificationPanel';

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

  const handleLogoClick = (e: React.MouseEvent) => {
    if (pathname === '/dashboard') {
      e.preventDefault();
      window.location.href = '/dashboard';
    }
  };

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`/api/notifications?userId=${session?.user?.id}`);
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications);
          setNotificationCount(data.count);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    if (session?.user?.id) {
      fetchNotifications();
      // Refresh notifications every minute
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [session?.user?.id]);

  const handleNotificationClick = async () => {
    // First toggle the panel visibility
    setIsNotificationPanelOpen(!isNotificationPanelOpen);
    
    // If we're opening the panel, mark notifications as read
    if (!isNotificationPanelOpen && session?.user?.id) {
      try {
        await fetch(`/api/notifications?userId=${session.user.id}`, {
          method: 'POST'
        });
        setNotificationCount(0);
      } catch (error) {
        console.error('Error marking notifications as read:', error);
      }
    }
  };

  return (
    <header style={{ backgroundColor: '#042540', color: '#c09f4a' }}>
      <div style={{ display: 'flex', alignItems: 'center', paddingRight: '10px'}}>
        <Link legacyBehavior href="/dashboard">
          <a onClick={handleLogoClick}>
            <Image src="/TBH_Logo_White_Vertical.png" alt="Logo" width={240} height={44.856} />
          </a>
        </Link>
        <div style={{ borderLeft: '1px solid #c09f4a', height: '50px', margin: '0 10px' }}></div>
        <h1 style={{ fontWeight: 'bold' }}>Customer Portal</h1>
        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          {session?.user?.isAdmin && (
            <Link href="/admin">
              <button style={{ paddingLeft: '10px', paddingRight: '10px' }}>
                <Image src="/admin.png" alt="Admin" width={30} height={30} />
              </button>
            </Link>
          )}
          <button 
            style={{ paddingLeft: '10px', paddingRight: '10px', position: 'relative' }}
            onClick={handleNotificationClick}
          >
            <Image src="/notifications.png" alt="Notifications" width={30} height={30}/>
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {notificationCount}
              </span>
            )}
          </button>
          <NotificationPanel 
            isOpen={isNotificationPanelOpen}
            onClose={() => setIsNotificationPanelOpen(false)}
            notifications={notifications}
          />
          <Link href="/account/password">
            <button style={{ paddingLeft: '10px', paddingRight: '10px' }}>
              <Image src="/keys.png" alt="Settings" width={30} height={30} />
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}
