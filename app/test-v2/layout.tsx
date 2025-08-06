import { AuthProviderV2 } from "@/contexts/auth-context-v2"

export default function TestV2Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProviderV2>
      {children}
    </AuthProviderV2>
  )
}