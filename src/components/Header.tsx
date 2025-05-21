// src/components/Header.tsx
'use client'

import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold text-gray-800">
            Güzellik Merkezi
          </Link>
        </div>
      </div>
    </header>
  );
}