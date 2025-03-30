'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Wallet, Settings, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const routes = [
  {
    label: 'Home',
    icon: Home,
    href: '/',
    color: 'text-arena-gold',
  },
  {
    label: 'Funds',
    icon: Wallet,
    href: '/funds',
    color: 'text-arena-blue',
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/settings',
    color: 'text-arena-orange',
  },
  {
    label: 'Reports',
    icon: FileText,
    href: '/reports',
    color: 'text-green-500',
  },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex h-full w-72 flex-col space-y-4 border-r bg-background p-3">
      <div className="flex flex-col space-y-2">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              'flex h-12 items-center space-x-3 rounded-md px-4 transition-all hover:bg-accent',
              pathname === route.href 
                ? 'bg-muted font-semibold' 
                : 'font-normal'
            )}
          >
            <route.icon className={cn('h-5 w-5', route.color)} />
            <span>{route.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;