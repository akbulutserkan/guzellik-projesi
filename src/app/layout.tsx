// src/app/layout.tsx
import { Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/components/providers/AuthProvider';  
import ClientFetchInterceptor from '@/components/ClientFetchInterceptor';
import Script from 'next/script';


const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return (
   <html lang="tr" className="h-full">
     <body className={`${inter.className} h-full`}>
       <ClientFetchInterceptor />
       <AuthProvider>
         {children}

       </AuthProvider>
     </body>
   </html>
 );
}