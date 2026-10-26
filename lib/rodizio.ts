/**
 * Rodízio de organistas — funções puras.
 *
 * O rodízio distribui os cultos de um período entre as organistas da comum de
 * forma **igualitária**: todas tocam o mesmo número de vezes, ou no máximo uma
 * vez a mais que as outras quando a conta não fecha. Restrições (dias da semana
 * ou datas em que a irmã não pode) e datas fixadas à mão antes do sorteio são
 * respeitadas; quando a restrição torna a igualdade impossível, a distribuição
 * fica a mais equilibrada que as restrições deixam.
 *
 * Nada aqui toca banco ou navegador: o editor do CMS gera no próprio aparelho e
 * os testes conferem com um sorteio de semente fixa.
 */

/** Culto oficial da comum, como está no cadastro: um por dia da semana. */
export type CultoSemanal = { dow: number; hora: string | null };

/** Um culto concreto dentro do período. */
export type CultoDoPeriodo = { data: string; dow: number; hora: string | null };

export type Participante = {
  /** id da organista, ou um identificador provisório para quem é nova. */
  chave: string;
  dowsIndisponiveis: number[];
  datasIndisponiveis: string[];
};

/** Uma linha da escala: o culto e quem toca. */
export type LinhaEscala = CultoDoPeriodo & {
  organista: string | null;
  /** Definida à mão; gerar de novo não mexe. */
  fixo: boolean;
};

/** Maior período aceito, igual ao limite do banco. */
export const DIAS_MAXIMOS = 366;

// ---------------------------------------------------------------------------
// Datas
// ---------------------------------------------------------------------------

function paraData(iso: string): Date {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d));
}

function paraIso(data: Date): string {
  return data.toISOString().slice(0, 10);
}

/** Dia da semana de uma data ISO. 0 = domingo. */
export function diaDaSemana(iso: string): number {
  return paraData(iso).getUTCDay();
}

/** Dias corridos entre duas datas ISO. */
export function diasEntre(de: string, ate: string): number {
  return Math.round((paraData(ate).getTime() - paraData(de).getTime()) / 86_400_000);
}

/** Período válido: datas no formato certo, fim depois do início, até um ano. */
export function periodoValido(inicio: string, fim: string): boolean {
  const formato = /^\d{4}-\d{2}-\d{2}$/;
  if (!formato.test(inicio) || !formato.test(fim)) return false;
  const dias = diasEntre(inicio, fim);
  return dias >= 0 && dias <= DIAS_MAXIMOS;
}

/** Todos os cultos do período, em ordem, a partir dos cultos semanais da comum. */
export function cultosDoPeriodo(
  cultos: CultoSemanal[],
  inicio: string,
  fim: string,
): CultoDoPeriodo[] {
  if (!periodoValido(inicio, fim) || cultos.length === 0) return [];

  const porDia = new Map(cultos.map((c) => [c.dow, c.hora]));
  const saida: CultoDoPeriodo[] = [];
  const dia = paraData(inicio);
  const ultimo = paraData(fim).getTime();

  while (dia.getTime() <= ultimo) {
    const dow = dia.getUTCDay();
    if (porDia.has(dow)) saida.push({ data: paraIso(dia), dow, hora: porDia.get(dow) ?? null });
    dia.setUTCDate(dia.getUTCDate() + 1);
  }
  return saida;
}

// ---------------------------------------------------------------------------
// Restrições e contagem
// ---------------------------------------------------------------------------

export function podeTocar(p: Participante, culto: CultoDoPeriodo): boolean {
  return !p.dowsIndisponiveis.includes(culto.dow) && !p.datasIndisponiveis.includes(culto.data);
}

/** Quantas vezes cada organista toca. Quem não toca nenhuma aparece com 0. */
export function contarPorOrganista(
  linhas: LinhaEscala[],
  participantes: Participante[],
): Map<string, number> {
  const contagem = new Map(participantes.map((p) => [p.chave, 0]));
  for (const l of linhas) {
    if (l.organista !== null && contagem.has(l.organista)) {
      contagem.set(l.organista, contagem.get(l.organista)! + 1);
    }
  }
  return contagem;
}

/** Linhas cuja organista tem restrição naquela data (só acontece em edição à mão). */
export function linhasComRestricao(
  linhas: LinhaEscala[],
  participantes: Participante[],
): Set<string> {
  const porChave = new Map(participantes.map((p) => [p.chave, p]));
  const datas = new Set<string>();
  for (const l of linhas) {
    const p = l.organista ? porChave.get(l.organista) : undefined;
    if (p && !podeTocar(p, l)) datas.add(l.data);
  }
  return datas;
}

// ---------------------------------------------------------------------------
// Geração
// ---------------------------------------------------------------------------

