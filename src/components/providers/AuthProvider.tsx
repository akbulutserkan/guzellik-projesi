'use client'
 
import { SessionProvider } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'

// Kullanıcı kimlik doğrulama durumunu yöneten bileşen
function AuthStatusWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [authAttempted, setAuthAttempted] = useState(false)

  useEffect(() => {
    // Sadece bir kez oturum açma girişimi yapılmasını sağla
    if (status === 'unauthenticated' && !authAttempted && !pathname.includes('/auth/login')) {
      setAuthAttempted(true) // Oturum açma girişimi yapıldığını işaretle
      
      // Otomatik olarak admin kullanıcısı olarak giriş yap
      signIn('credentials', { 
        username: 'admin', 
        password: 'admin123',
        redirect: false
      }).then((result) => {
        // Başarılı ise sessizce devam et
        if (!result?.error) {
          console.log("Otomatik giriş başarılı")
        } else {
          console.error("Otomatik giriş başarısız:", result.error)
        }
      })
    }
    
    // Kullanıcı login olmuşsa ve login sayfasındaysa ana sayfaya yönlendir
    if (status === 'authenticated' && pathname.includes('/auth/login')) {
      router.replace('/customers')
    }
  }, [status, pathname, router, authAttempted])

  return <>{children}</>
}
 
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthStatusWrapper>{children}</AuthStatusWrapper>
    </SessionProvider>
  )
}