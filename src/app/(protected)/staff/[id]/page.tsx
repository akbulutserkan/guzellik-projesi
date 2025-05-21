'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Service {
  id: string
  name: string
  duration: number
  price: number
}

interface Appointment {
  id: string
  startTime: string
  endTime: string
  status: string
  customer: {
    firstName: string
    lastName: string
  }
  service: {
    name: string
  }
}

interface Staff {
  id: string
  firstName: string
  lastName: string
  phone: string
  services: Service[]
  appointments: Appointment[]
}

export default function StaffDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [staff, setStaff] = useState<Staff | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchStaffDetails = async () => {
      try {
        const response = await fetch(`/api/staff/${params.id}`)
        if (!response.ok) throw new Error('Personel bilgileri alınamadı')
        const data = await response.json()
        setStaff(data)
      } catch (error) {
        console.error('Veri yüklenirken hata:', error)
        setError('Personel bilgileri yüklenirken bir hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    fetchStaffDetails()
  }, [params.id])

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (error || !staff) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'Personel bulunamadı'}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <Link
          href="/staff"
          className="text-blue-500 hover:text-blue-700 mb-4 inline-block"
        >
          ← Personel Listesine Dön
        </Link>
        <h1 className="text-3xl font-bold">
          {staff.firstName} {staff.lastName}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Personel Bilgileri</h2>
          <div className="space-y-3">
            <p><span className="font-medium">Telefon:</span> {staff.phone}</p>
            <div>
              <h3 className="font-medium mb-2">Verdiği Hizmetler:</h3>
              {staff.services.length > 0 ? (
                <ul className="list-disc list-inside text-gray-600">
                  {staff.services.map(service => (
                    <li key={service.id}>
                      {service.name} ({service.duration} dk - {service.price.toLocaleString('tr-TR', {
                        style: 'currency',
                        currency: 'TRY'
                      })})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">Henüz hizmet atanmamış</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Son Randevuları</h2>
          {staff.appointments && staff.appointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Tarih</th>
                    <th className="text-left py-2">Müşteri</th>
                    <th className="text-left py-2">Hizmet</th>
                    <th className="text-left py-2">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.appointments.map(appointment => (
                    <tr key={appointment.id} className="border-b">
                      <td className="py-2">
                        {new Date(appointment.startTime).toLocaleString('tr-TR', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </td>
                      <td className="py-2">
                        {appointment.customer.firstName} {appointment.customer.lastName}
                      </td>
                      <td className="py-2">{appointment.service.name}</td>
                      <td className="py-2">{appointment.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 italic">Henüz randevu bulunmamaktadır.</p>
          )}
        </div>
      </div>
    </div>
  )
}