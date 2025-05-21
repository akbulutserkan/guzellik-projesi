'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewCustomerPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Bir hata oluştu')
      }

      router.push('/customers')
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

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fullName = e.target.value
    const lastSpaceIndex = fullName.lastIndexOf(' ')

    if (lastSpaceIndex === -1) {
      setFormData(prev => ({
        ...prev,
        firstName: fullName,
        lastName: ''
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        firstName: fullName.slice(0, lastSpaceIndex),
        lastName: fullName.slice(lastSpaceIndex + 1)
      }))
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Yeni Müşteri Ekle</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-lg bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="mb-4 col-span-2">
            <label htmlFor="fullName" className="block text-gray-700 font-bold mb-2">
              Ad Soyad
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              placeholder="Ad Soyad"
              value={`${formData.firstName} ${formData.lastName}`} // .trim() kaldırıldı
              onChange={handleFullNameChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="mb-6 col-span-2">
            <label htmlFor="phone" className="block text-gray-700 font-bold mb-2">
              Telefon
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              placeholder="Telefon"
              value={formData.phone}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="flex items-center justify-between col-span-2">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Kaydet
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              İptal
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}