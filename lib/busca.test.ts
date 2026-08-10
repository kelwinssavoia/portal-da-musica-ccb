import { describe, expect, it } from "vitest";

import {
  agruparPorArea,
  normalizar,
  ordenarResultados,
  pontuar,
  pontuarCampos,
  primeiraDeCada,
  termosDe,
  type Resultado,
} from "@/lib/busca";

describe("normalizar", () => {
  it("tira acento e caixa", () => {
    expect(normalizar("Água Comprida")).toBe("agua comprida");
    expect(normalizar("ORGANISTAS")).toBe("organistas");
    expect(normalizar("Lavapés")).toBe("lavapes");
    expect(normalizar("Bragança")).toBe("braganca");
    expect(normalizar("Núcleo São João")).toBe("nucleo sao joao");
  });

  it("colapsa espaços e apara as pontas", () => {
    expect(normalizar("  ficha    de   músico  ")).toBe("ficha de musico");
  });

  it("aceita vazio e nulo sem quebrar", () => {
    expect(normalizar("")).toBe("");
    expect(normalizar(null as unknown as string)).toBe("");
  });
});

describe("termosDe", () => {
  it("separa a consulta em termos", () => {
    expect(termosDe("Ficha Organista")).toEqual(["ficha", "organista"]);
  });

  it("devolve vazio para consulta em branco", () => {
    expect(termosDe("   ")).toEqual([]);
  });

  it("descarta termo de uma letra quando há outro maior", () => {
    // Sem isso, "Cidade Teste A" casaria com tudo que tem a letra "a".
    expect(termosDe("teste a")).toEqual(["teste"]);
    expect(termosDe("braganca 1")).toEqual(["braganca"]);
  });

  it("mantém o termo de uma letra quando é o único", () => {
    expect(termosDe("a")).toEqual(["a"]);
  });
});

describe("pontuar", () => {
  const termos = ["agua"];

  it("pontua mais quando o texto começa com o termo", () => {
    expect(pontuar("Água Comprida", termos)).toBe(3);
  });

  it("pontua médio quando uma palavra começa com o termo", () => {
    expect(pontuar("Comum Água Comprida", termos)).toBe(2);
  });

  it("pontua baixo quando aparece no meio de uma palavra", () => {
    expect(pontuar("Paragua", termos)).toBe(1);
  });

  it("devolve zero quando não aparece", () => {
    expect(pontuar("Centro", termos)).toBe(0);
  });

  it("exige todos os termos, não qualquer um", () => {
    expect(pontuar("Pedido de avaliação de organistas", ["ficha", "organista"])).toBe(0);
    expect(pontuar("Ficha de avaliação de organistas", ["ficha", "organista"])).toBeGreaterThan(0);
  });

  it("acha mesmo com acento na consulta ou no texto", () => {
    expect(pontuar("Agua Comprida", ["água"])).toBeGreaterThan(0);
    expect(pontuar("Água Comprida", ["agua"])).toBeGreaterThan(0);
  });

  it("devolve zero sem termos", () => {
    expect(pontuar("qualquer coisa", [])).toBe(0);
  });
});

describe("pontuarCampos", () => {
  it("dá muito mais peso ao título que aos outros campos", () => {
    const noTitulo = pontuarCampos(["Ensaio local", "descrição qualquer"], ["ensaio"]);
    const naDescricao = pontuarCampos(["Outra coisa", "fala de ensaio aqui"], ["ensaio"]);
    expect(noTitulo).toBeGreaterThan(naDescricao);
  });

  it("acha pela descrição quando o título não casa", () => {
    expect(pontuarCampos(["Centro", "Rua das Flores"], ["flores"])).toBeGreaterThan(0);
  });

  it("devolve zero quando nada casa", () => {
    expect(pontuarCampos(["Centro", "Rua das Flores"], ["organista"])).toBe(0);
  });
});

function res(over: Partial<Resultado>): Resultado {
  return {
    area: "Congregações",
    titulo: "x",
    sub: "",
    href: "#",
    pontos: 1,
    ...over,
  };
}

describe("ordenarResultados", () => {
  it("ordena por relevância", () => {
    const r = ordenarResultados([
      res({ titulo: "fraco", pontos: 1 }),
      res({ titulo: "forte", pontos: 30 }),
      res({ titulo: "medio", pontos: 10 }),
    ]);
    expect(r.map((x) => x.titulo)).toEqual(["forte", "medio", "fraco"]);
  });

  it("desempata em ordem alfabética do português", () => {
    const r = ordenarResultados([
      res({ titulo: "Zebra", pontos: 5 }),
      res({ titulo: "Água", pontos: 5 }),
      res({ titulo: "Centro", pontos: 5 }),
    ]);
    expect(r.map((x) => x.titulo)).toEqual(["Água", "Centro", "Zebra"]);
  });
});

describe("agruparPorArea", () => {
  it("agrupa mantendo a relevância dentro do grupo", () => {
    const grupos = agruparPorArea([
      res({ area: "Congregações", titulo: "Centro", pontos: 5 }),
      res({ area: "Secretaria", titulo: "Ficha", pontos: 30 }),
      res({ area: "Congregações", titulo: "Penha", pontos: 20 }),
    ]);

    expect(grupos.map((g) => g.area)).toEqual(["Secretaria", "Congregações"]);
    expect(grupos[1].itens.map((i) => i.titulo)).toEqual(["Penha", "Centro"]);
  });

  it("devolve vazio quando não há resultado", () => {
    expect(agruparPorArea([])).toEqual([]);
  });
});

describe("primeiraDeCada", () => {
  it("mantém só a primeira ocorrência de cada chave, na ordem original", () => {
    const eventos = [
      { tipo: "local", local: "lavapes", data: "2026-08-15" },
      { tipo: "local", local: "lavapes", data: "2026-09-19" },
      { tipo: "local", local: "centro", data: "2026-09-04" },
      { tipo: "regional", local: "lavapes", data: "2026-10-01" },
    ];
    const unicos = primeiraDeCada(eventos, (e) => `${e.tipo}|${e.local}`);

    expect(unicos.map((e) => e.data)).toEqual(["2026-08-15", "2026-09-04", "2026-10-01"]);
  });

  it("devolve vazio para lista vazia", () => {
    expect(primeiraDeCada([], (x) => String(x))).toEqual([]);
  });
});

describe("limite por área", () => {
  it("corta em `limite` mas informa o total de verdade", () => {
    const muitos = Array.from({ length: 12 }, (_, i) =>
      res({ area: "Calendário", titulo: `Evento ${i}`, pontos: 12 - i }),
    );
    const [grupo] = agruparPorArea(muitos, 8);

    expect(grupo.itens).toHaveLength(8);
    expect(grupo.total).toBe(12);
  });

  it("não corta quando cabe", () => {
    const [grupo] = agruparPorArea([res({}), res({})], 8);
    expect(grupo.itens).toHaveLength(2);
    expect(grupo.total).toBe(2);
  });
});
