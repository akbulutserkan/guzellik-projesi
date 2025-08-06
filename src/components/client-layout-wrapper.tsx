
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Package,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  CalendarCheck,
  Contact,
  Users,
  Home,
  Banknote,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientLayoutWrapperProps {
  children: ReactNode;
}

const menuItems = [
    { href: "/", label: "Ana Sayfa", icon: Home },
    { href: "/takvim", label: "Takvim", icon: CalendarDays },
    { href: "/kasa", label: "Kasa", icon: Banknote },
    { href: "/musteriler", label: "Müşteriler", icon: Contact },
    { href: "/personeller", label: "Personeller", icon: Users },
    { href: "/hizmetler", label: "Hizmetler", icon: Sparkles },
    { href: "/paketler", label: "Paketler", icon: Package },
    { href: "/urunler", label: "Ürünler", icon: ShoppingBag },
    { href: "/urun-satislar", label: "Ürün Satışları", icon: Tag },
    { href: "/paket-satislar", label: "Paket Satışları", icon: Star, disabled: false },
    { href: "/ayarlar", label: "Ayarlar", icon: Settings, disabled: false},
    { href: "/randevular", label: "Randevu Listesi", icon: CalendarCheck, disabled: true },
];

export function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  const pathname = usePathname();
  const isCalendarPage = pathname === '/takvim';

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 flex-col bg-sidebar text-sidebar-foreground hidden md:flex fixed h-full">
        <div className="flex h-16 items-center px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-6 w-6 text-accent" />
            <span className="">Güzellik Merkezi</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-4">
          {menuItems.map((item, index) =>
            item.href ? (
              <Link
                key={item.href}
                href={item.disabled ? "#" : item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-2 transition-colors",
                  pathname === item.href
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  item.disabled && "pointer-events-none opacity-50"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ) : null
          )}
        </nav>
        <div className="p-4">
            <p className="text-xs text-sidebar-foreground/50">
                © 2024 Güzellik Merkezi Yönetimi
            </p>
        </div>
      </aside>
      <main className={cn(
        "flex-1 bg-background md:ml-64",
        isCalendarPage && "h-screen flex flex-col"
      )}>
        <div className={cn(
          "container mx-auto py-10 px-4 sm:px-6 lg:px-8",
          isCalendarPage && "flex-grow flex flex-col p-0 sm:p-0 lg:p-0"
        )}>
            {children}
        </div>
      </main>
    </div>
  );
}
