'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Service {
  id: string
  name: string
  categoryId: string
  category: {
    id: string
    name: string
  }
}

interface Category {
  id: string
  name: string
}

interface ServicesByCategory {
  [key: string]: Service[]
}

export default function NewPackagePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [servicesByCategory, setServicesByCategory] = useState<ServicesByCategory>({})
  const [formData, setFormData] = useState({
    name: '',
    sessionCount: 1,
    price: 0,
    categoryId: '',
    selectedServices: [] as string[]
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, servicesRes] = await Promise.all([
          fetch('/api/package-categories'),
          fetch('/api/services')
        ])

        if (!categoriesRes.ok || !servicesRes.ok) {
          throw new Error('Veriler yüklenirken hata oluştu')
        }

        const [categoriesData, servicesData] = await Promise.all([
          categoriesRes.json(),
          servicesRes.json()
        ])

        setCategories(categoriesData)
        setServices(servicesData)

        // Hizmetleri kategorilerine göre grupla
        const groupedServices = servicesData.reduce((acc: ServicesByCategory, service: Service) => {
          const categoryId = service.category.id
          if (!acc[categoryId]) {
            acc[categoryId] = []
          }
          acc[categoryId].push(service)
          return acc
        }, {})

        setServicesByCategory(groupedServices)
      } catch (error) {
        console.error('Data fetch error:', error)
        setError('Veriler yüklenirken bir hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          sessionCount: Number(formData.sessionCount),
          price: Number(formData.price),
          categoryId: formData.categoryId,
          serviceIds: formData.selectedServices
        }),
      })

      if (!response.ok) {
        throw new Error('Paket oluşturulurken bir hata oluştu')
      }

      router.push('/packages')
      router.refresh()
    } catch (error) {
      console.error('Package creation error:', error)
      setError('Paket oluşturulurken bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter(id => id !== serviceId)
        : [...prev.selectedServices, serviceId]
    }))
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Yeni Paket Oluştur</h1>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Paket Adı
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            required
          />
        </div>



        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
            Kategori
          </label>
          <select
            id="categoryId"
            value={formData.categoryId}
            onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            required
          >
            <option value="">Kategori Seçin</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sessionCount" className="block text-sm font-medium text-gray-700 mb-1">
            Seans Sayısı
          </label>
          <input
            type="number"
            id="sessionCount"
            value={formData.sessionCount}
            onChange={(e) => setFormData(prev => ({ ...prev, sessionCount: parseInt(e.target.value) }))}
            min="1"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Fiyat
          </label>
          <input
            type="number"
            id="price"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
            min="0"
            step="0.01"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hizmetler
          </label>
          <div className="space-y-4 border rounded-md p-4">
            {Object.entries(servicesByCategory).map(([categoryId, services]) => {
              // İlgili kategoriyi bul
              const category = services[0]?.category
              if (!category) return null

              return (
                <div key={categoryId} className="space-y-2">
                  <h3 className="font-medium text-gray-900">{category.name}</h3>
                  <div className="ml-4 space-y-2">
                    {services.map((service) => (
                      <label key={service.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.selectedServices.includes(service.id)}
                          onChange={() => handleServiceToggle(service.id)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                        />
                        <span className="ml-2 text-sm text-gray-600">{service.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {saving ? 'Kaydediliyor...' : 'Oluştur'}
          </button>
          
          <button
            type="button"
            onClick={() => router.push('/packages')}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            İptal
          </button>
        </div>
      </form>
    </div>
  )
}