'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/cameras/new', label: '+ Camera' },
  { href: '/clients', label: 'Clients' },
  { href: '/settings', label: 'Settings' },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center gap-6">
      <span className="font-bold text-brand text-lg tracking-tight">YNLED LiveView</span>
      <div className="flex gap-4 ml-4">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`text-sm font-medium transition-colors ${
              pathname === href ? 'text-brand' : 'text-gray-400 hover:text-gray-100'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
