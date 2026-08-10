import type { Destaque } from "@/lib/destaque";
import { seloDestaque } from "@/lib/destaque";

/** Selo "Hoje" / "Amanhã". Não renderiza nada quando não há destaque. */
export function Selo({ destaque }: { destaque: Destaque }) {
  const selo = seloDestaque(destaque);
  if (!selo) return null;

  return (
    <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${selo.classe}`}>
      {selo.texto}
    </span>
  );
}

/** Bolinha da cor do tipo de evento. */
export function Bolinha({ cor }: { cor: string }) {
  return (
    <span
      aria-hidden="true"
      className="mt-1.5 size-2 shrink-0 rounded-full"
      style={{ backgroundColor: cor }}
    />
  );
}
