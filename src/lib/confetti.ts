/**
 * Lightweight confetti burst — no dependency. Spawns DOM particles animated via
 * the Web Animations API, cleans itself up. Honors prefers-reduced-motion.
 * Used to celebrate a winning bet validation.
 */
export function fireConfetti(count = 90) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const colors = ["#10b981", "#3b82f6", "#f59e0b", "#e2e8f0", "#34d399"];
  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden";
  document.body.appendChild(container);

  const W = window.innerWidth;
  const H = window.innerHeight;

  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    const size = 6 + Math.random() * 6;
    const color = colors[Math.floor(Math.random() * colors.length)];
    p.style.cssText = `position:absolute;top:-16px;left:${
      Math.random() * W
    }px;width:${size}px;height:${
      size * 0.6
    }px;background:${color};border-radius:2px;will-change:transform,opacity`;
    container.appendChild(p);

    const dx = (Math.random() - 0.5) * 260;
    const dy = H + 60;
    const rot = (Math.random() - 0.5) * 720;
    const duration = 1500 + Math.random() * 1300;

    const anim = p.animate(
      [
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        {
          transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`,
          opacity: 1,
          offset: 0.82,
        },
        {
          transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`,
          opacity: 0,
        },
      ],
      {
        duration,
        easing: "cubic-bezier(0.2, 0.6, 0.4, 1)",
        delay: Math.random() * 140,
      }
    );
    anim.onfinish = () => p.remove();
  }

  setTimeout(() => container.remove(), 3400);
}
