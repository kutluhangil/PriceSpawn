"use client";

import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hue: number; // -1 = theme color, else spectrum hue
}

const SPECTRUM = [0, 35, 140, 200, 260]; // red, amber, green, blue, violet

export function ConstellationBg() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let nodes: Node[] = [];
    let raf = 0;

    function build() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = w + "px";
      canvas!.style.height = h + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(96, Math.round((w * h) / 16000));
      nodes = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        hue: i % 7 === 0 ? SPECTRUM[i % SPECTRUM.length] : -1,
      }));
    }

    function themeColor() {
      return document.documentElement.dataset.theme === "light"
        ? [60, 70, 110]
        : [150, 162, 235];
    }

    function draw() {
      const [r, g, b] = themeColor();
      ctx!.clearRect(0, 0, w, h);
      const D = 130;
      // lines
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const c = nodes[j];
          const dx = a.x - c.x;
          const dy = a.y - c.y;
          const dist = Math.hypot(dx, dy);
          if (dist > D) continue;
          const alpha = (1 - dist / D) * 0.5;
          const hue = a.hue >= 0 ? a.hue : c.hue;
          if (hue >= 0) {
            ctx!.strokeStyle = `hsla(${hue}, 85%, 65%, ${alpha * 0.9})`;
          } else {
            ctx!.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          }
          ctx!.lineWidth = 1;
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(c.x, c.y);
          ctx!.stroke();
        }
      }
      // dots
      for (const n of nodes) {
        if (n.hue >= 0) {
          ctx!.fillStyle = `hsla(${n.hue}, 85%, 65%, 0.9)`;
        } else {
          ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, 0.55)`;
        }
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.hue >= 0 ? 2.2 : 1.4, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function step() {
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      draw();
      raf = requestAnimationFrame(step);
    }

    build();
    if (reduced) {
      draw();
    } else {
      raf = requestAnimationFrame(step);
    }

    const onResize = () => build();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-[9] opacity-70"
    />
  );
}
