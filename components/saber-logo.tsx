import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
}

// Simple neon shield logo placeholder for Saber365
export default function SaberLogo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("fill-none stroke-current", className)}
    >
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <path
        d="M32 2 L58 14 V34 C58 48 46 58 32 62 C18 58 6 48 6 34 V14 L32 2 Z"
        stroke="url(#grad)"
        strokeWidth="4"
        fill="#0000"
      />
      <path
        d="M32 14 L48 22 V32 C48 41 40 48 32 50 C24 48 16 41 16 32 V22 L32 14 Z"
        stroke="url(#grad)"
        strokeWidth="3"
        fill="#0000"
      />
    </svg>
  )
}
