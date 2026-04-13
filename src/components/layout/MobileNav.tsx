'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, BookOpen, Settings } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function MobileNav() {
  const pathname = usePathname();
  const { profile } = useAuth();

  const navItems = [
    { href: '/', icon: LayoutDashboard, label: 'Home' },
    ...(profile?.role === 'admin' 
      ? [{ href: '/manage', icon: Settings, label: 'Manage' }]
      : [{ href: '/manage/students', icon: Users, label: 'Students' }]
    ),
    { href: '/reports', icon: BookOpen, label: 'Reports' },
  ];

  return (
    <nav className="mobile-nav">
      <div className="nav-container">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`nav-item \${isActive ? 'active' : ''}`}
            >
              <item.icon size={26} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
