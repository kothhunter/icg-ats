'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSession, logout, type OfficerSession } from '@/lib/auth';

interface Tab {
  name: string;
  path: string;
}

const tabs: Tab[] = [
  { name: 'Selection', path: '/dashboard' },
  { name: 'Interview Scheduler', path: '/dashboard/schedule' },
  { name: 'Email Sendout', path: '/dashboard/emails' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<OfficerSession | null>(null);

  useEffect(() => {
    const currentSession = getSession();
    if (!currentSession) {
      router.push('/login');
    } else {
      setSession(currentSession);
    }
  }, [router]);

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout(true);
    }
  };

  const isActiveTab = (path: string): boolean => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(path);
  };

  // Don't render anything until session is loaded
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-icg-navy"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Title */}
            <div>
              <h1 className="text-xl font-bold text-icg-navy">
                ICG Application Tracking System
              </h1>
            </div>

            {/* Right: Officer Info & Logout */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">
                  {session.display_name}
                </p>
                <p className="text-xs text-gray-500">@{session.username}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-white hover:bg-red-600 border border-red-600 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="mt-4 flex space-x-1 border-b border-gray-200">
            {tabs.map((tab) => {
              const active = isActiveTab(tab.path);
              return (
                <Link
                  key={tab.path}
                  href={tab.path}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    active
                      ? 'border-icg-navy text-icg-navy'
                      : 'border-transparent text-gray-600 hover:text-icg-navy hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content - Add top padding to account for fixed header */}
      <main className="pt-[180px] px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
