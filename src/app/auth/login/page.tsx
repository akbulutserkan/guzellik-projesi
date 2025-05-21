// src/app/(auth)/login/page.tsx
'use client'
import { signIn, useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loginAttempted, setLoginAttempted] = useState(false)

  // Kimlik doğrulama durumunu izle
  useEffect(() => {
    if (status === 'authenticated') {
      // Oturum açılmışsa, customers sayfasına yönlendir
      router.replace('/customers')
    } else if (status === 'unauthenticated' && !loginAttempted) {
      // Oturum açılmamışsa ve daha önce denenmemişse, otomatik giriş yap
      setLoginAttempted(true)
      autoLogin()
    }
  }, [status, router, loginAttempted])

  const autoLogin = async () => {
    try {
      console.log("Otomatik giriş deneniyor...")
      // Otomatik olarak admin kullanıcısıyla giriş yap
      const result = await signIn('credentials', {
        username: 'admin',
        password: 'admin123',
        redirect: false
      })

      if (result?.error) {
        console.error("Otomatik giriş hatası:", result.error)
        setError(result.error)
        setIsLoading(false)
      } else {
        console.log("Otomatik giriş başarılı, yönlendiriliyor...")
      }
      // Başarılı giriş işleminden sonra yönlendirme yapmayacağız
      // useSession hook'u status değişikliğini tespit edecek ve yönlendirmeyi yapacak
    } catch (error) {
      console.error("Beklenmeyen hata:", error)
      setError('Otomatik giriş başarısız oldu. Lütfen manuel olarak giriş yapın.')
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    try {
      console.log("Manuel giriş deneniyor...")
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false
      })

      if (result?.error) {
        console.error("Manuel giriş hatası:", result.error)
        setError(result.error)
        setIsLoading(false)
      } else {
        console.log("Manuel giriş başarılı, yönlendiriliyor...")
      }
      // Başarılı giriş işleminden sonra yönlendirme yapmayacağız
      // useSession hook'u status değişikliğini tespit edecek ve yönlendirmeyi yapacak
    } catch (error) {
      console.error("Beklenmeyen form hatası:", error)
      setError('Bir hata oluştu')
      setIsLoading(false)
    }
  }

  // Oturum durumu henüz bilinmiyorsa
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="text-center">
            <div className="inline-block animate-spin h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full"></div>
            <p className="mt-2 text-gray-700">Yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Giriş Yap</h1>
        
        {isLoading && !error && (
          <div className="text-center mb-4">
            <div className="inline-block animate-spin h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full"></div>
            <p className="mt-2 text-gray-700">Otomatik olarak giriş yapılıyor...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {(!isLoading || error) && (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Kullanıcı Adı
                </label>
                <input
                  type="text"
                  name="username"
                  defaultValue="admin"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Şifre
                </label>
                <input
                  type="password"
                  name="password"
                  defaultValue="admin123"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}