"use client";

import { useProgression } from "@/lib/progression";

export function AdminOverlays() {
  const { isReadOnly, isBanned, exitPreview } = useProgression();

  if (isBanned) {
    return (
      <div className="fixed inset-0 z-[9999] bg-zinc-950 flex flex-col items-center justify-center text-center p-8">
        <div className="max-w-md space-y-6">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <span className="text-4xl select-none">🚫</span>
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-red-500 font-mono uppercase tracking-wide">
              Доступ заблокирован
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Ваш аккаунт забанен администрацией коалиции MANNHAXORS
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isReadOnly) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white flex items-center justify-center gap-4 py-2 px-4">
        <span className="text-xs font-mono uppercase tracking-widest font-bold select-none">
          ⚠ РЕЖИМ АДМИН-ПРОСМОТРА (READ-ONLY) — ИЗМЕНЕНИЯ ЗАБЛОКИРОВАНЫ
        </span>
        <button
          onClick={exitPreview}
          className="shrink-0 text-xs font-mono bg-white/20 hover:bg-white/30 px-3 py-1 rounded border border-white/30 transition-colors"
        >
          Выйти из Preview
        </button>
      </div>
    );
  }

  return null;
}
