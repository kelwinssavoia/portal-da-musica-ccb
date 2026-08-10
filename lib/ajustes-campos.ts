/**
 * Campos de texto editáveis na tela de Ajustes, na ordem em que aparecem.
 *
 * Fica fora de `acoes.ts` porque um arquivo `"use server"` só pode exportar
 * funções assíncronas — exportar esta lista de lá quebrava a tela inteira.
 */
export const CAMPOS_AJUSTES: {
  chave: string;
  rotulo: string;
  ajuda?: string;
  longo?: boolean;
}[] = [
  { chave: "instituicao", rotulo: "Faixa institucional", ajuda: "Texto da barra escura do topo." },
  { chave: "regiao", rotulo: "Região" },
  { chave: "titulo", rotulo: "Título do portal" },
  { chave: "subtitulo", rotulo: "Subtítulo" },
  { chave: "localidade", rotulo: "Localidade (rodapé)" },
  {
    chave: "contato",
    rotulo: "Contato (rodapé)",
    ajuda: "Deixe vazio para não aparecer. Nunca use dado pessoal de irmão.",
  },
  { chave: "hero_texto", rotulo: "Apresentação da tela inicial", longo: true },
  { chave: "rodape_nota", rotulo: "Nota do rodapé", longo: true },
];
