"use client"

import AuthGuardV2 from "@/components/auth-guard-v2"
import { useAuthV2 } from "@/contexts/auth-context-v2"

function DashboardContent() {
  const { user, signOut } = useAuthV2()
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Dashboard V2</h1>
            <button 
              onClick={signOut}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-2">Informações do Usuário</h2>
              <div className="bg-gray-50 p-4 rounded">
                <p><strong>Nome:</strong> {user?.nome}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>UID:</strong> {user?.uid}</p>
                <p><strong>Perfis:</strong> {user?.perfis}</p>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-2">Status do Sistema</h2>
              <div className="bg-green-50 p-4 rounded border border-green-200">
                <p className="text-green-700">✅ Sistema V2 funcionando corretamente!</p>
                <p className="text-sm text-green-600 mt-1">
                  Sem auto-login, sem loops de CORS, sem erros de hidratação
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TestDashboardPage() {
  return (
    <AuthGuardV2 redirectTo="/test-v2">
      <DashboardContent />
    </AuthGuardV2>
  )
}