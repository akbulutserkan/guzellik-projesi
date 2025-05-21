'use client';

// Bu sayfa artık kullanılmıyor, yerine modal kullanılıyor
// Ancak sayfa yapısını bozmamak için basit bir yönlendirme sayfası olarak bırakıyoruz

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function EditCustomerRedirectPage() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    // Detay sayfasına yönlendir
    router.push(`/customers/${params.id}`);
  }, [params.id, router]);

  return (
    <div className="flex justify-center items-center h-screen">
      <p className="text-gray-500">Yönlendiriliyor...</p>
    </div>
  );
}
