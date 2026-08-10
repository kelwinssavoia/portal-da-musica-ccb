import { describe, expect, it } from "vitest";

import {
  datasDoPadrao,
  diaDoPadrao,
  diasNoMes,
  gerarEnsaios,
  mesesEntre,
  nthDia,
  ordenarEventos,
  proximoEnsaio,
  ultimoDia,
  type Excecao,
  type PadraoEnsaio,
} from "@/lib/ensaios";

/** Comum de teste. dow: 0=Dom … 6=Sáb. */
function comum(over: Partial<PadraoEnsaio> = {}): PadraoEnsaio {
  return {
    id: "c1",
    nome: "Centro",
    slug: "centro",
    ensaio_ord: 1,
    ensaio_dow: 5, // sexta
    ensaio_hora: "19:30:00",
    ensaio_meses: null,
    ...over,
  };
}

describe("calendário básico", () => {
  it("conta os dias do mês, inclusive fevereiro bissexto", () => {
    expect(diasNoMes(2026, 1)).toBe(31);
    expect(diasNoMes(2026, 2)).toBe(28);
    expect(diasNoMes(2028, 2)).toBe(29); // bissexto
    expect(diasNoMes(2026, 4)).toBe(30);
  });

  it("acha a n-ésima ocorrência de um dia da semana", () => {
    // Agosto/2026 começa num sábado. Primeiro domingo = dia 2.
    expect(nthDia(2026, 8, 0, 1)).toBe(2);
    expect(nthDia(2026, 8, 0, 2)).toBe(9);
    expect(nthDia(2026, 8, 0, 3)).toBe(16);
    expect(nthDia(2026, 8, 0, 4)).toBe(23);
  });

  it("devolve null quando a ocorrência não existe no mês", () => {
    // Fevereiro/2026 começa num domingo: tem 4 domingos (1,8,15,22), não 5.
    expect(nthDia(2026, 2, 0, 4)).toBe(22);
    expect(nthDia(2026, 2, 0, 5)).toBeNull();
  });

  it("acha o último dia da semana do mês", () => {
    // Agosto/2026 tem 31 dias e começa no sábado: domingos 2,9,16,23,30.
    expect(ultimoDia(2026, 8, 0)).toBe(30);
    // Último sábado de agosto/2026 = dia 29.
    expect(ultimoDia(2026, 8, 6)).toBe(29);
  });

  it("trata ordinal 5 como 'último'", () => {
    expect(diaDoPadrao(2026, 2, 5, 0)).toBe(22); // último domingo de fev/2026
    expect(diaDoPadrao(2026, 2, 4, 0)).toBe(22); // que também é o 4º
    expect(diaDoPadrao(2026, 8, 5, 0)).toBe(30);
  });

  it("lista os meses do intervalo atravessando a virada do ano", () => {
    expect(mesesEntre("2026-11-15", "2027-02-03")).toEqual([
      { ano: 2026, mes: 11 },
      { ano: 2026, mes: 12 },
      { ano: 2027, mes: 1 },
      { ano: 2027, mes: 2 },
    ]);
  });
});

describe("datas do padrão", () => {
  it("gera uma data por mês para ensaio mensal", () => {
    // 1ª sexta de cada mês do 2º semestre de 2026.
    const datas = datasDoPadrao(comum(), "2026-07-01", "2026-12-31");
    expect(datas).toEqual([
      "2026-07-03",
      "2026-08-07",
      "2026-09-04",
      "2026-10-02",
      "2026-11-06",
      "2026-12-04",
    ]);
  });

  it("respeita a lista de meses de um ensaio trimestral", () => {
    const trimestral = comum({ ensaio_ord: 4, ensaio_dow: 4, ensaio_meses: [3, 6, 9, 12] });
    const datas = datasDoPadrao(trimestral, "2026-01-01", "2026-12-31");
    // 4ª quinta de março, junho, setembro e dezembro de 2026.
    expect(datas).toEqual(["2026-03-26", "2026-06-25", "2026-09-24", "2026-12-24"]);
  });

  it("não gera nada sem padrão cadastrado", () => {
    const sem = comum({ ensaio_ord: null, ensaio_dow: null });
    expect(datasDoPadrao(sem, "2026-01-01", "2026-12-31")).toEqual([]);
  });

  it("respeita os limites do intervalo", () => {
    // 1ª sexta de agosto/2026 é dia 7; pedindo de 08 em diante, não entra.
    expect(datasDoPadrao(comum(), "2026-08-08", "2026-08-31")).toEqual([]);
    expect(datasDoPadrao(comum(), "2026-08-07", "2026-08-07")).toEqual(["2026-08-07"]);
  });

  it("pula o mês sem a ocorrência pedida", () => {
    // 5ª sexta só existe em alguns meses. Jan/2026 começa numa quinta:
    // sextas 2,9,16,23,30 -> tem 5ª. Fev/2026 não tem.
    const quinta = comum({ ensaio_ord: 5, ensaio_dow: 5 });
    const datas = datasDoPadrao(quinta, "2026-01-01", "2026-02-28");
    // Com ordinal 5 = "último", fevereiro entra com a última sexta (27).
    expect(datas).toEqual(["2026-01-30", "2026-02-27"]);
  });
});

