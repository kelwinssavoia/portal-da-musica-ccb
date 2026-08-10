import Image from "next/image";

import { IconeIgreja } from "@/components/icones";
import { urlPublica } from "@/lib/storage";

/** Foto da comum. Sem foto cadastrada, mostra um marcador neutro. */
export function FotoCongregacao({
  caminho,
  nome,
  className = "aspect-[16/9]",
  sizes = "(max-width: 640px) 100vw, 340px",
}: {
  caminho: string | null;
  nome: string;
  className?: string;
  sizes?: string;
}) {
  if (!caminho) {
    return (
      <div className={`bg-cinza grid place-items-center ${className}`}>
        <IconeIgreja className="text-azul size-9 opacity-40" />
        <span className="sr-only">Sem foto cadastrada</span>
      </div>
    );
  }

  return (
    <div className={`bg-cinza relative overflow-hidden ${className}`}>
      <Image
        src={urlPublica("congregacoes", caminho)}
        alt={`Fachada da congregação ${nome}`}
        fill
        sizes={sizes}
        className="object-cover"
      />
    </div>
  );
}
