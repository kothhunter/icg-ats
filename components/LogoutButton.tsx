'use client';

import { logout } from '@/lib/auth';

interface LogoutButtonProps {
  className?: string;
  redirectHome?: boolean;
}

export default function LogoutButton({
  className = '',
  redirectHome = true
}: LogoutButtonProps) {
  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout(redirectHome);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={className || 'text-sm text-red-600 hover:text-red-800 transition-colors'}
    >
      Logout
    </button>
  );
}
