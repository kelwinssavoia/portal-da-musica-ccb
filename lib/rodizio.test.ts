import { describe, expect, it } from "vitest";

import {
  contarPorOrganista,
  cultosDoPeriodo,
  diaDaSemana,
  gerarEscala,
  linhasComRestricao,
  periodoValido,
  podeTocar,
  sorteioComSemente,
  type Participante,
} from "@/lib/rodizio";

function organista(chave: string, over: Partial<Participante> = {}): Participante {
  return { chave, dowsIndisponiveis: [], datasIndisponiveis: [], ...over };
}

/** Domingo 18h30 e quarta 19h30 — o caso mais comum. */
const CULTOS = [
  { dow: 0, hora: "18:30:00" },
  { dow: 3, hora: "19:30:00" },
];

function valores(m: Map<string, number>) {
  return [...m.values()];
}

describe("datas do período", () => {
  it("gera um culto por dia de culto, em ordem", () => {
    // Novembro/2026 começa num domingo.
    expect(diaDaSemana("2026-11-01")).toBe(0);
    const cultos = cultosDoPeriodo(CULTOS, "2026-11-01", "2026-11-15");
    expect(cultos.map((c) => c.data)).toEqual([
      "2026-11-01",
      "2026-11-04",
      "2026-11-08",
      "2026-11-11",
      "2026-11-15",
    ]);
    expect(cultos[1]).toEqual({ data: "2026-11-04", dow: 3, hora: "19:30:00" });
  });

  it("atravessa a virada do ano", () => {
    const cultos = cultosDoPeriodo([{ dow: 0, hora: null }], "2026-12-25", "2027-01-05");
    expect(cultos.map((c) => c.data)).toEqual(["2026-12-27", "2027-01-03"]);
  });

  it("recusa período invertido ou longo demais", () => {
    expect(periodoValido("2026-11-10", "2026-11-01")).toBe(false);
    expect(periodoValido("2026-01-01", "2027-06-01")).toBe(false);
    expect(periodoValido("2026-11-01", "2026-11-01")).toBe(true);
    expect(cultosDoPeriodo(CULTOS, "2026-11-10", "2026-11-01")).toEqual([]);
  });
});