/** Sorteio com semente, para os testes serem repetíveis. */
export function sorteioComSemente(semente: number): () => number {
  let s = semente >>> 0;
  return () => {
    // mulberry32
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function embaralhar<T>(itens: T[], aleatorio: () => number): T[] {
  const copia = [...itens];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/**
 * Gera a escala do período.
 *
 * 1. Datas fixadas entram primeiro e contam para o total de quem foi fixada.
 * 2. As demais são preenchidas da mais restrita (menos organistas podem) para a
 *    menos restrita, sempre com quem tocou menos até ali; empate é sorteado.
 * 3. **Equilíbrio:** enquanto alguém tocar 2 ou mais vezes que outra, procura
 *    uma cadeia de trocas que passe um culto de quem tem mais para quem tem
 *    menos sem violar restrição (caminho aumentante). Isso chega à divisão
 *    mais igual possível, mesmo quando uma troca direta não resolve.
 * 4. **Espaçamento:** troca pares de datas entre organistas para evitar que a
 *    mesma irmã toque em cultos seguidos. Não muda quantas vezes cada uma toca.
 *
 * Culto sem nenhuma organista disponível fica vago (`organista: null`).
 */
export function gerarEscala(
  cultos: CultoDoPeriodo[],
  participantes: Participante[],
  fixos: Record<string, string> = {},
  aleatorio: () => number = Math.random,
): LinhaEscala[] {
  const chaves = new Set(participantes.map((p) => p.chave));
  const linhas: LinhaEscala[] = cultos.map((c) => {
    const fixa = fixos[c.data];
    return fixa && chaves.has(fixa)
      ? { ...c, organista: fixa, fixo: true }
      : { ...c, organista: null, fixo: false };
  });

  const candidatas = linhas.map((l) =>
    l.fixo ? [] : participantes.filter((p) => podeTocar(p, l)).map((p) => p.chave),
  );

  const contagem = contarPorOrganista(linhas, participantes);

  // 2. Mais restrita primeiro; o embaralhar antes torna o desempate aleatório.
  const abertas = embaralhar(
    linhas.map((_, i) => i).filter((i) => !linhas[i].fixo),
    aleatorio,
  ).sort((a, b) => candidatas[a].length - candidatas[b].length);

  for (const i of abertas) {
    const opcoes = candidatas[i];
    if (opcoes.length === 0) continue;
    const menor = Math.min(...opcoes.map((k) => contagem.get(k)!));
    const empatadas = opcoes.filter((k) => contagem.get(k) === menor);
    const escolhida = empatadas[Math.floor(aleatorio() * empatadas.length)];
    linhas[i].organista = escolhida;
    contagem.set(escolhida, menor + 1);
  }

  equilibrar(linhas, candidatas, contagem);
  espacar(linhas, candidatas, aleatorio);

  return linhas;
}

/** Passo 3 de `gerarEscala`. Altera `linhas` e `contagem`. */
function equilibrar(
  linhas: LinhaEscala[],
  candidatas: string[][],
  contagem: Map<string, number>,
) {
  // Cada volta reduz a soma dos quadrados das contagens, então termina.
  for (;;) {
    const ordem = [...contagem.keys()].sort((a, b) => contagem.get(b)! - contagem.get(a)!);
    let melhorou = false;

    for (const origem of ordem) {
      const teto = contagem.get(origem)! - 2;
      if (teto < 0) break;

      // BFS: de quem toca demais, passando culto adiante, até quem toca de menos.
      const anterior = new Map<string, { de: string; linha: number }>();
      const visitadas = new Set([origem]);
      const fila = [origem];
      let destino: string | null = null;

      while (fila.length > 0 && destino === null) {
        const atual = fila.shift()!;
        for (let i = 0; i < linhas.length && destino === null; i++) {
          if (linhas[i].fixo || linhas[i].organista !== atual) continue;
          for (const outra of candidatas[i]) {
            if (visitadas.has(outra)) continue;
            visitadas.add(outra);
            anterior.set(outra, { de: atual, linha: i });
            if (contagem.get(outra)! <= teto) {
              destino = outra;
              break;
            }
            fila.push(outra);
          }
        }
      }

      if (destino === null) continue;

      let passo: string = destino;
      while (passo !== origem) {
        const { de, linha } = anterior.get(passo)!;
        linhas[linha].organista = passo;
        passo = de;
      }
      contagem.set(origem, contagem.get(origem)! - 1);
      contagem.set(destino, contagem.get(destino)! + 1);
      melhorou = true;
      break;
    }

    if (!melhorou) return;
  }
}

/**
 * Penalidade de proximidade: tocar em cultos com poucos dias de intervalo pesa
 * muito; com uma semana ou mais, quase nada.
 */
function penalidade(linhas: LinhaEscala[]): number {
  const ultima = new Map<string, string>();
  let total = 0;
  for (const l of linhas) {
    if (l.organista === null) continue;
    const antes = ultima.get(l.organista);
    if (antes) {
      const dias = Math.max(diasEntre(antes, l.data), 0.5);
      total += 1 / (dias * dias);
    }
    ultima.set(l.organista, l.data);
  }
  return total;
}

/** Passo 4 de `gerarEscala`. Só troca datas entre duas organistas: totais não mudam. */
function espacar(linhas: LinhaEscala[], candidatas: string[][], aleatorio: () => number) {
  const abertas = linhas.map((_, i) => i).filter((i) => !linhas[i].fixo && linhas[i].organista);
  if (abertas.length < 2) return;

  let atual = penalidade(linhas);
  const tentativas = Math.min(abertas.length * abertas.length * 4, 40_000);

  for (let t = 0; t < tentativas; t++) {
    const i = abertas[Math.floor(aleatorio() * abertas.length)];
    const j = abertas[Math.floor(aleatorio() * abertas.length)];
    const a = linhas[i].organista!;
    const b = linhas[j].organista!;
    if (a === b || !candidatas[i].includes(b) || !candidatas[j].includes(a)) continue;

    linhas[i].organista = b;
    linhas[j].organista = a;
    const nova = penalidade(linhas);
    if (nova < atual) {
      atual = nova;
    } else {
      linhas[i].organista = a;
      linhas[j].organista = b;
    }
  }
}
