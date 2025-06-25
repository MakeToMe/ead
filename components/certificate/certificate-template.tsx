import { BookOpen } from "lucide-react"

export interface CertificateProps {
  avatarUrl?: string
  name: string
  course: string
  provider: string
  date: string
  description?: string
}

// Pure presentational component based on the original Vite/React template
// Converted to TypeScript React Server Component (works in both client/server)
export default function CertificateTemplate({
  name,
  course,
  provider,
  date,
  description = "",
  avatarUrl,
}: CertificateProps) {
  return (
    <div className="w-full p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
        {/* Left Section */}
        <div className="flex-1 p-4 sm:p-6 lg:p-12 bg-white">


          {/* Heading & recipient */}
          <div className="mb-6 lg:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 lg:mb-6 uppercase tracking-wide break-words">
              CERTIFICADO DE CONCLUSÃO
            </h1>

            <p className="text-base lg:text-lg text-gray-700 mb-2">Certificamos que</p>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 lg:mb-6 break-words">
              {name}
            </h2>

            <div className="mb-4 lg:mb-6">
              <p className="text-base lg:text-lg text-gray-700 mb-1">concluiu com êxito o curso</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900 mb-1 break-words text-balance">
                {course}
              </p>

            </div>

            {description && (
              <p className="text-sm lg:text-base text-gray-600 leading-relaxed mb-8 lg:mb-12 whitespace-pre-line break-words">
                {description}
              </p>
            )}
          </div>

          {/* Date */}
          <div className="mb-6 lg:mb-8">
            <p className="text-xs sm:text-sm text-gray-600 font-medium">DATA: {date}</p>
          </div>

          {/* Signatures placeholder */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 sm:gap-4">
            {/* Signature 1 */}
            <div className="text-center flex-1">
              <div className="mb-2">
                <svg
                  width="120"
                  height="40"
                  viewBox="0 0 120 40"
                  className="mx-auto w-20 sm:w-24 lg:w-30"
                >
                  <path
                    d="M10 30 Q 30 10, 50 25 Q 70 35, 90 20 Q 100 15, 110 25"
                    stroke="#374151"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p className="font-bold text-gray-900 text-sm lg:text-base">__________________</p>
              <p className="text-gray-600 text-xs lg:text-sm">Assinatura</p>
            </div>

            {/* Signature 2 */}
            <div className="text-center flex-1">
              <div className="mb-2">
                <svg
                  width="120"
                  height="40"
                  viewBox="0 0 120 40"
                  className="mx-auto w-20 sm:w-24 lg:w-30"
                >
                  <path
                    d="M15 25 Q 35 15, 55 30 Q 75 20, 95 28 Q 105 32, 115 20"
                    stroke="#374151"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p className="font-bold text-gray-900 text-sm lg:text-base">__________________</p>
              <p className="text-gray-600 text-xs lg:text-sm">Assinatura</p>
            </div>
          </div>
        </div>

        {/* Decorative Right Section */}
        <div className="flex-1 bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 relative">
          {/* Background rings */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-6 right-6 rounded-full bg-purple-600/80 p-1 shadow-lg"></div>
            <div className="absolute top-20 right-20 w-16 h-16 border border-purple-300 rounded-full"></div>
            <div className="absolute bottom-20 left-10 w-24 h-24 border border-purple-300 rounded-full"></div>
          </div>

          <div className="relative z-10 p-8 lg:p-12 flex flex-col justify-between min-h-[600px]">
            {/* Avatar badge - TOPO */}
            <div className="text-center flex justify-center">
              <div className="relative">
                <div className="relative">
                  {/* Glow ring */}
                  <div className="absolute inset-0 rounded-full bg-purple-500 blur-xl opacity-30"></div>
                  {/* Avatar container */}
                  <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-xl overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-28 h-28 rounded-full object-cover" />
                    ) : (
                      <BookOpen className="w-20 h-20 text-white" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Circular medal - CENTRO */}
            <div className="relative flex justify-center">
              <div className="absolute inset-0 w-36 h-36 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-30 blur-xl -translate-x-2 -translate-y-2"></div>
              <div className="relative w-32 h-32 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-full flex items-center justify-center shadow-2xl border-4 border-purple-300/30">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-purple-200/20">
                  <BookOpen className="w-12 h-12 text-white drop-shadow-lg" />
                </div>
              </div>

              {/* Rotating circular text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-36 h-36 absolute animate-spin"
                  style={{ animationDuration: "20s" }}
                  viewBox="0 0 144 144"
                >
                  <defs>
                    <path
                      id="circle"
                      d="M 72,72 m -56,0 a 56,56 0 1,1 112,0 a 56,56 0 1,1 -112,0"
                    />
                  </defs>
                  <text className="text-xs fill-white font-medium tracking-wider">
                    <textPath href="#circle" startOffset="0%">
                      {provider} • {course} •
                    </textPath>
                  </text>
                </svg>
              </div>

              {/* Ribbon */}
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                <div className="w-6 h-20 bg-gradient-to-b from-purple-500 via-purple-600 to-purple-700 relative shadow-lg">
                  <div className="absolute bottom-0 left-0 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[12px] border-l-transparent border-r-transparent border-t-purple-700"></div>
                </div>
              </div>
            </div>

            {/* Logo Saber365 - BASE */}
            <div className="text-center">
              <div className="flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded flex items-center justify-center mr-2">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="text-white">
                  <p className="font-bold text-sm leading-none">{provider}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
