import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: number;
}

export default function VerifiedCVLogo({ className = "", size = 32 }: LogoProps) {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {/* If logo.png exists in /public/logo.png */}
      <img
        src="/logo.png"
        alt="VerifiedCV Logo"
        width={size}
        height={size}
        className="object-contain"
        onError={(e) => {
          // If image file isn't in /public yet, fall back to pure SVG
          e.currentTarget.style.display = "none";
          const fallback = e.currentTarget.nextElementSibling;
          if (fallback) fallback.classList.remove("hidden");
        }}
      />

      {/* High-fidelity Vector SVG recreation of the interlocking checkmark mark */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="hidden"
        style={{ width: size, height: size }}
      >
        <g transform="rotate(-45 50 50)">
          {/* Deep Navy Upper Polygon */}
          <rect
            x="20"
            y="20"
            width="32"
            height="44"
            rx="10"
            fill="#13253F"
          />
          {/* Emerald Lower Check Wing */}
          <rect
            x="36"
            y="36"
            width="44"
            height="32"
            rx="10"
            fill="#00A896"
          />
          {/* Interlocking Negative Notch */}
          <rect
            x="34"
            y="34"
            width="12"
            height="12"
            rx="3"
            fill="#F8FAFC"
          />
        </g>
      </svg>
    </div>
  );
}