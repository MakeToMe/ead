import { ShieldCheck } from "lucide-react";

/**
 * Decorative ribbon-seal used on the public certificate.
 * Purely visual – no interactivity, so kept as a server component.
 */
export default function RibbonSeal() {
  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Serrated circle */}
      <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow-[0_0_25px_rgba(216,180,254,0.7)] flex items-center justify-center text-white">
        <ShieldCheck className="w-12 h-12" />
        {/* Text ring */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          fill="none"
          stroke="white"
          strokeWidth="2"
        >
          <defs>
            <path
              id="circlePath"
              d="M50 50 m -40,0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0"
            />
          </defs>
          <text fontSize="6" fontWeight="600">
            <textPath href="#circlePath" startOffset="0">
              SABER365 • CERTIFICATE • SABER365 • CERTIFICATE •
            </textPath>
          </text>
        </svg>
      </div>

      {/* Ribbon tails */}
      <div className="w-3 h-8 bg-purple-700 -mt-1 rotate-12 rounded-b-md shadow-lg" />
      <div className="w-3 h-8 bg-purple-700 -mt-8 -rotate-12 rounded-b-md shadow-lg" />
    </div>
  );
}
