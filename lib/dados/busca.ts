import {
  agruparPorArea,
  pontuarCampos,
  primeiraDeCada,
  termosDe,
  type AreaBusca,
  type GrupoBusca,
  type Resultado,
} from "@/lib/busca";
import { listarCirculares } from "@/lib/dados/circulares";
import { eventosDoPeriodo, listarTiposEvento, TIPO_ENSAIO_LOCAL } from "@/lib/dados/eventos";
import { listarCongregacoes } from "@/lib/dados/congregacoes";
import { nomeDaCidade } from "@/lib/cidades";
import { listarCategorias, listarDuvidas } from "@/lib/dados/secretaria";
import { cultosEmTexto, dataLonga, formatarHora, padraoEnsaio } from "@/lib/datas";
import { partesISO } from "@/lib/ensaios";

/**
 * Busca em todas as áreas do portal.
 *
 * A filtragem acontece em memória, sobre os dados já cacheados por tag. O
 * conteúdo de uma regional é pequeno — algumas dezenas de comuns, arquivos e
 * eventos — então não vale a complexidade de índice de texto no Postgres, e de
 * quebra a regra de relevância fica testável como função pura.
 */
export async function buscar(consulta: string, hoje: string): Promise<GrupoBusca[]> {
  const termos = termosDe(consulta);
  if (termos.length === 0) return [];

  const { ano } = partesISO(hoje);

  const [congregacoes, categorias, duvidas, circulares, eventos, tipos] = await Promise.all([
    listarCongregacoes(),
    listarCategorias(),
    listarDuvidas(),
    listarCirculares(),
    // Busca no calendário cobre de hoje até o fim do ano que vem.
    eventosDoPeriodo(hoje, `${ano + 1}-12-31`),
    listarTiposEvento(),
  ]);

  const resultados: Resultado[] = [];

  const juntar = (
    area: AreaBusca,
    campos: string[],
    titulo: string,
    sub: string,
    href: string,
  ) => {
    const pontos = pontuarCampos(campos, termos);
    if (pontos > 0) resultados.push({ area, titulo, sub, href, pontos });
  };

  // Próxima data de ensaio de cada comum, para enriquecer o resultado.
  const proximoPorComum = new Map<string, string>();
  for (const e of eventos) {
    if (e.tipoId !== TIPO_ENSAIO_LOCAL || !e.congregacaoId) continue;
    if (!proximoPorComum.has(e.congregacaoId)) proximoPorComum.set(e.congregacaoId, e.data);
  }

  for (const c of congregacoes) {
    const cidade = c.cidade ? nomeDaCidade(c.cidade) : "";

    juntar(
      "Congregações",
      // A cidade entra no texto buscável: procurar por "Bragança" precisa
      // trazer todas as comuns de lá.
      [c.nome, c.endereco, cidade, c.observacoes ?? ""],
      c.nome,
      [cidade, c.endereco].filter(Boolean).join(" · "),
      `/congregacoes/${c.slug}`,
    );

    // O padrão de ensaio da comum também é conteúdo buscável: "3º domingo".
    const padrao = padraoEnsaio(c.ensaio_ord, c.ensaio_dow, c.ensaio_hora);
    if (padrao) {
      const proxima = proximoPorComum.get(c.id);
      juntar(
        "Ensaios",
        [`Ensaio local ${c.nome}`, padrao],
        `Ensaio local — ${c.nome}`,
        proxima ? `${padrao} · próximo em ${dataLonga(proxima)}` : padrao,
        "/ensaios",
      );
    }

    const culto = cultosEmTexto(c.cultos);
    if (culto) {
      juntar(
        "Congregações",
        [`Cultos ${c.nome}`, culto],
        `Cultos oficiais — ${c.nome}`,
        culto,
        `/congregacoes/${c.slug}`,
      );
    }
  }

  const labelDoTipo = new Map(tipos.map((t) => [t.id, t.label]));

  // Ensaio local fica de fora do Calendário na busca: a área Ensaios já o
  // cobre, com informação melhor (o padrão e a próxima data). Sem isso, cada
  // comum apareceria duas vezes com o mesmo título.
  //
  // Dos que sobram, mantém só a próxima ocorrência de cada tipo + local — um
  // ensaio regional mensal geraria uma dezena de resultados idênticos. Os
  // eventos já vêm ordenados por data, então a primeira é a mais próxima.
  const eventosUnicos = primeiraDeCada(
    eventos.filter((e) => e.tipoId !== TIPO_ENSAIO_LOCAL),
    (e) => `${e.tipoId}|${e.congregacaoId ?? ""}`,
  );

  for (const e of eventosUnicos) {
    const label = labelDoTipo.get(e.tipoId) ?? e.titulo;
    const local = e.congregacaoNome ?? "";
    const quando = `${dataLonga(e.data)}${e.hora ? ` · ${formatarHora(e.hora)}` : ""}`;
    const mes = e.data.slice(0, 7);

    juntar(
      "Calendário",
      [`${label} ${local}`, e.descricao ?? "", quando],
      local ? `${label} — ${local}` : label,
      quando,
      `/calendario?mes=${mes}&modo=agenda`,
    );
  }

  for (const c of circulares) {
    juntar(
      "Circulares",
      [c.titulo, c.numero, c.resumo ?? ""],
      c.titulo,
      `${c.numero} · ${dataLonga(c.data)}`,
      "/circulares",
    );
  }

  for (const cat of categorias) {
    for (const a of cat.arquivos) {
      juntar(
        "Secretaria",
        [a.titulo, a.descricao ?? "", cat.nome, a.prazo ?? ""],
        a.titulo,
        [cat.nome, a.descricao].filter(Boolean).join(" · "),
        "/secretaria",
      );
    }
  }

  for (const d of duvidas) {
    juntar("Dúvidas", [d.pergunta, d.resposta], d.pergunta, d.resposta, "/secretaria");
  }

  return agruparPorArea(resultados);
}
