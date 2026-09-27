import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: number;
}

export default function VerifiedCVLogo({ className = "", size = 32 }: LogoProps) {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' style={{ width: size, height: size }}>
        <rect width='32' height='32' rx='8' fill='#0F172A'/>
        <path d='M8 11L16 6L24 11V18C24 23 16 26.5 16 26.5C16 26.5 8 23 8 18V11Z' stroke='#059669' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'/>
        <path d='M12 16L15 19L20 13' stroke='#10B981' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'/>
      </svg>
    </div>
  );
}