import { siteConfig } from "@/config/site";

export function BackgroundHearts() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {siteConfig.decorations.hearts.map((heart) => (
        <span
          key={heart.id}
          className={`absolute animate-float-heart opacity-20 text-rose-300 ${heart.size}`}
          style={{
            top: (heart as any).top,
            left: (heart as any).left,
            right: (heart as any).right,
            bottom: (heart as any).bottom,
            animationDelay: `${Math.random() * 2}s`,
          }}
        >
          💖
        </span>
      ))}
    </div>
  );
}
