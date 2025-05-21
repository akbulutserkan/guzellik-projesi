// src/types/next-auth.d.ts
import { DefaultSession } from "next-auth"
import { Permission, UserRole } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      permissions: Permission[]
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: UserRole
    permissions: Permission[]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: UserRole
    permissions: Permission[]
  }
}