describe("geração da escala", () => {
  const novembro = cultosDoPeriodo(CULTOS, "2026-11-01", "2026-11-30"); // 9 cultos

  it("distribui igualmente quando a conta fecha", () => {
    const cultos = cultosDoPeriodo(CULTOS, "2026-11-01", "2026-11-28"); // 8 cultos
    const ps = ["a", "b", "c", "d"].map((k) => organista(k));
    for (let semente = 1; semente <= 20; semente++) {
      const linhas = gerarEscala(cultos, ps, {}, sorteioComSemente(semente));
      expect(valores(contarPorOrganista(linhas, ps))).toEqual([2, 2, 2, 2]);
    }
  });

  it("diferença máxima de 1 quando a conta não fecha", () => {
    const ps = ["a", "b", "c", "d"].map((k) => organista(k));
    for (let semente = 1; semente <= 20; semente++) {
      const linhas = gerarEscala(novembro, ps, {}, sorteioComSemente(semente));
      const n = valores(contarPorOrganista(linhas, ps));
      expect(Math.max(...n) - Math.min(...n)).toBeLessThanOrEqual(1);
      expect(n.reduce((a, b) => a + b, 0)).toBe(9);
    }
  });

  it("respeita dia da semana e data indisponíveis", () => {
    const ps = [
      organista("a", { dowsIndisponiveis: [3] }), // não toca às quartas
      organista("b", { datasIndisponiveis: ["2026-11-08", "2026-11-15"] }),
      organista("c"),
    ];
    for (let semente = 1; semente <= 20; semente++) {
      const linhas = gerarEscala(novembro, ps, {}, sorteioComSemente(semente));
      expect(linhasComRestricao(linhas, ps).size).toBe(0);
      for (const l of linhas) {
        expect(l.organista).not.toBeNull();
        expect(podeTocar(ps.find((p) => p.chave === l.organista)!, l)).toBe(true);
      }
      const n = valores(contarPorOrganista(linhas, ps));
      expect(Math.max(...n) - Math.min(...n)).toBeLessThanOrEqual(1);
    }
  });

  it("equilibra mesmo quando é preciso uma cadeia de trocas", () => {
    // Domingos só "a" e "b"; quartas só "b" e "c". Para ficar 3/3/3, "b"
    // precisa ceder domingos para "a" e quartas para "c" ao mesmo tempo.
    const ps = [
      organista("a", { dowsIndisponiveis: [3] }),
      organista("b"),
      organista("c", { dowsIndisponiveis: [0] }),
    ];
    // 5 domingos + 4 quartas = 9.
    for (let semente = 1; semente <= 30; semente++) {
      const linhas = gerarEscala(novembro, ps, {}, sorteioComSemente(semente));
      expect(valores(contarPorOrganista(linhas, ps))).toEqual([3, 3, 3]);
    }
  });

  it("fica o mais igual possível quando a restrição impede a igualdade", () => {
    // "c" só pode quartas (4 no mês). As outras dividem os 5 domingos.
    const ps = [organista("a"), organista("b"), organista("c", { dowsIndisponiveis: [0] })];
    const linhas = gerarEscala(novembro, ps, {}, sorteioComSemente(7));
    const n = contarPorOrganista(linhas, ps);
    expect(n.get("a")! + n.get("b")! + n.get("c")!).toBe(9);
    expect(n.get("c")).toBe(3);
  });

  it("mantém as datas fixadas e conta elas no total", () => {
    const ps = ["a", "b", "c"].map((k) => organista(k));
    const fixos = { "2026-11-01": "a", "2026-11-04": "a", "2026-11-08": "a" };
    for (let semente = 1; semente <= 10; semente++) {
      const linhas = gerarEscala(novembro, ps, fixos, sorteioComSemente(semente));
      for (const [data, chave] of Object.entries(fixos)) {
        const l = linhas.find((x) => x.data === data)!;
        expect(l.organista).toBe(chave);
        expect(l.fixo).toBe(true);
      }
      // 9 cultos, 3 cada: "a" já tem os 3 fixos e não toca mais.
      expect(valores(contarPorOrganista(linhas, ps))).toEqual([3, 3, 3]);
    }
  });

  it("ignora fixação de quem não participa", () => {
    const ps = [organista("a"), organista("b")];
    const linhas = gerarEscala(novembro, ps, { "2026-11-01": "x" }, sorteioComSemente(1));
    expect(linhas[0].fixo).toBe(false);
    expect(["a", "b"]).toContain(linhas[0].organista);
  });

  it("deixa vago o culto em que ninguém pode", () => {
    const ps = [organista("a", { dowsIndisponiveis: [3] })];
    const linhas = gerarEscala(novembro, ps, {}, sorteioComSemente(1));
    for (const l of linhas) expect(l.organista).toBe(l.dow === 3 ? null : "a");
  });

  it("evita a mesma irmã em cultos seguidos quando dá", () => {
    // 4 organistas, 8 cultos: há solução sem ninguém tocar duas vezes na mesma semana.
    const cultos = cultosDoPeriodo(CULTOS, "2026-11-01", "2026-11-28");
    const ps = ["a", "b", "c", "d"].map((k) => organista(k));
    for (let semente = 1; semente <= 10; semente++) {
      const linhas = gerarEscala(cultos, ps, {}, sorteioComSemente(semente));
      for (let i = 1; i < linhas.length; i++) {
        expect(linhas[i].organista).not.toBe(linhas[i - 1].organista);
      }
    }
  });

  it("sem organistas, tudo vago", () => {
    expect(gerarEscala(novembro, []).every((l) => l.organista === null)).toBe(true);
  });
});
