"use client";

import { useProgression } from "@/lib/progression";
import {
  EyeOpenIcon,
  EyeClosedIcon,
  CircleBackslashIcon,
} from "@radix-ui/react-icons";

export function GlobalOverlays() {
  const { isReadOnly, previewUser, isBanned, exitPreview } = useProgression();

  if (isBanned) {
    return (
      <div className="fixed inset-0 z-[200] bg-zinc-950 flex flex-col items-center justify-center text-center p-6 select-none">
        <div className="w-16 h-16 rounded-full bg-red-950/50 border border-red-800 flex items-center justify-center mb-6">
          <CircleBackslashIcon className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-red-700 font-mono text-[10px] uppercase tracking-[0.3em] mb-4">
          MANNHAXORS v1.0 // ACCESS DENIED
        </p>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
          Доступ заблокирован
        </h1>
        <p className="text-zinc-400 text-sm max-w-sm leading-relaxed">
          Ваш аккаунт забанен администрацией коалиции MANNHAXORS.
        </p>
      </div>
    );
  }

  if (isReadOnly && previewUser) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-black py-2 px-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <EyeOpenIcon className="w-4 h-4 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider font-mono">
            РЕЖИМ АДМИН-ПРОСМОТРА (READ-ONLY) — ИЗМЕНЕНИЯ ЗАБЛОКИРОВАНЫ
          </span>
          <span className="text-xs font-mono ml-2 opacity-75">
            Просмотр: {previewUser.name}
          </span>
        </div>
        <button
          onClick={exitPreview}
          className="flex items-center gap-1.5 text-xs font-bold uppercase bg-black/20 hover:bg-black/30 transition-colors px-3 py-1 rounded font-mono shrink-0 ml-4"
        >
          <EyeClosedIcon className="w-3.5 h-3.5" />
          Выйти из Preview
        </button>
      </div>
    );
  }

  return null;
}
