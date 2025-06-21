import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function CertificadosLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-muted animate-pulse rounded w-64" />
        <div className="h-4 bg-muted animate-pulse rounded w-96" />
      </div>

      {/* Stats Skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-2">
              <div className="h-4 bg-muted animate-pulse rounded w-32" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Skeleton */}
      <Card>
        <CardHeader className="space-y-2">
          <div className="h-6 bg-muted animate-pulse rounded w-48" />
          <div className="h-4 bg-muted animate-pulse rounded w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-muted animate-pulse rounded-lg" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-48" />
                  <div className="h-3 bg-muted animate-pulse rounded w-32" />
                </div>
              </div>
              <div className="flex space-x-2">
                <div className="h-8 bg-muted animate-pulse rounded w-20" />
                <div className="h-8 bg-muted animate-pulse rounded w-20" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
