"use client";

import { useSearchParams } from "next/navigation";

import { CampoBuscaBase } from "@/components/site/campo-busca-base";

/** Versão hidratada: preenche o campo com o termo que está na URL. */
export function CampoBuscaComTermo() {
  return <CampoBuscaBase valor={useSearchParams().get("q") ?? ""} />;
}
