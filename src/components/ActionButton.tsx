import Link from "next/link";

type ActionButtonProps = {
  label: string;
  variant?: "primary" | "secondary" | "ghost";
  full?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
};

export function ActionButton({
  label,
  variant = "primary",
  full = false,
  href,
  onClick,
  className = "",
}: ActionButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-full transition-all active:scale-95 font-black text-center select-none";
  
  const variants = {
    primary:
      "bg-rose-500 text-white shadow-[0_15px_30px_rgba(244,114,182,0.4)] hover:bg-rose-600 hover:scale-105",
    secondary:
      "bg-rose-100 text-rose-600 hover:bg-rose-200 hover:scale-105",
    ghost:
      "text-rose-400 hover:text-rose-600 underline-offset-8 hover:underline font-bold",
  };

  const sizes = {
    primary: "px-12 py-6 text-3xl",
    secondary: "px-8 py-4 text-xl",
    ghost: "px-4 py-2 text-xl",
  };

  const combinedClassName = `${base} ${variants[variant]} ${sizes[variant]} ${full ? "w-full" : ""} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combinedClassName}>
        {label}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={combinedClassName}>
      {label}
    </button>
  );
}