describe("gerarEnsaios com exceções", () => {
  const padrao = comum();

  it("gera evento com id estável e dados da comum", () => {
    const [ev] = gerarEnsaios([padrao], [], "2026-08-01", "2026-08-31");
    expect(ev).toMatchObject({
      id: "ensaio:c1:2026-08-07",
      tipoId: "local",
      data: "2026-08-07",
      hora: "19:30:00",
      congregacaoNome: "Centro",
      congregacaoSlug: "centro",
      gerado: true,
    });
  });

  it("remove o ensaio cancelado", () => {
    const excecoes: Excecao[] = [
      {
        congregacao_id: "c1",
        data_original: "2026-08-07",
        cancelado: true,
        nova_data: null,
        nova_hora: null,
        motivo: "Ensaio regional no mesmo dia",
      },
    ];
    expect(gerarEnsaios([padrao], excecoes, "2026-08-01", "2026-08-31")).toEqual([]);
  });

  it("remaneja data e hora", () => {
    const excecoes: Excecao[] = [
      {
        congregacao_id: "c1",
        data_original: "2026-08-07",
        cancelado: false,
        nova_data: "2026-08-14",
        nova_hora: "20:00:00",
        motivo: "Antecipado",
      },
    ];
    const [ev] = gerarEnsaios([padrao], excecoes, "2026-08-01", "2026-08-31");
    expect(ev.data).toBe("2026-08-14");
    expect(ev.hora).toBe("20:00:00");
    expect(ev.id).toBe("ensaio:c1:2026-08-07"); // id segue a data original
  });

  it("traz para dentro do mês um ensaio remanejado de fora", () => {
    // Ensaio de 4 de setembro puxado para 31 de agosto.
    const excecoes: Excecao[] = [
      {
        congregacao_id: "c1",
        data_original: "2026-09-04",
        cancelado: false,
        nova_data: "2026-08-31",
        nova_hora: null,
        motivo: null,
      },
    ];
    const agosto = gerarEnsaios([padrao], excecoes, "2026-08-01", "2026-08-31");
    expect(agosto.map((e) => e.data)).toEqual(["2026-08-07", "2026-08-31"]);
  });

  it("tira do mês um ensaio remanejado para fora", () => {
    const excecoes: Excecao[] = [
      {
        congregacao_id: "c1",
        data_original: "2026-08-07",
        cancelado: false,
        nova_data: "2026-09-11",
        nova_hora: null,
        motivo: null,
      },
    ];
    expect(gerarEnsaios([padrao], excecoes, "2026-08-01", "2026-08-31")).toEqual([]);
  });

  it("não aplica exceção de outra comum", () => {
    const excecoes: Excecao[] = [
      {
        congregacao_id: "OUTRA",
        data_original: "2026-08-07",
        cancelado: true,
        nova_data: null,
        nova_hora: null,
        motivo: null,
      },
    ];
    expect(gerarEnsaios([padrao], excecoes, "2026-08-01", "2026-08-31")).toHaveLength(1);
  });

  it("gera para várias comuns ao mesmo tempo", () => {
    const outra = comum({ id: "c2", nome: "Penha", slug: "penha", ensaio_ord: 3, ensaio_dow: 2 });
    const eventos = gerarEnsaios([padrao, outra], [], "2026-08-01", "2026-08-31");
    expect(eventos.map((e) => `${e.congregacaoSlug}:${e.data}`)).toEqual([
      "centro:2026-08-07",
      "penha:2026-08-18",
    ]);
  });
});

describe("proximoEnsaio", () => {
  it("acha o próximo a partir de hoje, inclusive hoje", () => {
    expect(proximoEnsaio(comum(), [], "2026-08-07")?.data).toBe("2026-08-07");
    expect(proximoEnsaio(comum(), [], "2026-08-08")?.data).toBe("2026-09-04");
  });

  it("atravessa a virada do ano", () => {
    expect(proximoEnsaio(comum(), [], "2026-12-05")?.data).toBe("2027-01-01");
  });

  it("acha o próximo de um ensaio trimestral", () => {
    const trimestral = comum({ ensaio_ord: 4, ensaio_dow: 4, ensaio_meses: [3, 6, 9, 12] });
    expect(proximoEnsaio(trimestral, [], "2026-08-10")?.data).toBe("2026-09-24");
  });

  it("pula um ensaio cancelado e vai para o seguinte", () => {
    const excecoes: Excecao[] = [
      {
        congregacao_id: "c1",
        data_original: "2026-09-04",
        cancelado: true,
        nova_data: null,
        nova_hora: null,
        motivo: null,
      },
    ];
    expect(proximoEnsaio(comum(), excecoes, "2026-08-08")?.data).toBe("2026-10-02");
  });

  it("devolve null quando a comum não tem padrão", () => {
    expect(proximoEnsaio(comum({ ensaio_ord: null }), [], "2026-08-01")).toBeNull();
  });
});

describe("ordenarEventos", () => {
  it("ordena por data e, no mesmo dia, por hora", () => {
    const base = {
      tipoId: "local",
      titulo: "x",
      congregacaoId: null,
      congregacaoNome: null,
      congregacaoSlug: null,
      descricao: null,
      gerado: false,
    };
    const eventos = [
      { ...base, id: "b", data: "2026-08-10", hora: "20:00:00" },
      { ...base, id: "c", data: "2026-08-11", hora: null },
      { ...base, id: "a", data: "2026-08-10", hora: "15:00:00" },
    ];
    expect(ordenarEventos(eventos).map((e) => e.id)).toEqual(["a", "b", "c"]);
  });

  it("põe evento sem hora depois dos com hora no mesmo dia", () => {
    const base = {
      tipoId: "local",
      titulo: "x",
      congregacaoId: null,
      congregacaoNome: null,
      congregacaoSlug: null,
      descricao: null,
      gerado: false,
    };
    const eventos = [
      { ...base, id: "semHora", data: "2026-08-10", hora: null },
      { ...base, id: "comHora", data: "2026-08-10", hora: "09:00:00" },
    ];
    expect(ordenarEventos(eventos).map((e) => e.id)).toEqual(["comHora", "semHora"]);
  });
});
