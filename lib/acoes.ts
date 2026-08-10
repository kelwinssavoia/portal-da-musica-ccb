import "server-only";

import { updateTag } from "next/cache";
import { z } from "zod";

import { exigirArea } from "@/lib/permissoes";
import { clienteServidor } from "@/lib/supabase/servidor";
import type { PortalArea } from "@/lib/tipos-banco";

/** Resultado padrão de toda Server Action do CMS. */
export type Resultado = { ok: true; aviso?: string } | { ok: false; erro: string };

/** Tags de cache afetadas por cada área. */
const TAGS: Record<PortalArea, string[]> = {
  congregacoes: ["congregacoes", "eventos"],
  eventos: ["eventos"],
  circulares: ["circulares"],
  arquivos: ["arquivos"],
  duvidas: ["duvidas"],
  ajustes: ["ajustes"],
  usuarios: [],
};

/**
 * Invalida o cache do portal público depois de uma edição.
 *
 * `updateTag` e não `revalidateTag`: quem acabou de salvar precisa ver a
 * mudança na hora. O `revalidateTag` marca como obsoleto e serve o conteúdo
 * velho enquanto busca o novo em segundo plano — num CMS isso viraria "salvei e
 * não mudou nada".
 */
export function invalidar(area: PortalArea) {
  for (const tag of TAGS[area]) updateTag(tag);
}

/**
 * Envelope de toda Server Action do CMS:
 *
 * 1. confere a permissão de área (a RLS confere de novo no banco);
 * 2. valida o formulário com Zod;
 * 3. roda a operação;
 * 4. invalida o cache das telas públicas.
 *
 * Erro nunca sobe como exceção crua para a tela: volta como texto em português.
 */
export async function acao<Esquema extends z.ZodType>(
  area: PortalArea,
  esquema: Esquema,
  dados: FormData,
  operacao: (
    valores: z.output<Esquema>,
    supabase: Awaited<ReturnType<typeof clienteServidor>>,
  ) => Promise<void | string>,
): Promise<Resultado> {
  await exigirArea(area);

  const analise = esquema.safeParse(Object.fromEntries(dados));
  if (!analise.success) {
    const primeiro = analise.error.issues[0];
    const campo = primeiro?.path.join(".");
    return { ok: false, erro: campo ? `${campo}: ${primeiro.message}` : primeiro.message };
  }

  try {
    const supabase = await clienteServidor();
    const aviso = await operacao(analise.data, supabase);
    invalidar(area);
    return typeof aviso === "string" ? { ok: true, aviso } : { ok: true };
  } catch (e) {
    console.error(`[cms] falha em ${area}:`, e);
    return { ok: false, erro: mensagemDeErro(e) };
  }
}

/** Traduz os erros do Postgres que o usuário do CMS pode causar. */
function mensagemDeErro(e: unknown): string {
  const bruto = e instanceof Error ? e.message : String(e);

  if (/duplicate key|already exists|unique/i.test(bruto)) {
    return "Já existe um registro com esse identificador. Use outro.";
  }
  if (/violates row-level security|permission denied/i.test(bruto)) {
    return "Você não tem permissão para essa alteração.";
  }
  if (/violates foreign key/i.test(bruto)) {
    return "Esse registro está ligado a outro e não pode ser alterado assim.";
  }
  if (/violates check constraint/i.test(bruto)) {
    return "Algum valor está fora do permitido. Revise os campos.";
  }
  return "Não foi possível salvar. Tente de novo; se persistir, avise o responsável pelo portal.";
}

// ---------------------------------------------------------------------------
// Peças de esquema reaproveitadas
// ---------------------------------------------------------------------------

/** Texto obrigatório, já aparado. */
export const textoObrigatorio = (rotulo: string) =>
  z
    .string()
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, { message: `${rotulo} é obrigatório` });

/** Texto opcional: vazio virá como `null`, não como string vazia. */
export const textoOpcional = z
  .string()
  .optional()
  .transform((s) => {
    const v = (s ?? "").trim();
    return v === "" ? null : v;
  });

/** Checkbox HTML: presente = marcado. */
export const marcado = z
  .union([z.literal("sim"), z.undefined(), z.literal("")])
  .transform((v) => v === "sim");

/** Número opcional vindo de `<select>`/`<input>`: vazio = null. */
export const numeroOpcional = z
  .string()
  .optional()
  .transform((s) => {
    const v = (s ?? "").trim();
    if (v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  });

/** Hora `HH:MM` do input time → `HH:MM:SS` do Postgres. Vazio = null. */
export const horaOpcional = z
  .string()
  .optional()
  .transform((s) => {
    const v = (s ?? "").trim();
    return v === "" ? null : v.length === 5 ? `${v}:00` : v;
  });

/** Data ISO obrigatória, do input date. */
export const dataObrigatoria = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "informe uma data válida" });

export const dataOpcional = z
  .string()
  .optional()
  .transform((s) => {
    const v = (s ?? "").trim();
    return v === "" ? null : v;
  })
  .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), {
    message: "informe uma data válida",
  });

export const inteiro = z
  .string()
  .optional()
  .transform((s) => {
    const n = Number((s ?? "").trim());
    return Number.isFinite(n) ? Math.trunc(n) : 0;
  });

/** Identificador de URL: minúsculas, sem acento, com hífen. */
export function paraSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
