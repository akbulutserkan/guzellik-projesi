'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Category {
  id: string
  name: string
}

interface Service {
  id: string
  name: string
  categoryId: string
  category: Category
}

interface Staff {
  id: string
  firstName: string
  lastName: string
  phone: string
  services: Service[]
}

export default function EditStaffPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState<Service[]>([])
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    serviceIds: [] as string[]
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Hizmetleri MCP aracı ile al
        const servicesResponse = await fetch('/api/mcp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'call_tool',
            params: {
              name: 'get-services',
              arguments: {}
            }
          })
        })
        
        // Personel bilgilerini MCP aracı ile al
        const staffResponse = await fetch('/api/mcp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'call_tool',
            params: {
              name: 'get-staff-by-id',
              arguments: { id }
            }
          })
        })

        const servicesResult = await servicesResponse.json()
        const staffResult = await staffResponse.json()

        if (!servicesResult.success || !staffResult.success) {
          throw new Error(servicesResult.error || staffResult.error || 'Veriler alınamadı')
        }

        setServices(servicesResult.data)
        
        const staffData = staffResult.data
        // İsmi parçalara ayır (ad ve soyad)
        const nameParts = staffData.name ? staffData.name.split(' ') : ['', '']
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''
        
        setFormData({
          firstName: firstName,
          lastName: lastName,
          phone: staffData.phone || '',
          serviceIds: staffData.services.map((s: Service) => s.id)
        })
      } catch (error) {
        console.error('Veri yüklenirken hata:', error)
        setError('Veriler yüklenirken bir hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      // Tam adı oluştur
      const fullName = `${formData.firstName} ${formData.lastName}`.trim()
      
      // MCP aracı ile personel güncelleme
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'call_tool',
          params: {
            name: 'update-staff',
            arguments: {
              id: id,
              name: fullName,
              phone: formData.phone,
              services: formData.serviceIds
            }
          }
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Personel güncellenirken bir hata oluştu')
      }

      router.push('/staff')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleServiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target
    setFormData(prev => {
      const serviceIds = checked
        ? [...prev.serviceIds, value]
        : prev.serviceIds.filter(id => id !== value)
      return {
        ...prev,
        serviceIds
      }
    })
  }

  if (loading) {
    return <div className="container mx-auto p-8">Yükleniyor...</div>
  }

  // Hizmetleri kategorilerine göre grupla
  const groupedServices = services.reduce((acc, service) => {
    const categoryName = service.category?.name || 'Diğer'
    if (!acc[categoryName]) {
      acc[categoryName] = []
    }
    acc[categoryName].push(service)
    return acc
  }, {} as Record<string, Service[]>)

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Personel Düzenle</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-lg bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <div className="flex gap-4 bg-gray-50 p-4 rounded-lg shadow-sm">
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="flex-1 shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Ad"
              required
            />
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="flex-1 shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Soyad"
            />
          </div>
        </div>

        <div className="mb-4">
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Telefon"
            />
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="serviceIds" className="block text-gray-700 font-bold mb-2">
            Verebileceği Hizmetler
          </label>
          <div className="space-y-4">
            {Object.entries(groupedServices).map(([categoryName, categoryServices]) => (
              <div key={categoryName} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <strong className="block text-gray-700 text-lg font-semibold mb-3 bg-gray-100 p-2 rounded-md">
                  {categoryName}
                </strong>
                <div className="grid grid-cols-2 gap-3">
                  {categoryServices.map(service => (
                    <label key={service.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="serviceIds"
                        value={service.id}
                        checked={formData.serviceIds.includes(service.id)}
                        onChange={handleServiceChange}
                        className="form-checkbox h-5 w-5 text-blue-600 rounded"
                      />
                      <span className="text-gray-700">{service.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Güncelle
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            İptal
          </button>
        </div>
      </form>
    </div>
  )
}