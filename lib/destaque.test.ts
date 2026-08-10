import { describe, expect, it } from "vitest";

import { amanhaDe, destaqueDe } from "@/lib/destaque";

describe("amanhaDe", () => {
  it("avança um dia comum", () => {
    expect(amanhaDe("2026-08-10")).toBe("2026-08-11");
  });

  it("vira o mês", () => {
    expect(amanhaDe("2026-08-31")).toBe("2026-09-01");
  });

  it("vira o ano", () => {
    expect(amanhaDe("2026-12-31")).toBe("2027-01-01");
  });

  it("trata fevereiro em ano comum e em bissexto", () => {
    expect(amanhaDe("2026-02-28")).toBe("2026-03-01");
    expect(amanhaDe("2028-02-28")).toBe("2028-02-29");
    expect(amanhaDe("2028-02-29")).toBe("2028-03-01");
  });
});

describe("destaqueDe", () => {
  const hoje = "2026-08-10";

  it("marca hoje", () => {
    expect(destaqueDe("2026-08-10", hoje)).toBe("hoje");
  });

  it("marca amanhã", () => {
    expect(destaqueDe("2026-08-11", hoje)).toBe("amanha");
  });

  it("não marca depois de amanhã nem ontem", () => {
    expect(destaqueDe("2026-08-12", hoje)).toBeNull();
    expect(destaqueDe("2026-08-09", hoje)).toBeNull();
  });

  it("funciona na virada de mês", () => {
    expect(destaqueDe("2026-09-01", "2026-08-31")).toBe("amanha");
  });
});
