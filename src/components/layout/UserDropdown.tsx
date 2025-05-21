'use client'

import { useSession, signOut } from 'next-auth/react';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { UserCircle, LogOut } from 'lucide-react';
import { useState } from 'react';

export default function UserDropdown() {
  const { data: session } = useSession();
  const username = session?.user?.name || 'Admin User';
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors text-sm">
          <UserCircle className="w-4 h-4" />
          <span>{username}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="w-48 p-1 mt-2 rounded-md right-4 top-16 absolute">
        <button 
          onClick={() => {
            setIsOpen(false);
            signOut({ callbackUrl: '/auth/login' });
          }}
          className="w-full text-left flex items-center px-3 py-2 text-red-500 hover:bg-gray-100 rounded-sm"
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span>Çıkış</span>
        </button>
      </DialogContent>
    </Dialog>
  );
}
