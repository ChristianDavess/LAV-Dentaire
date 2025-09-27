'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Home,
  Users,
  Calendar,
  FileText,
  Settings,
  User,
  Stethoscope,
  X,
  QrCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateQRCodeURL } from '@/lib/utils';

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/patients', label: 'Patients', icon: Users },
  { href: '/appointments', label: 'Appointments', icon: Calendar },
  { href: '/treatments', label: 'Treatments', icon: FileText },
  { href: '/procedures', label: 'Procedures', icon: Stethoscope },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 h-screen w-64 bg-white border-r transition-transform lg:translate-x-0 lg:z-30 lg:mt-16",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Mobile close button */}
          <div className="flex items-center justify-between p-4 lg:hidden">
            <h2 className="text-xl font-bold">LAV Dentaire</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={onClose}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* QR Code Section */}
          <div className="p-4 border-t">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                Registration QR Code
              </h3>
              <img 
                src={generateQRCodeURL()} 
                alt="Patient Registration QR Code"
                className="w-full rounded"
              />
              <p className="text-xs text-gray-600 mt-2 text-center">
                Patients can scan to register
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}