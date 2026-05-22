"use client";

import { Shader, FilmGrain, Swirl, ChromaFlow } from "shaders/react";

export default function HeroBackgroundShader() {
  return (
    <Shader className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.5 }}>
      <Swirl colorA="#241e04" colorB="#f54a00" colorSpace="lch" detail={1.4} blend={46} speed={0.8} />
      <ChromaFlow baseColor="#0066ff" upColor="#00ff00" downColor="#ff0000" leftColor="#0000ff" rightColor="#ffff00" intensity={1} radius={3} momentum={30} opacity={0.4} />
      <FilmGrain opacity={0.03} />
    </Shader>
  );
}
