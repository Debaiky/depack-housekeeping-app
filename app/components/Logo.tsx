import Image from "next/image";

export default function Logo({ className = "h-10" }: { className?: string }) {
  return (
    <Image
      src="/depack-logo.png"
      alt="Depack"
      width={160}
      height={40}
      priority
      className={`w-auto object-contain ${className}`}
    />
  );
}
