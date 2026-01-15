import Link from "next/link";

type ActionButtonProps = {
  label: string;
  variant?: "primary" | "ghost";
  full?: boolean;
  href?: string;
};

export function ActionButton({
  label,
  variant = "primary",
  full = false,
  href,
}: ActionButtonProps) {
  const base =
    "rounded-full px-5 py-2 text-sm font-semibold transition focus:outline-none";
  const variants = {
    primary:
      "bg-rose-500 text-white shadow-sm hover:bg-rose-600 hover:shadow-md",
    ghost:
      "border border-rose-200 bg-white text-rose-500 hover:border-rose-300 hover:bg-rose-50",
  };

  const className = `${base} ${variants[variant]} ${full ? "w-full" : ""}`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    );
  }

  return <button className={className}>{label}</button>;
}
