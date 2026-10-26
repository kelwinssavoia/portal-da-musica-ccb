/**
 * Tipos do banco, espelhando `supabase/migrations/`.
 *
 * Escrito à mão porque o projeto Supabase ainda não existe. Assim que existir,
 * regenerar com:
 *
 *   npx supabase gen types typescript --project-id <ref> > lib/tipos-banco.ts
 *
 * Se este arquivo divergir das migrações, a migração é que está certa.
 */

export type AppRole = "admin" | "editor";

export type PortalArea =
  | "congregacoes"
  | "eventos"
  | "circulares"
  | "arquivos"
  | "duvidas"
  | "ajustes"
  | "usuarios"
  | "rodizios";

export type TipoArquivo =
  | "pdf"
  | "planilha"
  | "documento"
  | "formulario"
  | "pasta"
  | "video"
  | "link";

/** 'upload' = hospedado no Storage do portal; 'link' = endereço externo. */
export type OrigemArquivo = "upload" | "link";

export type Perfil = {
  id: string;
  nome: string;
  email: string;
  papel: AppRole;
  ativo: boolean;
  criado_em: string;
};

export type Cidade = {
  id: string;
  nome: string;
  /** Sigla do estado. Uma regional pode atravessar divisa. */
  uf: string | null;
  ativo: boolean;
};

export type Congregacao = {
  id: string;
  slug: string;
  nome: string;
  cidade_id: string | null;
  endereco: string;
  maps_url: string | null;
  foto_path: string | null;
  /** 1..4 = n-ésima do mês; 5 = último. */
  ensaio_ord: number | null;
  ensaio_dow: number | null;
  ensaio_hora: string | null;
  /** null = todo mês. Lista 1..12 quando o ensaio não é mensal. */
  ensaio_meses: number[] | null;
  observacoes: string | null;
  ordem: number;
  ativo: boolean;
  atualizado_em: string;
};

/** Culto oficial de uma comum, um por dia da semana. */
export type CongregacaoCulto = {
  congregacao_id: string;
  /** 0 = domingo … 6 = sábado. */
  dow: number;
  hora: string | null;
};

export type TipoEvento = {
  id: string;
  label: string;
  cor: string;
  cor_suave: string;
  ordem: number;
};

export type EventoRow = {
  id: string;
  tipo_id: string;
  titulo: string;
  data: string;
  hora: string | null;
  congregacao_id: string | null;
  descricao: string | null;
  ativo: boolean;
};

export type EnsaioExcecao = {
  id: string;
  congregacao_id: string;
  data_original: string;
  cancelado: boolean;
  nova_data: string | null;
  nova_hora: string | null;
  motivo: string | null;
};

export type Circular = {
  id: string;
  numero: string;
  titulo: string;
  resumo: string | null;
  data: string;
  origem: OrigemArquivo;
  arquivo_path: string | null;
  arquivo_nome: string | null;
  url: string | null;
  publicado: boolean;
};

export type ArquivoCategoria = {
  id: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  ativo: boolean;
};

export type Arquivo = {
  id: string;
  categoria_id: string;
  titulo: string;
  descricao: string | null;
  tipo: TipoArquivo;
  origem: OrigemArquivo;
  arquivo_path: string | null;
  arquivo_nome: string | null;
  tamanho_bytes: number | null;
  url: string | null;
  /** Incrementa a cada substituição; vira `?v=` no endereço público. */
  versao: number;
  prazo: string | null;
  /** Conteúdo placeholder, ainda não conferido pela secretaria. */
  exemplo: boolean;
  ordem: number;
  ativo: boolean;
  atualizado_em: string;
};

export type Duvida = {
  id: string;
  pergunta: string;
  resposta: string;
  ordem: number;
  ativo: boolean;
};

export type Ajuste = {
  chave: string;
  valor: string;
  descricao: string | null;
};

/** Organista de uma comum. Só existe no CMS — não há leitura pública. */
export type Organista = {
  id: string;
  congregacao_id: string;
  nome: string;
  /** Dias da semana (0 = domingo) em que não pode tocar. Padrão dos próximos rodízios. */
  dows_indisponiveis: number[];
  ativo: boolean;
  criado_em: string;
};

export type Rodizio = {
  id: string;
  congregacao_id: string;
  inicio: string;
  fim: string;
  observacoes: string | null;
  /** Compõe o link público `/rodizio/<token>`. */
  token: string;
  criado_em: string;
  atualizado_em: string;
};

/** Participante de um rodízio, com as restrições usadas nele. */
export type RodizioOrganista = {
  rodizio_id: string;
  organista_id: string;
  dows_indisponiveis: number[];
  datas_indisponiveis: string[];
};

/** Um culto do período e quem toca nele. */
export type RodizioEscala = {
  rodizio_id: string;
  data: string;
  hora: string | null;
  organista_id: string | null;
  /** Definida à mão antes de gerar; o sorteio não mexe. */
  fixo: boolean;
};

/** O que `rodizio_publico(token)` devolve para o link das organistas. */
export type RodizioPublico = {
  inicio: string;
  fim: string;
  observacoes: string | null;
  congregacao: { id: string; nome: string };
  organistas: { id: string; nome: string }[];
  escala: { data: string; hora: string | null; organista_id: string | null }[];
};

/** Campos que o banco preenche sozinho e não vão no insert. */
type Gerados = "id" | "criado_em" | "atualizado_em";

/**
 * `Relationships` é obrigatório: sem ele o cliente do Supabase não reconhece o
 * schema e todas as consultas passam a devolver `never`.
 */
type Tabela<Row, Obrigatorios extends keyof Row = never> = {
  Row: Row;
  Insert: Partial<Omit<Row, Gerados>> & Pick<Row, Obrigatorios>;
  Update: Partial<Omit<Row, Gerados>>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      perfis: Tabela<Perfil, "id" | "email">;
      perfil_areas: Tabela<{ perfil_id: string; area: PortalArea }, "perfil_id" | "area">;
      cidades: Tabela<Cidade, "nome">;
      congregacoes: Tabela<Congregacao, "slug" | "nome">;
      congregacao_cultos: Tabela<CongregacaoCulto, "congregacao_id" | "dow">;
      tipos_evento: Tabela<TipoEvento, "id" | "label" | "cor" | "cor_suave">;
      eventos: Tabela<EventoRow, "tipo_id" | "titulo" | "data">;
      ensaio_excecoes: Tabela<EnsaioExcecao, "congregacao_id" | "data_original">;
      circulares: Tabela<Circular, "numero" | "titulo" | "data">;
      arquivo_categorias: Tabela<ArquivoCategoria, "nome">;
      arquivos: Tabela<Arquivo, "categoria_id" | "titulo">;
      duvidas: Tabela<Duvida, "pergunta" | "resposta">;
      ajustes: Tabela<Ajuste, "chave">;
      organistas: Tabela<Organista, "congregacao_id" | "nome">;
      rodizios: Tabela<Rodizio, "congregacao_id" | "inicio" | "fim">;
      rodizio_organistas: Tabela<RodizioOrganista, "rodizio_id" | "organista_id">;
      rodizio_escala: Tabela<RodizioEscala, "rodizio_id" | "data">;
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      pode_editar: { Args: { a: PortalArea }; Returns: boolean };
      salvar_rodizio: { Args: { dados: unknown }; Returns: string };
      rodizio_publico: { Args: { p_token: string }; Returns: RodizioPublico | null };
    };
    Enums: {
      app_role: AppRole;
      portal_area: PortalArea;
      tipo_arquivo: TipoArquivo;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
