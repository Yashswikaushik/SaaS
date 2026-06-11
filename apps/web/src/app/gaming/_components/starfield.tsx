'use client';

import { useEffect, useRef } from 'react';

type Star = {
  x: number;
  y: number;
  z: number; // depth 0..1 — drives size, speed and parallax amplitude
  hue: number;
  twinkle: number;
};

const STAR_COUNT = 220;

/** Full-viewport canvas of drifting neon particles with depth-based parallax
 *  against scroll and pointer. Sits fixed behind every section. */
export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let width = 0;
    let height = 0;
    const pointer = { x: 0.5, y: 0.5 };

    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random(),
      hue: Math.random() < 0.78 ? 270 + Math.random() * 40 : 188,
      twinkle: Math.random() * Math.PI * 2,
    }));

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onPointer = (e: PointerEvent) => {
      pointer.x = e.clientX / width;
      pointer.y = e.clientY / height;
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      const scroll = window.scrollY;

      for (const s of stars) {
        if (!reduced) {
          s.y -= (0.00002 + s.z * 0.00008);
          if (s.y < -0.02) {
            s.y = 1.02;
            s.x = Math.random();
          }
        }
        const px = s.x * width + (pointer.x - 0.5) * s.z * -60;
        const py =
          ((s.y * height + scroll * s.z * -0.22) % (height + 40) + height + 40) % (height + 40) - 20 +
          (pointer.y - 0.5) * s.z * -40;

        const pulse = reduced ? 1 : 0.65 + 0.35 * Math.sin(t / 600 + s.twinkle);
        const r = 0.4 + s.z * 1.8;
        ctx.beginPath();
        ctx.fillStyle = `hsla(${s.hue}, 95%, ${70 + s.z * 15}%, ${(0.25 + s.z * 0.6) * pulse})`;
        ctx.shadowColor = `hsla(${s.hue}, 95%, 65%, 0.9)`;
        ctx.shadowBlur = 4 + s.z * 10;
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointer);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
