"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardSidebar from "./components/dashboard-sidebar"
import { ensureUserLoaded, type User } from "@/lib/auth-client"

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    ensureUserLoaded().then((current: User | null) => {
      if (current) {
        setUser(current)
        setIsLoading(false)
      } else {
        router.push("/")
      }
    })
  }, [router])

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-900 text-white items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <DashboardSidebar user={user} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
