'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/appointments')
  }, [router])

  return (
    <div className="container mx-auto p-8 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <p className="ml-2">Yönlendiriliyor...</p>
    </div>
  )
}
