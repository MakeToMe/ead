import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AuthProviderV2 } from "@/contexts/auth-context-v2"
import DashboardLayout from "@/components/dashboard-layout"
import { Toaster } from "@/components/ui/toaster"
import DebugLoader from "@/components/debug-loader"
import LogCleanupInit from "@/components/log-cleanup-init"
import "@/lib/logging-init" // Inicializar sistema de logging
import "@/lib/utils/simple-log-cleanup" // Configurar limpeza de logs
import "./globals.css"



const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Saber365",
  description: "Plataforma de cursos Saber365",
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
        <AuthProviderV2>
          <DashboardLayout>{children}</DashboardLayout>
          <Toaster />
          <DebugLoader />
          <LogCleanupInit />
        </AuthProviderV2>
      </body>
    </html>
  )
}
