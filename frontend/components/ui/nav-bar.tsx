'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function NavBar() {
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/login');
  }

  return (
    <nav className="flex items-center justify-between border-b bg-white px-6 py-3">
      <div className="flex gap-4">
        <Link href="/customers" className="text-sm font-medium hover:underline">
          Customers
        </Link>
        <Link href="/users" className="text-sm font-medium hover:underline">
          Users
        </Link>
      </div>
      <Button variant="outline" size="sm" onClick={handleLogout}>
        Log out
      </Button>
    </nav>
  );
}