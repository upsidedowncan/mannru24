"use client";

import { useEffect, useState, useRef, type ReactNode } from "react";

function patchWebGL() {
  if (typeof window === "undefined") return;
  const fix = (proto: any) => {
    if (!proto || proto._patched) return;
    const orig = proto.shaderSource;
    proto.shaderSource = function (shader: any, source: string) {
      return orig.call(this, shader, source.replace(/__/g, "_"));
    };
    proto._patched = true;
  };
  if (window.WebGLRenderingContext) fix(WebGLRenderingContext.prototype);
  if (window.WebGL2RenderingContext) fix(WebGL2RenderingContext.prototype);
}

patchWebGL();

function checkWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

export function WebGLGuard({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    setOk(checkWebGL());
  }, []);

  if (!ok) return <>{fallback}</>;
  return <>{children}</>;
}

export function HeroShaderFallback() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let t = 0;
    const animate = () => {
      t += 0.005;
      const x = Math.sin(t) * 30;
      const y = Math.cos(t * 0.7) * 20;
      el.style.backgroundPosition = `${50 + x}% ${50 + y}%`;
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        background:
          "radial-gradient(ellipse at 30% 20%, rgba(59,130,246,0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(139,92,246,0.12) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(14,165,233,0.08) 0%, transparent 60%), linear-gradient(135deg, #0a0a0a 0%, #111827 50%, #0a0a0a 100%)",
        backgroundSize: "150% 150%",
        transition: "background-position 0.1s linear",
      }}
    />
  );
}
