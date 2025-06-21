import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/contexts/auth-context"
import DashboardLayout from "@/components/dashboard-layout"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Plataforma R$antos",
  description: "Plataforma de cursos R$antos",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        {/* CSS CIRÚRGICO - APENAS PARA CERTIFICADOS */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* APENAS para a página de certificados */
              [data-page="certificados"] {
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%) !important;
                color: #ffffff !important;
                min-height: 100vh !important;
              }
              
              /* APENAS skeleton de certificados */
              [data-skeleton="certificados-item"] {
                background-color: #1e293b !important;
                border: 1px solid #374151 !important;
                color: #ffffff !important;
              }
              
              [data-skeleton="certificados-item"] > * {
                background-color: #374151 !important;
                color: #ffffff !important;
              }
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <DashboardLayout>{children}</DashboardLayout>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
