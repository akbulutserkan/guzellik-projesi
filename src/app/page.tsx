'use client'

import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return  (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-12">
        Güzellik Merkezi Yönetim Sistemi
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Müşteriler */}
        <Link href="/customers" className="block bg-white shadow-md rounded-lg p-6 hover:shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Müşteriler</h2>
          <p className="text-gray-600">Müşteri yönetimi ve takibi</p>
        </Link>

        {/* Randevular */}
        <Link href="/appointments" className="block bg-white shadow-md rounded-lg p-6 hover:shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Randevular</h2>
          <p className="text-gray-600">Randevu yönetimi ve takibi</p>
        </Link>

        {/* Takvim */}
        <Link href="/calendar" className="block bg-white shadow-md rounded-lg p-6 hover:shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Takvim</h2>
          <p className="text-gray-600">Personel ve randevu takvimi</p>
        </Link>

        {/* Hizmetler */}
        <Link href="/services" className="block bg-white shadow-md rounded-lg p-6 hover:shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Hizmetler</h2>
          <p className="text-gray-600">Hizmet yönetimi ve fiyatlandırma</p>
        </Link>

        {/* Ürünler */}
        <Link href="/products" className="block bg-white shadow-md rounded-lg p-6 hover:shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ürünler</h2>
          <p className="text-gray-600">Ürün yönetimi ve stok takibi</p>
        </Link>

        {/* Personel */}
        <Link href="/staff" className="block bg-white shadow-md rounded-lg p-6 hover:shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Personel</h2>
          <p className="text-gray-600">Personel yönetimi ve bilgileri</p>
        </Link>

        {/* Tahsilatlar */}
        <Link href="/payments" className="block bg-white shadow-md rounded-lg p-6 hover:shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tahsilatlar</h2>
          <p className="text-gray-600">Tahsilat takibi ve yönetimi</p>
        </Link>
      </div>

    </div>
  );
}