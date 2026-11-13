import { CONFETTI_COLORS } from "@/lib/theme";

const GRAVITY = 0.32; // px per frame² (at ~60fps), scaled by dt
const DRAG = 0.99;

type Particle = {
  el: HTMLDivElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  wobble: number;
  wobbleSpeed: number;
  life: number; // frames lived
  ttl: number; // frames before fade completes
};

type Cannon = { x: number; y: number; lean: number };

function createParticle(container: HTMLDivElement, cannon: Cannon): Particle {
  const colors = CONFETTI_COLORS;
  const angle = -Math.PI / 2 + cannon.lean + (Math.random() - 0.5) * 0.7;
  const speed = 15 + Math.random() * 13;
  const isCircle = Math.random() < 0.35;
  const size = 6 + Math.random() * 7;
  const color = colors[Math.floor(Math.random() * colors.length)];

  const el = document.createElement("div");
  el.style.cssText = `position:absolute;top:0;left:0;width:${size}px;height:${isCircle ? size : size * 0.45}px;background:${color};border-radius:${
    isCircle ? "50%" : "1px"
  };will-change:transform,opacity`;
  container.appendChild(el);

  return {
    el,
    x: cannon.x,
    y: cannon.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    rot: Math.random() * 360,
    vrot: (Math.random() - 0.5) * 28,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.08 + Math.random() * 0.1,
    life: 0,
    ttl: 150 + Math.random() * 60,
  };
}

/** Avance une particule de `dt` frames (gravité + traînée + flottement) et met à jour son style. */
function stepParticle(p: Particle, dt: number) {
  p.life += dt;
  p.wobble += p.wobbleSpeed * dt;
  const dragF = Math.pow(DRAG, dt);
  p.vx = p.vx * dragF + Math.sin(p.wobble) * 0.3 * dt;
  p.vy = p.vy * dragF + GRAVITY * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.rot += p.vrot * dt;

  const fadeFrom = p.ttl * 0.7;
  const opacity = p.life < fadeFrom ? 1 : 1 - (p.life - fadeFrom) / (p.ttl - fadeFrom);

  p.el.style.opacity = String(opacity);
  p.el.style.transform = `translate(${p.x}px,${p.y}px) rotate(${p.rot}deg)`;
}

function animate(particles: Particle[], container: HTMLDivElement) {
  let last = performance.now();
  let raf = 0;

  const tick = (now: number) => {
    const dt = Math.min(2.5, (now - last) / 16.667);
    last = now;

    let alive = 0;
    for (const p of particles) {
      if (p.life >= p.ttl) continue;
      alive++;
      stepParticle(p, dt);
    }

    if (alive > 0) {
      raf = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(raf);
      container.remove();
    }
  };

  raf = requestAnimationFrame(tick);

  // Hard safety net in case a tab is backgrounded mid-animation.
  setTimeout(() => {
    cancelAnimationFrame(raf);
    container.remove();
  }, 6000);
}

/**
 * Confetti burst — no dependency. Two party-popper cannons fire from the bottom
 * corners toward the center; particles follow a real gravity + drag + spin
 * simulation driven by a single requestAnimationFrame loop (delta-timed, so it
 * stays consistent across refresh rates). Mixed shapes (strips + circles),
 * subtle horizontal flutter, fade-out at end of life. Self-cleans. Honors
 * prefers-reduced-motion. Used to celebrate a winning bet validation.
 */
export function fireConfetti(count = 150) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const container = document.createElement("div");
  container.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden";
  document.body.appendChild(container);

  const W = window.innerWidth;
  const H = window.innerHeight;
  const cannons: Cannon[] = [
    { x: W * 0.08, y: H + 8, lean: 0.32 }, // bottom-left, fires up-right
    { x: W * 0.92, y: H + 8, lean: -0.32 }, // bottom-right, fires up-left
  ];

  const particles: Particle[] = [];
  const n = Math.floor(count / cannons.length);
  for (const cannon of cannons) {
    for (let i = 0; i < n; i++) particles.push(createParticle(container, cannon));
  }

  animate(particles, container);
}
