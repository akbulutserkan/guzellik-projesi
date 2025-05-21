import { NextAuthOptions, DefaultSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcrypt'
import { Permission, UserRole } from '@prisma/client' // UserRole ve Permission import edildi

// User ve JWT arayüzlerini genişlettik
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string | null;
      role: UserRole;
      permissions: Permission[];

    } & DefaultSession["user"];
  }

  interface User {
    id: string
    name: string
    email: string | null
    role: UserRole
    permissions: Permission[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    permissions: Permission[]
  }
}

// Bu arayüzü authorize fonksiyonu içerisinde kullanacağız
interface Staff {
  id: string
  name: string
  email: string | null
  accountType: UserRole
  password: string
  permissions: Permission[]
  isLocked: boolean
  failedAttempts: number
  lastFailedLogin: Date | null
  lastLogin: Date | null
}

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 gün
  },
  debug: process.env.NODE_ENV === 'development',
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Kullanıcı adı ve şifre gerekli');
        }

        // staff değişkeninin tipini Staff arayüzü olarak belirledik
        const staff: Staff | null = await prisma.staff.findUnique({
          where: {
            username: credentials.username,
          },
          select: {
            id: true,
            name: true,
            email: true,
            accountType: true,
            password: true,
            permissions: true,
            isLocked: true,
            failedAttempts: true,
            lastFailedLogin: true,
            lastLogin: true,
          }
        });

        if (!staff) {
          throw new Error('Kullanıcı bulunamadı');
        }

        if (staff.isLocked) {
          throw new Error('Hesabınız kilitli');
        }

        const isValid = await compare(credentials.password, staff.password);

        if (!isValid) {
          await prisma.staff.update({
            where: { id: staff.id },
            data: {
              failedAttempts: { increment: 1 },
              lastFailedLogin: new Date(),
              isLocked: staff.failedAttempts >= 4
            }
          });
          throw new Error('Geçersiz şifre');
        }

        await prisma.staff.update({
          where: { id: staff.id },
          data: {
            failedAttempts: 0,
            lastFailedLogin: null,
            lastLogin: new Date(),
            isLocked: false,
          }
        });

        return {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: staff.accountType as UserRole, // Tip dönüşümü (casting)
          permissions: staff.permissions as Permission[] // Tip dönüşümü (casting)
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.permissions = user.permissions
      }
      return token
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id as string,
        role: token.role as UserRole,
        permissions: token.permissions as Permission[]
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url
      else if (url.startsWith("/")) return new URL(url, baseUrl).toString()
      return baseUrl
    }
  }
}