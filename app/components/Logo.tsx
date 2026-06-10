export default function Logo({ className = "h-10" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        className="font-extrabold text-2xl bg-clip-text text-transparent"
        style={{
          backgroundImage: "linear-gradient(135deg, #22c1ff 0%, #3b3bf5 50%, #5a2bd6 100%)",
        }}
      >
        Depack
      </span>
    </div>
  );
}
