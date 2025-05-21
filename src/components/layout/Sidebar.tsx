'use client'

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Permission } from '@prisma/client';
import { 
  Menu, 
  X, 
  Calendar, 
  Users, 
  ClipboardList, 
  Package, 
  ShoppingBag, 
  CreditCard, 
  Settings,
  ChevronRight,
  ChevronLeft,
  UserCircle,
  LogOut
} from 'lucide-react';

// Navigation items with icons
const navItems = [
  { name: 'Müşteriler', href: '/customers', permission: Permission.VIEW_CUSTOMERS, icon: Users },
  { name: 'Randevular', href: '/appointments', permission: Permission.VIEW_APPOINTMENTS, icon: ClipboardList },
  { name: 'Takvim', href: '/calendar', permission: Permission.VIEW_APPOINTMENTS, icon: Calendar },  
  { name: 'Hizmetler', href: '/services', permission: Permission.VIEW_SERVICES, icon: ClipboardList },
  { name: 'Paketler', href: '/packages', permission: Permission.VIEW_PACKAGES, icon: Package }, 
  { name: 'Paket Satışları', href: '/package-sales', permission: Permission.VIEW_PACKAGES, icon: ShoppingBag },
  { name: 'Ürünler', href: '/products', permission: Permission.VIEW_PRODUCTS, icon: Package },
  { name: 'Ürün Satışları', href: '/product-sales', permission: Permission.VIEW_PRODUCT_SALES, icon: ShoppingBag },
  { name: 'Tahsilatlar', href: '/payments', permission: Permission.VIEW_PAYMENTS, icon: CreditCard },
  { name: 'Personel', href: '/staff', permission: Permission.VIEW_STAFF, icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  
  // Admin has access to all pages
  const isAdmin = session?.user?.role === 'ADMIN';
  const userPermissions = session?.user?.permissions || [];

  // Filter navigation items based on user permissions
  const allowedNavItems = navItems.filter(item => 
    isAdmin || userPermissions.includes(item.permission)
  );

  return (
    <div 
      className={`bg-white shadow h-screen transition-all duration-300 flex flex-col ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex justify-end p-2">
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <nav className="px-2 pt-2">
          <ul className="space-y-1">
            {allowedNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center p-2 rounded-md group ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${collapsed ? 'mx-auto' : 'mr-3'}`} />
                    {!collapsed && <span>{item.name}</span>}
                    {collapsed && (
                      <span className="sr-only">{item.name}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      
      {/* Settings at the bottom */}
      {(isAdmin || userPermissions.includes(Permission.VIEW_SETTINGS)) && (
        <div className="p-2 border-t">
          <Link
            href="/settings"
            className={`flex items-center p-2 rounded-md text-gray-700 hover:bg-gray-100 ${
              pathname === '/settings' ? 'bg-gray-100' : ''
            }`}
          >
            <Settings className={`w-5 h-5 ${collapsed ? 'mx-auto' : 'mr-3'}`} />
            {!collapsed && <span>Ayarlar</span>}
            {collapsed && <span className="sr-only">Ayarlar</span>}
          </Link>
        </div>
      )}
    </div>
  );
}
